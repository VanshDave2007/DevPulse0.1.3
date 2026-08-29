/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  AIChatMessage,
  AIActionType,
  CodeSmell,
  SupportedLanguage,
} from '../types';
import { buildPersonalizedAiContext } from '../engine/personalization';
import { ProjectMemoryService } from '../services/projectMemoryService';
import { logApiMetric } from '../services/telemetry';

export interface UsePulseAiOptions {
  scope?: 'observatory' | 'analyzer' | 'learn' | 'general';
  onChunk?: (text: string) => void;
  onSuccess?: (response: string) => void;
  onError?: (error: Error) => void;
}

export interface SendAiRequestOptions {
  action: AIActionType | string;
  question?: string;
  code?: string;
  language?: SupportedLanguage;
  file?: string;
  module?: string;
  smell?: CodeSmell;
  metricType?: string;
  dimension?: any;
}

export function usePulseAI(options: UsePulseAiOptions = {}) {
  const {
    code: globalCode,
    language: globalLanguage,
    fileName: globalFileName,
    analysis,
    aiMessages,
    setAiMessages,
    isAiLoading: isGlobalAiLoading,
    setIsAiLoading: setGlobalAiLoading,
    personalizationProfile,
  } = useApp();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestOptionsRef = useRef<SendAiRequestOptions | null>(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    setGlobalAiLoading(false);
  }, [setGlobalAiLoading]);

  const sendRequest = useCallback(
    async (requestOptions: SendAiRequestOptions): Promise<string | null> => {
      // Cancel previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      lastRequestOptionsRef.current = requestOptions;

      setIsLoading(true);
      setIsStreaming(true);
      setError(null);
      setGlobalAiLoading(true);

      const startTime = performance.now();

      const activeCode = requestOptions.code !== undefined ? requestOptions.code : globalCode;
      const activeLanguage = requestOptions.language !== undefined ? requestOptions.language : globalLanguage;
      const activeFile = requestOptions.file || globalFileName || 'active_file';
      const activeModule = requestOptions.module || ProjectMemoryService.extractModuleName(activeFile);
      const activeAction = requestOptions.action;
      const userPrompt = requestOptions.question || `Analyze ${activeAction} for current code.`;

      // Fetch relevant Project Memory items based on the file or module currently being analyzed
      const activeSymbol = (requestOptions.smell as any)?.symbol || requestOptions.smell?.title;
      const relevantMemories = ProjectMemoryService.getRelevantMemory({
        file: activeFile,
        module: activeModule,
        symbol: activeSymbol,
        category: typeof activeAction === 'string' ? activeAction : undefined,
        query: userPrompt,
        code: activeCode,
      });
      const formattedProjectRules = ProjectMemoryService.formatContextForAI(relevantMemories);

      // Build personalized context
      const personalizedContext = buildPersonalizedAiContext(personalizationProfile, {
        action: activeAction,
        dimension: requestOptions.dimension,
        code: activeCode,
        language: activeLanguage,
      });

      const userMsgId = `user-${Date.now()}`;
      const aiMsgId = `ai-${Date.now()}`;

      // Synchronize with global chat messages if applicable
      setAiMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          content: userPrompt,
          actionType: activeAction as AIActionType,
          timestamp: Date.now(),
        },
      ]);

      const historyPayload = aiMessages
        .filter((m) => m.id !== 'welcome' && !m.isError)
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content }));

      const payload = {
        action: activeAction,
        code: activeCode,
        language: activeLanguage,
        file: activeFile,
        fileName: activeFile,
        module: activeModule,
        metrics: analysis?.metrics,
        issues: analysis?.smells,
        question: userPrompt,
        learningLevel: personalizedContext.effectiveLevel,
        personalization: {
          knowledgeLevel: personalizedContext.effectiveLevel,
          explanationDepth: personalizedContext.depthScore,
          systemDirective: personalizedContext.systemDirective,
          preferences: personalizationProfile.preferences,
          skillDimensions: personalizationProfile.skill_dimensions,
        },
        projectMemory: relevantMemories,
        formattedProjectRules,
        history: historyPayload,
      };

      try {
        // Attempt streaming SSE endpoint first
        const streamRes = await fetch('/api/ai/pulse/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (streamRes.ok && streamRes.body) {
          let accumulatedText = '';
          let assistantMsgAdded = false;

          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                  if (parsed.text) {
                    accumulatedText += parsed.text;
                    options.onChunk?.(accumulatedText);

                    if (!assistantMsgAdded) {
                      assistantMsgAdded = true;
                      setAiMessages((prev) => [
                        ...prev,
                        {
                          id: aiMsgId,
                          role: 'assistant',
                          content: accumulatedText,
                          actionType: activeAction as AIActionType,
                          timestamp: Date.now(),
                        },
                      ]);
                    } else {
                      setAiMessages((prev) =>
                        prev.map((m) => (m.id === aiMsgId ? { ...m, content: accumulatedText } : m))
                      );
                    }
                  }
                } catch {
                  // Fallback for raw text chunks
                  if (dataStr && !dataStr.startsWith('{')) {
                    accumulatedText += dataStr;
                    options.onChunk?.(accumulatedText);
                  }
                }
              }
            }
          }

          if (accumulatedText.trim().length > 0) {
            setLastResponse(accumulatedText);
            options.onSuccess?.(accumulatedText);

            logApiMetric({
              endpoint: '/api/ai/pulse/stream',
              method: 'POST',
              durationMs: performance.now() - startTime,
              status: 200,
              category: 'ai',
              payloadSummary: `Action: ${activeAction} (${personalizedContext.effectiveLevel})`,
            });

            setIsLoading(false);
            setIsStreaming(false);
            setGlobalAiLoading(false);
            return accumulatedText;
          }
        }

        // Fallback to standard non-streaming POST
        const fallbackRes = await fetch('/api/ai/pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${fallbackRes.status}: Failed to generate AI response`);
        }

        const data = await fallbackRes.json();
        const responseText = data.response || 'No response generated.';

        setAiMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: 'assistant',
            content: responseText,
            actionType: activeAction as AIActionType,
            timestamp: Date.now(),
          },
        ]);

        setLastResponse(responseText);
        options.onSuccess?.(responseText);

        logApiMetric({
          endpoint: '/api/ai/pulse',
          method: 'POST',
          durationMs: performance.now() - startTime,
          status: 200,
          category: 'ai',
          payloadSummary: `Action: ${activeAction} (fallback)`,
        });

        setIsLoading(false);
        setIsStreaming(false);
        setGlobalAiLoading(false);
        return responseText;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return null;
        }

        const errMsg = err.message || 'Unable to communicate with Pulse AI Service.';
        setError(errMsg);
        options.onError?.(err);

        setAiMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `**Pulse AI Error:** ${errMsg}\n\nPlease verify your network connection or retry the request.`,
            isError: true,
            timestamp: Date.now(),
            retryAction: {
              action: activeAction as AIActionType,
              question: userPrompt,
            },
          },
        ]);

        logApiMetric({
          endpoint: '/api/ai/pulse',
          method: 'POST',
          durationMs: performance.now() - startTime,
          status: 'error',
          category: 'ai',
          details: errMsg,
        });

        setIsLoading(false);
        setIsStreaming(false);
        setGlobalAiLoading(false);
        return null;
      }
    },
    [
      globalCode,
      globalLanguage,
      globalFileName,
      analysis,
      aiMessages,
      personalizationProfile,
      setAiMessages,
      setGlobalAiLoading,
      options,
    ]
  );

  const retry = useCallback(() => {
    if (lastRequestOptionsRef.current) {
      return sendRequest(lastRequestOptionsRef.current);
    }
    return Promise.resolve(null);
  }, [sendRequest]);

  // High-level standardized convenience methods
  const explainCode = useCallback(
    (customPrompt?: string, codeOverride?: string, langOverride?: SupportedLanguage) => {
      return sendRequest({
        action: 'explain',
        question: customPrompt || 'Explain the purpose and flow of this code.',
        code: codeOverride,
        language: langOverride,
        dimension: 'code_comprehension',
      });
    },
    [sendRequest]
  );

  const findProblems = useCallback(
    (codeOverride?: string, langOverride?: SupportedLanguage) => {
      return sendRequest({
        action: 'problems',
        question: 'Identify key bugs, edge-case failures, and architectural issues in this code.',
        code: codeOverride,
        language: langOverride,
        dimension: 'debugging',
      });
    },
    [sendRequest]
  );

  const improveCode = useCallback(
    (codeOverride?: string, langOverride?: SupportedLanguage) => {
      return sendRequest({
        action: 'improve',
        question: 'Propose refactoring improvements to simplify logic, reduce complexity, and improve readability.',
        code: codeOverride,
        language: langOverride,
        dimension: 'architecture',
      });
    },
    [sendRequest]
  );

  const fixSmell = useCallback(
    (smell: CodeSmell, codeOverride?: string, langOverride?: SupportedLanguage) => {
      return sendRequest({
        action: 'fix_issue',
        question: `Provide a clean, idiomatic fix for the issue "${smell.title}" at line ${smell.line} (${smell.problem}).`,
        code: codeOverride,
        language: langOverride,
        smell,
        dimension: 'debugging',
      });
    },
    [sendRequest]
  );

  const askTutor = useCallback(
    (question: string, context?: { code?: string; language?: SupportedLanguage; topic?: string }) => {
      return sendRequest({
        action: 'chat',
        question,
        code: context?.code,
        language: context?.language,
        dimension: 'programming',
      });
    },
    [sendRequest]
  );

  return {
    sendRequest,
    explainCode,
    findProblems,
    improveCode,
    fixSmell,
    askTutor,
    cancel,
    retry,
    isLoading: isLoading || isGlobalAiLoading,
    isStreaming,
    error,
    lastResponse,
  };
}
