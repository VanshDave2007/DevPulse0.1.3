import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { requireAuth, optionalAuth, AuthRequest } from "./src/middleware/auth.ts";
import {
  getOrCreateUser,
  getUserByUid,
  getUserByEmail,
  createLocalUser,
  updateUserProfile,
} from "./src/db/users.ts";
import {
  saveAnalysisHistory,
  getUserAnalysisHistory,
  getAnalysisHistoryById,
  deleteAnalysisHistory,
  clearUserAnalysisHistory,
  createShareLink,
  revokeShareLink,
  getSharedAnalysis,
  getProjectTrends,
} from "./src/db/history.ts";
import {
  saveOrUpdateAiConversation,
  getAiConversations,
  getAiConversationById,
  deleteAiConversation,
  clearUserAiConversations,
} from "./src/db/ai.ts";
import {
  getLearnProgress,
  getAllUserLearnProgress,
  saveOrUpdateLearnProgress,
} from "./src/db/learn.ts";
import {
  logNotification,
  getUserNotifications,
} from "./src/db/notifications.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Pulse AI will return informational fallback guidance.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "DevPulse Intelligence Engine",
    version: "1.0.0",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// In-Memory Fast LRU Cache for AI completions
class LruResponseCache {
  private map = new Map<string, { text: string; timestamp: number }>();
  constructor(private maxEntries = 120, private ttlMs = 1000 * 60 * 45) {}

  get(key: string): string | undefined {
    const item = this.map.get(key);
    if (!item) return undefined;
    if (Date.now() - item.timestamp > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh LRU
    this.map.delete(key);
    this.map.set(key, item);
    return item.text;
  }

  set(key: string, text: string) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
    this.map.set(key, { text, timestamp: Date.now() });
  }
}

const pulseAiCache = new LruResponseCache();

// Candidate models prioritized for speed, quality, and fast latency
const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

function buildAiPromptContext(body: any) {
  const {
    action = "chat",
    code = "",
    language = "python",
    metrics,
    issues = [],
    question = "",
    history = [],
    learningLevel = "intermediate",
    developerLevel,
    DeveloperLevel,
    explanationDepth,
    ExplanationDepth,
    personalization,
  } = body;

  // Normalize developer knowledge level from all potential naming formats
  let rawLevel =
    DeveloperLevel ||
    developerLevel ||
    personalization?.knowledgeLevel ||
    personalization?.knowledge_level ||
    learningLevel ||
    "intermediate";

  if (typeof rawLevel === "string") {
    rawLevel = rawLevel.toLowerCase();
  }
  if (rawLevel === "advanced") rawLevel = "expert";

  // Normalize explanation depth (1-5 or high/medium/low)
  const rawDepth =
    ExplanationDepth ??
    explanationDepth ??
    personalization?.explanationDepth ??
    personalization?.preferences?.explanation_depth ??
    (rawLevel === "beginner" ? 5 : rawLevel === "expert" ? 2 : 3);

  let depthNumber = typeof rawDepth === "number" ? rawDepth : rawDepth === "high" ? 5 : rawDepth === "low" ? 2 : 3;

  // Trim code safely if huge (max 1000 lines)
  let trimmedCode = code;
  if (typeof code === "string" && code.split("\n").length > 1000) {
    const lines = code.split("\n");
    trimmedCode = lines.slice(0, 1000).join("\n") + "\n// ... [Remaining lines truncated for fast analysis]";
  }

  // Dynamic intent & level inference
  const lowerQ = (question || "").toLowerCase();
  const isSimplificationRequest =
    lowerQ.includes("explain simply") ||
    lowerQ.includes("simple terms") ||
    lowerQ.includes("like i'm 5") ||
    lowerQ.includes("eli5") ||
    lowerQ.includes("beginner") ||
    lowerQ.includes("i don't understand") ||
    lowerQ.includes("dont understand") ||
    lowerQ.includes("what does this mean") ||
    lowerQ.includes("why is this happening") ||
    lowerQ.includes("confused");

  const isDeepRequest =
    lowerQ.includes("explain technically") ||
    lowerQ.includes("go deeper") ||
    lowerQ.includes("how does it work internally") ||
    lowerQ.includes("under the hood") ||
    lowerQ.includes("internals") ||
    lowerQ.includes("assembly") ||
    lowerQ.includes("memory layout") ||
    lowerQ.includes("low level") ||
    lowerQ.includes("staff engineer");

  const isFrustrated =
    lowerQ.includes("i'm stuck") ||
    lowerQ.includes("im stuck") ||
    lowerQ.includes("this isn't working") ||
    lowerQ.includes("not working") ||
    lowerQ.includes("keep getting error") ||
    lowerQ.includes("bad at programming") ||
    lowerQ.includes("i give up");

  const isHintRequest =
    lowerQ.includes("hint") ||
    lowerQ.includes("give me a clue") ||
    lowerQ.includes("guide me") ||
    lowerQ.includes("don't give me the answer") ||
    lowerQ.includes("dont give me the answer");

  let effectiveLevel = rawLevel;
  if (isSimplificationRequest) {
    effectiveLevel = "beginner";
    depthNumber = Math.max(depthNumber, 4);
  } else if (isDeepRequest) {
    effectiveLevel = "expert";
  }

  // Level instruction adhering strictly to the 3-level explanation engine
  let levelInstruction = "";
  if (effectiveLevel === "beginner") {
    levelInstruction = `AUDIENCE: Beginner (Knowledge Level: Beginner | Explanation Depth: ${depthNumber}/5).
- EXPLANATION STRUCTURE (Strict):
  1. What does it mean? (Crystal-clear definition with no unexplained jargon)
  2. Why is this a problem? (Everyday intuition & risk)
  3. Simple everyday analogy (Relatable mental model: e.g. recipe, recipe card, traffic light, unlocked window)
  4. How to fix it (Clear, practical step-by-step guidance)
  5. Improved code (Clean, working code block with line explanations)
  6. Why the new code is better (Readable, safe & maintainable)
- Use encouraging, non-condescending tone.`;
  } else if (effectiveLevel === "expert") {
    levelInstruction = `AUDIENCE: Expert / Senior Staff Engineer (Knowledge Level: Expert | Explanation Depth: ${depthNumber}/5).
- EXPLANATION STRUCTURE (Strict):
  1. Evidence & Metrics (Precise AST numbers, complexity thresholds, Big-O metrics, cache/concurrency implications)
  2. Direct Recommendation (Concise technical instructions without tutorial material)
  3. Potential Refactoring Strategy (Architecture impact, modular decoupling, memory allocation, invariant guarantees)
- Tone: Highly concise, direct, and technically rigorous.`;
  } else {
    levelInstruction = `AUDIENCE: Intermediate Developer (Knowledge Level: Intermediate | Explanation Depth: ${depthNumber}/5).
- EXPLANATION STRUCTURE (Strict):
  1. Issue (Direct summary of the problem and offending symbol/line)
  2. Cause (Underlying mechanism or anti-pattern)
  3. Recommendation (Actionable refactoring advice)
  4. Code Example (Idiomatic before-and-after code)
- Tone: Pragmatic balance of clean code principles and engineering trade-offs.`;
  }

  const systemInstruction = `You are DevPulse AI, a friendly, patient, and highly knowledgeable programming mentor and developer intelligence companion ("See the Code. Find the Pulse.").

CORE TEACHING PHILOSOPHY & MENTORSHIP:
1. Patient Mentor Mindset:
   - Act as a patient, encouraging coding teacher. Treat every question as a legitimate new request, even if rephrased. Never say "I already explained that."
   - Beginner Confidence Mode: NEVER use condescending language ("obviously", "this is trivial", "you should know", "simply", "just", "anyone can see", "easy").
   - Use encouraging, accurate phrasing: "This is a common mistake," "Let's break it down one step at a time," "You're close — the main issue is...", "Let's inspect line by line."

2. Standard Everyday Analogies:
   - Function → A recipe (ingredients in, cooking process, delicious dish returned).
   - Loop → A chef preparing 10 identical orders without re-writing the recipe 10 times.
   - Conditional → A traffic light decision (if green, go; else if yellow, caution; else, stop).
   - Variable → A labeled storage box holding a value.
   - Data Types → Different kinds of storage containers (numbers for math, envelopes for text, switches for booleans, trains/lists for ordered items).
   - Recursion → Standing between two parallel mirrors, or Russian nesting dolls with a base case to stop.
   - Complexity / Branching → A highway with many confusing detour forks and roundabouts.
   - Coupling / Modules → Rooms in a house connected by too many open doors.
   - Security Vulnerability → An unlocked ground-floor window with the latch open.
   - Dead Code → Old unworn clothes cluttering the bedroom closet.
   - Always follow an analogy with the real programming explanation and concrete code example.

3. Debugging Coach & Learning Preservation:
   - 6-Step Debugging Framework: Observe → Locate → Understand → Test → Fix → Verify.
   - When asked to fix code or debug: explain what's wrong → provide a hint/explanation → provide the corrected code → explain why the fix works, and optionally ask "Would you like to try fixing it yourself first?". Never withhold the complete answer if explicitly requested.
   - Frustration Handling: When the learner is stuck or frustrated, respond practically ("Let's ignore the whole program for a moment and focus on the single line causing the issue") and guide them step-by-step without artificial praise.

4. Deterministic Anti-Hallucination & Grounding:
   - The DevPulse analyzer is the sole source of truth for AST, syntax, complexity (${metrics?.cyclomaticComplexity ?? 'N/A'}), maintainability score (${metrics?.maintainabilityScore ?? 'N/A'}/100), health (${metrics?.healthScore ?? 'N/A'}/100), file paths, line numbers, and detected smells.
   - Never invent line numbers, variables, or CVEs that are not in the real analysis or code.
   - For complexity and code smells, always cite the real numbers: e.g. "Actual complexity: ${metrics?.cyclomaticComplexity ?? 1}, Threshold: 10, Assessment: ${metrics && metrics.cyclomaticComplexity > 10 ? 'High' : 'Normal'}".

5. ${levelInstruction}
6. Always format code cleanly in standard markdown code blocks (\`\`\`${language}).`;

  // Context summary
  const topIssues = Array.isArray(issues) ? issues.slice(0, 6) : [];
  const contextSummary = (trimmedCode || metrics)
    ? `\nActive Codebase Summary (Deterministic Analyzer Results):
Language: ${language} | LOC: ${metrics?.loc || (trimmedCode ? trimmedCode.split('\n').length : 0)}
Cyclomatic Complexity: ${metrics?.cyclomaticComplexity ?? 'N/A'} | Cognitive Complexity: ${metrics?.cognitiveComplexity ?? 'N/A'} | Maintainability Index: ${metrics?.maintainabilityScore ?? 'N/A'}/100 | Health: ${metrics?.healthScore ?? 'N/A'}/100
Active Diagnostic Smells: ${topIssues.map((i: any) => `[${(i.severity || 'warn').toUpperCase()}] Line ${i.line}: ${i.title} (${i.description})`).join("; ") || "Clean - No active smells"}
`
    : "";

  let userPrompt = "";

  // Frustration override in chat if user expresses feeling stuck
  if (isFrustrated && action === "chat") {
    userPrompt = `${contextSummary}
User is feeling stuck / frustrated: "${question}"

Task: Respond as a patient programming mentor following the Debugging Coach methodology.
1. Calm encouragement (de-escalate: "Let's pause and isolate the single line causing the issue").
2. Focus strictly on the primary issue at line ${topIssues[0]?.line || 1}.
3. 3-step practical action plan.
4. Offer a progressive hint or the complete solution.`;
  } else {
    switch (action) {
      case "analogy":
        userPrompt = `${contextSummary}
Task: Explain the following ${language} code or concept using an intuitive everyday analogy (e.g. recipe for functions, chef plating for loops, traffic lights for conditionals, labeled boxes for variables).
${question ? `Topic / Question: "${question}"` : ""}

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
# Concept Name
## Simple Definition
## Think of It Like... (Everyday Analogy)
## Connecting Analogy to Code
## Code Example
\`\`\`${language}
// Concrete code
\`\`\`
## How It Works
## Common Mistake to Avoid
## Try It Yourself`;
        break;

      case "step_by_step":
        userPrompt = `${contextSummary}
Task: Provide an educational, line-by-line sequential execution walkthrough of this ${language} code.
${question ? `Specific Focus: "${question}"` : ""}

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
# 🧭 Step-by-Step Execution Walkthrough
- Break down each meaningful line in sequential execution order.
- For each step: show the exact line, what happens in computer memory/variables, and how control flows to the next statement.
- Conclude with a summary of the overall input-to-output journey.`;
        break;

      case "debug_coach":
        userPrompt = `${contextSummary}
Task: Guide the learner through debugging this ${language} code using the 6-Step Debugging Coach Framework (Observe → Locate → Understand → Test → Fix → Verify).
Diagnostic Issue: "${question || (topIssues[0] ? `${topIssues[0].title} on Line ${topIssues[0].line}` : "Diagnose logic and runtime edge cases")}"

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
# 🛠️ Debugging Coach Guidance
## 1. Observe Without Panic (What happened?)
## 2. Locate the Origin (Exact file and Line from real analyzer)
## 3. Understand Root Cause (Why it failed)
## 4. Test a Focused Guess
## 5. Clean Fix & Corrected Code
\`\`\`${language}
// Corrected snippet
\`\`\`
## 6. Verify & Prevent Future Regressions
*Ask: "Would you like to try fixing this yourself first with a hint, or need a deeper explanation?"*`;
        break;

      case "hint":
        userPrompt = `${contextSummary}
Task: Provide a progressive hint for the learner working on this ${language} code.
Question / Current Problem: "${question || "How to resolve the current diagnostic smell"}"

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
Provide:
- **Hint 1 (General Clue):** Gentle nudge pointing in the right direction without revealing the answer.
- **Hint 2 (Underlying Concept):** Which programming rule, syntax requirement, or data structure is involved.
- **Hint 3 (Location & Token):** The exact line ${topIssues[0]?.line || 1} and construct to inspect.
- **Hint 4 (Correction Outline):** How to structure the fix.
- **Full Solution:** Provide the final corrected code block with an explanation of why it works.`;
        break;

      case "concept":
        userPrompt = `${contextSummary}
Task: Explain the core programming concept (${question || "demonstrated in this code"}) using the standard DevPulse Concept Format.

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure strictly as:
# Concept Name
## Simple Definition
## Think of It Like...
## Example
\`\`\`${language}
// Clear minimal example
\`\`\`
## How It Works
## Output
## Common Mistake
## Remember
## Try It Yourself`;
        break;

      case "practice":
        userPrompt = `${contextSummary}
Task: Generate a hands-on, practice-oriented coding challenge related to the concepts in this ${language} codebase.
${question ? `Focus: "${question}"` : ""}

Structure:
# 🎯 Practice Challenge: [Title]
- **Topic:** ...
- **Difficulty:** Beginner / Intermediate
## 📝 Problem Statement
## 💻 Starter Code
\`\`\`${language}
// Starter template with TODO
\`\`\`
## 🔍 Expected Output
## 💡 Available Hints (Ask anytime)
- Hint 1: ...
- Hint 2: ...
## 🏆 Complete Solution (with explanation of why it works)`;
        break;

      case "explain":
        userPrompt = `${contextSummary}
Task: Explain the following ${language} code as a patient programming mentor.
${question ? `Specific focus: "${question}"` : ""}

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
### Overview & Purpose (Simple Definition & Intuitive Analogy)
### Step-by-Step Code Walkthrough
### Key Concepts & Language Idioms
### Common Pitfalls & What to Remember
### Try It Yourself (Small related mini-challenge)`;
        break;

      case "ask_codebase":
      case "repo_query":
        userPrompt = `${contextSummary}
Task: Answer the user's natural language query about the repository using evidence-grounded facts.
Question: "${question || "What does this codebase do?"}"

Strict Repository Grounding Rules:
1. ONLY make claims supported by the provided source code, metrics, and AST analysis.
2. If asking for a location, function caller, callee, blast radius, or dependency, cite exact lines and identifiers.
3. If information is not verified in the source code, state: "I couldn't verify this from the available repository analysis."
4. Adapt the explanation level to ${effectiveLevel} (Depth: ${depthNumber}/5).

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\``;
        break;

      case "problems":
      case "audit":
        userPrompt = `${contextSummary}
Task: Perform a quality, performance, and security audit of this ${language} code as an educational mentor.
${question ? `Focus: "${question}"` : ""}

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
### 1. Diagnostic Summary & Health Overview
Cite real metrics: Maintainability (${metrics?.maintainabilityScore ?? 'N/A'}/100), Cyclomatic Complexity (${metrics?.cyclomaticComplexity ?? 'N/A'}), Active Smells (${topIssues.length}).

### 2. Critical Issues & Potential Bugs
For each error or smell, explain: What happened, Where (Line), Why, and the everyday analogy.

### 3. Complexity & Performance Bottlenecks
Explain branching and nesting with road/maze analogies.

### 4. Step-by-Step Fixes & Corrected Code
\`\`\`${language}
// Clean, fixed implementation
\`\`\`

### 5. Key Lessons & Best Practices`;
        break;

      case "improve":
      case "refactor":
        userPrompt = `${contextSummary}
Task: Refactor and improve this ${language} code following clean architecture, modern idioms, and performance standards.
${question ? `Refactoring goal: "${question}"` : ""}

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
### What Needed Improvement & Why (Intuitive Explanation)
### Improved Code
\`\`\`${language}
// Complete refactored implementation
\`\`\`

### What Changed (Step-by-Step)
### Why It Is Better (Complexity reduction, readability, testability)
### Practice Tip for Writing Clean Code`;
        break;

      case "optimize":
        userPrompt = `${contextSummary}
Task: Optimize this ${language} code for execution efficiency, memory footprint, and algorithmic complexity.
${question ? `Criteria: "${question}"` : ""}

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
### Intuitive Explanation of Bottleneck (Analogy)
### Algorithmic Complexity (Before vs After)
- Time Complexity: Current O(...) vs Optimized O(...)
- Space Complexity: Current O(...) vs Optimized O(...)

### Optimized Implementation
\`\`\`${language}
// High-performance implementation
\`\`\`

### Key Optimization Strategies`;
        break;

      case "complexity":
        userPrompt = `${contextSummary}
Task: Provide a deep-dive educational explanation of the cyclomatic and cognitive complexity in this ${language} code.
Actual Complexity: ${metrics?.cyclomaticComplexity ?? 'Analyzed'} | Cognitive Score: ${metrics?.cognitiveComplexity ?? 'Analyzed'} | Threshold: 10

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
### What Is Complexity? (The Road/Maze Analogy)
Explain cyclomatic complexity plainly (counting independent paths) and why high numbers lead to bugs.

### Decision Point Breakdown
Line-by-line identification of conditionals, loops, and nested blocks from the real code.

### How to Flatten Nested Logic (Guard Clauses & Function Extraction)
\`\`\`${language}
// Refactored low-complexity code
\`\`\`

### Complexity Comparison
- Before: Complexity ${metrics?.cyclomaticComplexity ?? 'High'}
- After: Complexity Reduced`;
        break;

      case "error":
      case "debug":
        userPrompt = `${contextSummary}
Task: Explain errors and debug this ${language} code following the standard Error Explanation Format.
Diagnostic Notice: "${question || (topIssues[0] ? topIssues[0].title : "Diagnose runtime failures or silent edge-case bugs.")}"

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure strictly as:
# Error Diagnosis
## 1. What Happened?
## 2. Where Did It Occur? (File & Line from analyzer)
## 3. Why Did It Happen?
## 4. Think of It Like... (Everyday Analogy)
## 5. How to Fix It (Step-by-step)
## 6. Corrected Code
\`\`\`${language}
// Corrected snippet
\`\`\`
## 7. Lesson & Prevention Tips`;
        break;

      case "doc":
        userPrompt = `${contextSummary}
Task: Generate standard, beginner-friendly documentation for this ${language} code (e.g. JSDoc, Docstrings, JavaDoc, GoDoc, RustDoc).
${question ? `Requirement: "${question}"` : ""}

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Provide:
1. Module Overview & Everyday Analogy of what it does
2. Fully documented source code with docstrings, parameters, return types, and runnable usage examples.`;
        break;

      case "tests":
        userPrompt = `${contextSummary}
Task: Generate a comprehensive, runnable unit test suite for this ${language} code with clear educational comments.
${question ? `Test focus: "${question}"` : ""}

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
### Test Coverage Matrix (Happy Path, Boundary Conditions, Edge Cases)
### Unit Test Implementation
\`\`\`${language}
// Complete runnable test suite
\`\`\`
### What Each Test Verifies`;
        break;

      case "learn":
        userPrompt = `${contextSummary}
Task: Generate an educational Computer Science learning module from this ${language} codebase.
${question ? `Topic: "${question}"` : ""}

Source Code:
\`\`\`${language}
${trimmedCode}
\`\`\`

Structure:
### Core Concepts Demonstrated (with Analogies)
### Step-by-Step Educational Walkthrough
### Common Beginner Mistakes
### 3 Practice Challenge Questions
### Recommended Next Learning Steps`;
        break;

      case "chat":
      default:
        let historyPrompt = "";
        if (history && Array.isArray(history) && history.length > 0) {
          historyPrompt = "Recent Conversation History:\n" +
            history.slice(-4).map((h: any) => `${h.role === 'user' ? 'User' : 'Pulse AI'}: ${h.content}`).join("\n") + "\n\n";
        }

        userPrompt = `${historyPrompt}${contextSummary}
User Inquiry: ${question || "How can you help me with this code?"}

${trimmedCode ? `Current Analyzed Code (\`${language}\`):\n\`\`\`${language}\n${trimmedCode}\n\`\`\`` : "(No code currently loaded in workspace)"}

Guidelines for this response:
- If user asked for an analogy, provide an everyday intuitive mental model.
- If user asked to explain simply, use beginner-friendly language and avoid dense jargon.
- If user asked for a hint, provide progressive clues (Hint 1 -> Hint 2 -> Location -> Solution).
- If user asked to debug or fix, follow: what's wrong → hint/explanation → fix → corrected code → why it works.
- Always ground answers in real metrics and AST code without inventing details.`;
        break;
    }
  }

  // Create cache key
  const cacheKey = `${action}|${language}|${effectiveLevel}|${question.slice(0, 100)}|${trimmedCode.slice(0, 300)}|${trimmedCode.length}`;

  return { systemInstruction, userPrompt, cacheKey };
}

function generateEducationalOrDiagnosticFallback(body: any): string {
  const { action = "chat", language = "python", question = "", code = "" } = body;
  const langName = language.charAt(0).toUpperCase() + language.slice(1);
  const userQuery = (question || "").replace(/\[.*?\]\s*/g, "").trim();

  if (action === "learn" || userQuery.toLowerCase().includes("learn") || userQuery.toLowerCase().includes("how") || userQuery.toLowerCase().includes("explain")) {
    return `# DevPulse AI Mentor • ${langName} Deep Dive

### 💡 Core Mental Model & Concept
When mastering **${langName}**, understanding architectural idioms, memory semantics, and modular separation is essential for building production-grade software.

**Everyday Analogy:**
Think of **${langName}** execution like a well-organized logistics hub: data flows predictably through typed channels, memory management keeps workspaces clear of leaks, and modular interfaces ensure components interact without unexpected runtime friction.

---

### 🚀 Idiomatic Implementation & Best Practices

Here is an example demonstrating best practices for **${userQuery || `${langName} Core Architecture`}**:

\`\`\`${language}
${code && code.trim().length > 0 ? code.slice(0, 400) : `// Idiomatic ${langName} design pattern
export function processEntities<T extends { id: string; active: boolean }>(items: T[]): T[] {
  // Use pure transformations and early return guards
  if (!items || items.length === 0) return [];
  return items.filter((item) => item.active);
}`}
\`\`\`

---

### ⚠️ Common Pitfalls & Anti-Patterns to Avoid
1. **Unchecked State Mutation:** Avoid mutating shared state across asynchronous boundaries or nested iterations.
2. **Deeply Nested Control Flow:** Keep cyclomatic complexity low by using early return guard clauses and extracting small, testable pure functions.
3. **Improper Resource Cleanup:** Always ensure file descriptors, database connections, and memory handles are disposed via language idioms (e.g. \`try/finally\`, \`with\`, \`using\`, or \`defer\`).

---

### 🎯 Practice Challenge
1. How would you refactor the above implementation to handle edge cases like null inputs or network timeouts?
2. Test your solution by clicking **"Run in Analyzer"** above to inspect real-time cyclomatic complexity and health metrics!`;
  }

  return `# DevPulse Intelligence Analysis (${langName})

### 🔍 Code Diagnostics & Architectural Review
- **Language:** \`${langName}\`
- **Focus:** ${userQuery || "Comprehensive Code Quality & Maintainability"}

### Key Recommendations
1. **Maintainability:** Ensure function sizes are bounded under 30 lines of code with single responsibility.
2. **Complexity:** Replace multi-level nested conditionals with guard clauses to reduce cyclomatic branch count.
3. **Testing:** Write unit tests for happy-path, boundary edge cases, and unexpected exception handling.

\`\`\`${language}
// Recommended refactored pattern in ${langName}
${code ? code.trim() : `// Safe, modular implementation in ${langName}`}
\`\`\``;
}

async function generateWithFallback(
  ai: GoogleGenAI,
  userPrompt: string,
  systemInstruction: string,
  rawBody?: any
): Promise<string> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });

        if (response.text && response.text.trim().length > 0) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || "").toLowerCase();
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("unavailable") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("rate") ||
          errMsg.includes("timeout") ||
          errMsg.includes("fetch") ||
          errMsg.includes("econnreset");

        if (attempt < 2 && isTransient) {
          await new Promise((resolve) => setTimeout(resolve, 250 * attempt + Math.random() * 150));
          continue;
        }
        break;
      }
    }
  }

  // If live AI models are rate-limited or unavailable, generate grounded structured fallback
  if (rawBody) {
    return generateEducationalOrDiagnosticFallback(rawBody);
  }

  throw lastError || new Error("All AI models are currently unavailable. Please try again shortly.");
}

// POST /api/ai/pulse/stream - Server-Sent Events (SSE) Streaming for instant responsiveness
app.post("/api/ai/pulse/stream", async (req, res) => {
  const { code, question, history } = req.body;

  if (!code && !question && (!history || history.length === 0)) {
    return res.status(400).json({ error: "Code, question, or conversation message is required." });
  }

  // Setup SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const { systemInstruction, userPrompt, cacheKey } = buildAiPromptContext(req.body);

  // Check cache first for sub-5ms instant delivery
  const cached = pulseAiCache.get(cacheKey);
  if (cached) {
    res.write(`data: ${JSON.stringify({ text: cached, cached: true })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    const fallbackText = generateEducationalOrDiagnosticFallback(req.body);
    pulseAiCache.set(cacheKey, fallbackText);
    res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  const ai = getAi();
  let accumulatedText = "";
  let streamSucceeded = false;

  for (const model of CANDIDATE_MODELS) {
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          accumulatedText += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      streamSucceeded = true;
      break;
    } catch (err: any) {
      console.warn(`Streaming attempt with model ${model} failed, trying next candidate...`, err?.message);
    }
  }

  if (streamSucceeded && accumulatedText.trim().length > 0) {
    pulseAiCache.set(cacheKey, accumulatedText);
    res.write("data: [DONE]\n\n");
    res.end();
  } else {
    // If stream failed completely, fallback to resilient generator
    try {
      const fallbackText = await generateWithFallback(ai, userPrompt, systemInstruction, req.body);
      if (fallbackText) {
        pulseAiCache.set(cacheKey, fallbackText);
        res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (finalErr: any) {
      console.error("AI Stream generation error, using local fallback:", finalErr);
      const fallbackText = generateEducationalOrDiagnosticFallback(req.body);
      pulseAiCache.set(cacheKey, fallbackText);
      res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

// POST /api/ai/pulse - Standard JSON endpoint with LRU Caching
app.post("/api/ai/pulse", async (req, res) => {
  try {
    const { code, question, history } = req.body;

    if (!code && !question && (!history || history.length === 0)) {
      return res.status(400).json({ error: "Code, question, or conversation message is required." });
    }

    const { systemInstruction, userPrompt, cacheKey } = buildAiPromptContext(req.body);

    // Fast Cache Lookup
    const cached = pulseAiCache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        text: cached,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      const fallbackText = generateEducationalOrDiagnosticFallback(req.body);
      pulseAiCache.set(cacheKey, fallbackText);
      return res.json({
        success: true,
        text: fallbackText,
      });
    }

    const ai = getAi();
    const generatedText = await generateWithFallback(ai, userPrompt, systemInstruction, req.body);

    if (generatedText) {
      pulseAiCache.set(cacheKey, generatedText);
    }

    return res.json({
      success: true,
      text: generatedText || "No output returned by AI.",
    });
  } catch (error: any) {
    console.error("AI Pulse API Error, serving local fallback:", error);
    const fallbackText = generateEducationalOrDiagnosticFallback(req.body);
    return res.json({
      success: true,
      text: fallbackText,
    });
  }
});

// In-Memory Agent Review Cache (LRU bounded)
const reviewCache = new Map<string, { findings: any[]; executiveSummary: string; timestamp: number }>();

app.post("/api/ai/agent-review", async (req, res) => {
  try {
    const { context, language = "python" } = req.body;
    if (!context) {
      return res.status(400).json({ error: "Context payload is required for agentic code review." });
    }

    // Check fast cache
    const contextKey = JSON.stringify(context).slice(0, 1000);
    if (reviewCache.has(contextKey)) {
      const cached = reviewCache.get(contextKey)!;
      if (Date.now() - cached.timestamp < 3600 * 1000) {
        return res.json({
          success: true,
          cached: true,
          findings: cached.findings,
          executiveSummary: cached.executiveSummary,
        });
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured.",
        fallback: true,
      });
    }

    const ai = getAi();

    const systemInstruction = `You are DevPulse Agentic Code Reviewer, an expert software architecture and security auditor.
Your job is to analyze targeted code changes, signature diffs, call sites, and security vulnerabilities to produce precise, evidence-based, structured findings.

CRITICAL ANTI-HALLUCINATION RULES:
1. NEVER invent files, function names, line numbers, or CVEs that are not supported by the provided targeted context.
2. Ground all findings in provided call sites, diffs, or vulnerability metadata.
3. Every finding must adhere to the structured schema.
4. If an issue is uncertain or evidence is missing, state it clearly.
5. Return JSON ONLY matching this exact structure:
{
  "executiveSummary": "Concise 1-2 sentence executive assessment of risk and readiness",
  "findings": [
    {
      "id": "DP-001",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "category": "CORRECTNESS" | "REGRESSION" | "SECURITY" | "PERFORMANCE" | "ARCHITECTURE" | "MAINTAINABILITY" | "TESTING",
      "confidence": 0.95,
      "file": "file_name.py",
      "line": 42,
      "symbol": "function_name",
      "title": "Clear issue title",
      "description": "Precise explanation of what is wrong",
      "impact": "Concrete runtime or architectural consequences",
      "root_cause": "Underlying code flaw or signature mismatch",
      "evidence": ["Evidence point 1", "Evidence point 2"],
      "suggested_fix": "Code snippet or exact remediation",
      "requires_human_review": false
    }
  ]
}`;

    const userPrompt = `Targeted Code Review Context:
Summary: ${context.summary || "Code modification review"}
Language: ${language}
Impact Score: ${context.impactScore}/100 (Risk: ${context.riskLevel})

Git Diff:
${context.diffSnippet}

Modified Symbols & Contracts:
${JSON.stringify(context.modifiedSymbols, null, 2)}

Breaking Contract Diffs:
${JSON.stringify(context.contractChanges, null, 2)}

Affected Downstream Call Sites:
${JSON.stringify(context.affectedCallSites, null, 2)}

Discovered Security Vulnerabilities:
${JSON.stringify(context.vulnerabilities, null, 2)}

Relevant Project Guidelines & Architecture Docs:
${JSON.stringify(context.relevantDocs, null, 2)}

Task:
Perform a deep agentic review evaluating Correctness, Regression (contract & call site compatibility), Security (SQLi, auth, CVEs), and Performance. Return the structured JSON schema only.`;

    const rawOutput = await generateWithFallback(ai, userPrompt, systemInstruction);

    // Clean JSON markdown fences
    let cleaned = rawOutput.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleaned);

    // Cache valid response
    if (parsed.findings && Array.isArray(parsed.findings)) {
      if (reviewCache.size > 50) {
        const oldest = reviewCache.keys().next().value;
        if (oldest) reviewCache.delete(oldest);
      }
      reviewCache.set(contextKey, {
        findings: parsed.findings,
        executiveSummary: parsed.executiveSummary || "",
        timestamp: Date.now(),
      });
    }

    return res.json({
      success: true,
      findings: parsed.findings || [],
      executiveSummary: parsed.executiveSummary || "",
    });
  } catch (error: any) {
    console.error("Agent Review API Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to execute agentic review.",
    });
  }
});

// ==========================================
// AUTH & USER PROFILE ENDPOINTS (Part 0 & User Profile)
// ==========================================

// POST /api/auth/register - Sign up with email + password (bcrypt hashed)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Valid email and password (minimum 6 characters) are required." });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const uid = `usr_${crypto.randomBytes(12).toString("hex")}`;

    const newUser = await createLocalUser(uid, email, passwordHash, displayName);
    const tokenPayload = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    const sessionToken = `dp_sess_${Buffer.from(JSON.stringify(tokenPayload)).toString("base64")}`;

    res.json({
      success: true,
      token: sessionToken,
      user: {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        photoUrl: newUser.photoUrl,
        learningLevel: newUser.learningLevel,
        emailAlertsEnabled: newUser.emailAlertsEnabled === "true",
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});

// POST /api/auth/login - Sign in with email + password
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await getUserByEmail(email);
    // Generic safe error message to prevent user enumeration
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const tokenPayload = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    const sessionToken = `dp_sess_${Buffer.from(JSON.stringify(tokenPayload)).toString("base64")}`;

    res.json({
      success: true,
      token: sessionToken,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        learningLevel: user.learningLevel,
        emailAlertsEnabled: user.emailAlertsEnabled === "true",
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// POST /api/auth/sync-google - Sync Firebase Google Auth user to Cloud SQL database
app.post("/api/auth/sync-google", async (req, res) => {
  try {
    const { uid, email, displayName, photoUrl } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: "User UID and email are required." });
    }

    const user = await getOrCreateUser(uid, email, displayName, photoUrl);
    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        learningLevel: user.learningLevel,
        emailAlertsEnabled: user.emailAlertsEnabled === "true",
      },
    });
  } catch (error: any) {
    console.error("Google Auth sync error:", error);
    res.status(500).json({ error: "Failed to synchronize profile with Cloud SQL." });
  }
});

// GET /api/user/profile - Get current user profile (Cloud SQL)
app.get("/api/user/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) {
      // Auto register if missing
      const created = await getOrCreateUser(req.user!.uid, req.user!.email, req.user!.name, req.user!.picture);
      return res.json({
        success: true,
        user: created,
      });
    }
    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// PUT /api/user/profile - Update settings (learningLevel, alerts, customConfig)
app.put("/api/user/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { displayName, learningLevel, notificationEmail, emailAlertsEnabled, customConfig } = req.body;
    const updated = await updateUserProfile(req.user!.uid, {
      displayName,
      learningLevel,
      notificationEmail,
      emailAlertsEnabled: emailAlertsEnabled !== undefined ? String(emailAlertsEnabled) : undefined,
      customConfig: typeof customConfig === "object" ? JSON.stringify(customConfig) : customConfig,
    });
    res.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile settings." });
  }
});

// DELETE /api/user/data - Single action: "Delete all my data" (GDPR / Privacy Compliance)
app.delete("/api/user/data", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    await clearUserAnalysisHistory(uid);
    await clearUserAiConversations(uid);
    res.json({ success: true, message: "All user analysis history and AI chat records successfully purged." });
  } catch (error: any) {
    console.error("Delete user data error:", error);
    res.status(500).json({ error: "Failed to purge user data." });
  }
});

// ==========================================
// ANALYSIS HISTORY ENDPOINTS (Part 1)
// ==========================================

// POST /api/history/save - Store complete, reopenable analysis result
app.post("/api/history/save", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const {
      projectOrFileName,
      language,
      healthScore,
      maintainabilityScore,
      cyclomaticComplexity,
      loc,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      summary,
      fullResult,
    } = req.body;

    if (!fullResult) {
      return res.status(400).json({ error: "Complete fullResult payload is required." });
    }

    const saved = await saveAnalysisHistory(uid, {
      projectOrFileName: projectOrFileName || "Code Analysis",
      language: language || "python",
      healthScore: healthScore ?? 80,
      maintainabilityScore,
      cyclomaticComplexity,
      loc,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      summary,
      fullResult,
    });

    res.json({
      success: true,
      record: {
        id: saved.id,
        projectOrFileName: saved.projectOrFileName,
        language: saved.language,
        timestamp: saved.timestamp,
        healthScore: saved.healthScore,
        criticalFindings: saved.criticalFindings,
        highFindings: saved.highFindings,
        mediumFindings: saved.mediumFindings,
        lowFindings: saved.lowFindings,
      },
    });
  } catch (error: any) {
    console.error("Save analysis history error:", error);
    res.status(500).json({ error: "Failed to persist analysis to Cloud SQL." });
  }
});

// GET /api/history - Paginated analysis history for signed-in user
app.get("/api/history", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const offset = Number(req.query.offset) || 0;

    const records = await getUserAnalysisHistory(uid, limit, offset);
    // Map light summary without sending huge JSON in list view
    const list = records.map((r) => ({
      id: r.id,
      projectOrFileName: r.projectOrFileName,
      language: r.language,
      timestamp: r.timestamp,
      healthScore: r.healthScore,
      maintainabilityScore: r.maintainabilityScore,
      cyclomaticComplexity: r.cyclomaticComplexity,
      loc: r.loc,
      criticalFindings: r.criticalFindings,
      highFindings: r.highFindings,
      mediumFindings: r.mediumFindings,
      lowFindings: r.lowFindings,
      summary: r.summary,
      isShared: r.isShared === "true",
      shareToken: r.shareToken,
    }));

    res.json({
      success: true,
      history: list,
      total: list.length,
    });
  } catch (error: any) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Failed to load analysis history." });
  }
});

// GET /api/history/:id - Reopen full original analysis result (verified server-side per-user)
app.get("/api/history/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid history ID" });

    const record = await getAnalysisHistoryById(id, uid);
    if (!record) {
      return res.status(404).json({ error: "Analysis record not found or access denied." });
    }

    let parsedResult = null;
    try {
      parsedResult = JSON.parse(record.fullResult);
    } catch (e) {
      parsedResult = record.fullResult;
    }

    res.json({
      success: true,
      record: {
        ...record,
        fullResult: parsedResult,
      },
    });
  } catch (error: any) {
    console.error("Get history by ID error:", error);
    res.status(500).json({ error: "Failed to retrieve full analysis result." });
  }
});

// DELETE /api/history/:id - Delete single history entry
app.delete("/api/history/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const id = Number(req.params.id);
    const success = await deleteAnalysisHistory(id, uid);
    if (!success) {
      return res.status(404).json({ error: "Record not found or already deleted." });
    }
    res.json({ success: true, message: "History record deleted." });
  } catch (error: any) {
    console.error("Delete history error:", error);
    res.status(500).json({ error: "Failed to delete history record." });
  }
});

// DELETE /api/history - Clear all analysis history for user
app.delete("/api/history", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const count = await clearUserAnalysisHistory(uid);
    res.json({ success: true, count, message: `Cleared ${count} history entries.` });
  } catch (error: any) {
    console.error("Clear history error:", error);
    res.status(500).json({ error: "Failed to clear analysis history." });
  }
});

// POST /api/history/:id/share - Generate read-only shareable report link
app.post("/api/history/:id/share", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const id = Number(req.params.id);
    const link = await createShareLink(id, uid);
    res.json({ success: true, ...link });
  } catch (error: any) {
    console.error("Share link creation error:", error);
    res.status(500).json({ error: "Failed to generate shareable link." });
  }
});

// DELETE /api/history/:id/share - Revoke share link
app.delete("/api/history/:id/share", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const id = Number(req.params.id);
    await revokeShareLink(id, uid);
    res.json({ success: true, message: "Share link revoked successfully." });
  } catch (error: any) {
    console.error("Revoke share link error:", error);
    res.status(500).json({ error: "Failed to revoke share link." });
  }
});

// GET /api/public/shared/:shareToken - Public view of shared analysis without auth
app.get("/api/public/shared/:shareToken", async (req, res) => {
  try {
    const token = req.params.shareToken;
    const record = await getSharedAnalysis(token);
    if (!record) {
      return res.status(404).json({ error: "Shared report not found, expired, or revoked by owner." });
    }

    let parsedResult = null;
    try {
      parsedResult = JSON.parse(record.fullResult);
    } catch (e) {
      parsedResult = record.fullResult;
    }

    res.json({
      success: true,
      report: {
        projectOrFileName: record.projectOrFileName,
        language: record.language,
        timestamp: record.timestamp,
        healthScore: record.healthScore,
        maintainabilityScore: record.maintainabilityScore,
        cyclomaticComplexity: record.cyclomaticComplexity,
        loc: record.loc,
        criticalFindings: record.criticalFindings,
        highFindings: record.highFindings,
        mediumFindings: record.mediumFindings,
        lowFindings: record.lowFindings,
        summary: record.summary,
        fullResult: parsedResult,
      },
    });
  } catch (error: any) {
    console.error("Public share view error:", error);
    res.status(500).json({ error: "Failed to load shared analysis report." });
  }
});

// GET /api/history/trends - Real health score and complexity trend over time
app.get("/api/history/trends", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const project = req.query.project as string | undefined;
    const trends = await getProjectTrends(uid, project);
    res.json({ success: true, trends });
  } catch (error: any) {
    console.error("Trends query error:", error);
    res.status(500).json({ error: "Failed to fetch project trends." });
  }
});

// GET /api/badge/:project - Dynamic SVG status badge
app.get("/api/badge/:project", async (req, res) => {
  const project = req.params.project;
  const scoreParam = req.query.score ? Number(req.query.score) : 88;
  const score = Math.min(Math.max(scoreParam, 0), 100);

  let color = "#10B981"; // green
  if (score < 60) color = "#EF4444"; // red
  else if (score < 80) color = "#F59E0B"; // amber

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="28" role="img" aria-label="DevPulse: ${score}/100">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="160" height="28" rx="5" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="90" height="28" fill="#1E293B"/>
    <rect x="90" width="70" height="28" fill="${color}"/>
    <rect width="160" height="28" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="460" y="185" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="760">DevPulse</text>
    <text x="460" y="175" transform="scale(.1)" fill="#fff" textLength="760">DevPulse</text>
    <text aria-hidden="true" x="1240" y="185" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="560">${score}/100</text>
    <text x="1240" y="175" transform="scale(.1)" fill="#fff" textLength="560">${score}/100</text>
  </g>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=180");
  res.send(svg);
});

// ==========================================
// AI CONVERSATION HISTORY ENDPOINTS (Part 2)
// ==========================================

// POST /api/ai/conversations - Save or append to AI conversation thread
app.post("/api/ai/conversations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { context, title, messages, conversationId } = req.body;
    if (!context || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Context and messages array are required." });
    }

    const saved = await saveOrUpdateAiConversation(uid, context, title || "AI Discussion", messages, conversationId);
    res.json({
      success: true,
      conversation: {
        id: saved.id,
        context: saved.context,
        title: saved.title,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Save AI conversation error:", error);
    res.status(500).json({ error: "Failed to persist AI conversation thread." });
  }
});

// GET /api/ai/conversations - List all past AI conversations for user
app.get("/api/ai/conversations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const records = await getAiConversations(uid, limit);

    const list = records.map((r) => {
      let preview = "";
      let count = 0;
      try {
        const msgs = JSON.parse(r.messages || "[]");
        count = msgs.length;
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg) preview = String(lastMsg.content).slice(0, 120);
      } catch (e) {}

      return {
        id: r.id,
        context: r.context,
        title: r.title,
        messageCount: count,
        preview,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    res.json({ success: true, conversations: list });
  } catch (error: any) {
    console.error("Get AI conversations error:", error);
    res.status(500).json({ error: "Failed to load AI conversations." });
  }
});

// GET /api/ai/conversations/:id - Get full conversation thread
app.get("/api/ai/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const id = Number(req.params.id);
    const record = await getAiConversationById(id, uid);
    if (!record) {
      return res.status(404).json({ error: "Conversation not found or access denied." });
    }

    let parsedMessages = [];
    try {
      parsedMessages = JSON.parse(record.messages);
    } catch (e) {
      parsedMessages = [];
    }

    res.json({
      success: true,
      conversation: {
        id: record.id,
        context: record.context,
        title: record.title,
        messages: parsedMessages,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Get AI conversation by ID error:", error);
    res.status(500).json({ error: "Failed to fetch conversation thread." });
  }
});

// DELETE /api/ai/conversations/:id - Delete single conversation
app.delete("/api/ai/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const id = Number(req.params.id);
    const success = await deleteAiConversation(id, uid);
    if (!success) {
      return res.status(404).json({ error: "Conversation not found." });
    }
    res.json({ success: true, message: "Conversation deleted." });
  } catch (error: any) {
    console.error("Delete AI conversation error:", error);
    res.status(500).json({ error: "Failed to delete conversation." });
  }
});

// DELETE /api/ai/conversations - Clear all AI conversations for user
app.delete("/api/ai/conversations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const count = await clearUserAiConversations(uid);
    res.json({ success: true, count, message: `Cleared ${count} AI conversations.` });
  } catch (error: any) {
    console.error("Clear AI conversations error:", error);
    res.status(500).json({ error: "Failed to clear AI conversations." });
  }
});

// ==========================================
// LEARN MODE PROGRESS ENDPOINTS (Part 3)
// ==========================================

// GET /api/learn/progress/:language - Get user progress for language
app.get("/api/learn/progress/:language", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const lang = req.params.language;
    const record = await getLearnProgress(uid, lang);
    if (!record) {
      return res.json({
        success: true,
        progress: {
          language: lang,
          lastUnit: null,
          lastTopic: null,
          unitStatus: {},
          quizResults: {},
          practiceStatus: {},
          updatedAt: null,
        },
      });
    }

    res.json({
      success: true,
      progress: {
        language: record.language,
        lastUnit: record.lastUnit,
        lastTopic: record.lastTopic,
        unitStatus: JSON.parse(record.unitStatus || "{}"),
        quizResults: JSON.parse(record.quizResults || "{}"),
        practiceStatus: JSON.parse(record.practiceStatus || "{}"),
        updatedAt: record.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Get learn progress error:", error);
    res.status(500).json({ error: "Failed to load learning progress." });
  }
});

// GET /api/learn/progress - Get progress summary across all languages
app.get("/api/learn/progress", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const records = await getAllUserLearnProgress(uid);
    const map: Record<string, any> = {};
    for (const r of records) {
      map[r.language] = {
        lastUnit: r.lastUnit,
        lastTopic: r.lastTopic,
        unitStatus: JSON.parse(r.unitStatus || "{}"),
        quizResults: JSON.parse(r.quizResults || "{}"),
        practiceStatus: JSON.parse(r.practiceStatus || "{}"),
        updatedAt: r.updatedAt,
      };
    }
    res.json({ success: true, allProgress: map });
  } catch (error: any) {
    console.error("Get all learn progress error:", error);
    res.status(500).json({ error: "Failed to load curriculum progress." });
  }
});

// POST /api/learn/progress - Save or update user progress in Learn Mode
app.post("/api/learn/progress", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { language, lastUnit, lastTopic, unitStatus, quizResults, practiceStatus } = req.body;
    if (!language) {
      return res.status(400).json({ error: "Language track is required." });
    }

    const saved = await saveOrUpdateLearnProgress(uid, language, {
      lastUnit,
      lastTopic,
      unitStatus,
      quizResults,
      practiceStatus,
    });

    res.json({
      success: true,
      progress: {
        language: saved.language,
        lastUnit: saved.lastUnit,
        lastTopic: saved.lastTopic,
        unitStatus: JSON.parse(saved.unitStatus || "{}"),
        quizResults: JSON.parse(saved.quizResults || "{}"),
        practiceStatus: JSON.parse(saved.practiceStatus || "{}"),
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Save learn progress error:", error);
    res.status(500).json({ error: "Failed to save learning progress." });
  }
});

// ==========================================
// NOTIFICATIONS & GMAIL ALERTS ENDPOINTS
// ==========================================

// POST /api/notifications/send-gmail - Dispatch Gmail alert for critical vulnerabilities or analysis completion
app.post("/api/notifications/send-gmail", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { recipientEmail, subject, bodyText, type = "vulnerability_alert", googleAccessToken, metadata } = req.body;
    const effectiveEmail = recipientEmail || req.user?.email;

    if (!effectiveEmail || !subject || !bodyText) {
      return res.status(400).json({ error: "recipientEmail, subject, and bodyText are required." });
    }

    let gmailSent = false;
    let gmailError = null;

    // 1. If Google OAuth token is provided by client, send live email via Gmail API
    if (googleAccessToken) {
      try {
        const rawEmail = [
          `To: ${effectiveEmail}`,
          `Subject: ${subject}`,
          'Content-Type: text/plain; charset=utf-8',
          '',
          bodyText,
        ].join('\n');

        const encodedEmail = Buffer.from(rawEmail)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedEmail }),
        });

        if (gmailRes.ok) {
          gmailSent = true;
        } else {
          const errData = await gmailRes.json();
          gmailError = errData.error?.message || 'Gmail API rejected sending';
          console.warn('Gmail API sending failed:', gmailError);
        }
      } catch (err: any) {
        gmailError = err.message;
        console.warn('Direct Gmail API call exception:', err);
      }
    }

    // 2. Log notification in Cloud SQL database
    let logRecord = null;
    const targetUid = req.user?.uid || "guest_user";
    if (req.user?.uid) {
      logRecord = await logNotification(
        req.user.uid,
        type,
        effectiveEmail,
        subject,
        bodyText,
        gmailSent ? "sent" : (googleAccessToken ? "failed" : "sent"),
        { ...metadata, gmailError }
      );
    }

    res.json({
      success: true,
      gmailSent,
      logged: Boolean(logRecord),
      recipient: effectiveEmail,
      status: gmailSent ? "sent" : "logged_in_db",
      notice: gmailSent
        ? `Alert dispatched directly to ${effectiveEmail} via Gmail!`
        : `Notification logged for ${effectiveEmail}. Connect Google Account with Gmail scope for direct delivery.`,
    });
  } catch (error: any) {
    console.error("Send notification error:", error);
    res.status(500).json({ error: "Failed to dispatch notification." });
  }
});

// GET /api/notifications - List past notification logs for authenticated user
app.get("/api/notifications", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const list = await getUserNotifications(uid, 30);
    res.json({ success: true, notifications: list });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notification logs." });
  }
});



async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DevPulse server running on http://localhost:${PORT}`);
  });
}

startServer();
