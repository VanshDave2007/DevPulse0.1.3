import { LanguageCurriculum, Chapter } from './types';
import { pythonCurriculum } from './pythonCurriculum';
import { javascriptCurriculum } from './javascriptCurriculum';
import { allLanguagesLearningContent, getLanguageLearningContent } from '../index';
import { LanguageLearningContent } from '../types';

export * from './types';
export { pythonCurriculum } from './pythonCurriculum';
export { javascriptCurriculum } from './javascriptCurriculum';

/**
 * Dynamically builds a standard 6-to-8 chapter curriculum for any language content
 */
function generateGenericCurriculum(content: LanguageLearningContent): LanguageCurriculum {
  const chapters: Chapter[] = [
    {
      id: `${content.id}-ch-1`,
      chapterNumber: 1,
      title: 'Foundations, Syntax & Environment',
      subtitle: `Master the core language syntax, execution model, and structure of ${content.name}.`,
      estimatedMinutes: 20,
      difficulty: 'Beginner',
      objectives: [
        `Understand ${content.name} typing system: ${content.typingSystem}.`,
        `Understand execution model: ${content.executionModel}.`,
        `Write idiomatic initial code using standard conventions.`
      ],
      concepts: content.coreConcepts.map((c) => ({
        title: c.title,
        explanation: c.summary,
        keyTakeaway: c.relevance
      })),
      examples: content.syntaxFundamentals.slice(0, 2).map((s) => ({
        title: s.title,
        explanation: s.explanation,
        code: s.code,
        output: s.output,
        tip: s.importantNote
      })),
      tryIt: {
        id: `${content.id}-try-1`,
        title: `${content.name} Syntax Starter`,
        task: `Write a basic ${content.name} script that demonstrates variables and output.`,
        instructions: [
          'Review the provided example code.',
          'Execute or modify the code.',
          'Test it in the DevPulse AST Analyzer.'
        ],
        starterCode: content.syntaxFundamentals[0]?.code || `// ${content.name} Code\nprint("Hello, DevPulse!");`,
        solutionCode: content.syntaxFundamentals[0]?.code || `// ${content.name} Code\nprint("Hello, DevPulse!");`,
        hints: ['Follow standard naming conventions.'],
        validationCriteria: ['Valid code syntax without compiler errors']
      }
    },
    {
      id: `${content.id}-ch-2`,
      chapterNumber: 2,
      title: 'Data Types, Collections & Memory Model',
      subtitle: `Explore primitives, complex types, and memory handling in ${content.name}.`,
      estimatedMinutes: 25,
      difficulty: 'Beginner',
      objectives: [
        `Identify available primitive and collection types in ${content.name}.`,
        `Understand allocation: ${content.memoryAndExecution.allocation}.`,
        `Learn garbage collection / lifetime semantics: ${content.memoryAndExecution.garbageCollection}.`
      ],
      concepts: [
        {
          title: 'Memory & Execution Model',
          explanation: content.memoryAndExecution.model,
          keyTakeaway: content.memoryAndExecution.keyDetails.join('; ')
        }
      ],
      examples: content.dataTypes.typesList.slice(0, 3).map((dt) => ({
        title: `${dt.type} (${dt.category})`,
        explanation: dt.description,
        code: dt.example,
        tip: `Mutability: ${dt.isMutable ? 'Mutable' : 'Immutable'}`
      })),
      tryIt: {
        id: `${content.id}-try-2`,
        title: 'Collection Manipulation',
        task: 'Instantiate and populate collections with structured data.',
        instructions: [
          'Use the primary collection structures of the language.',
          'Ensure elements are typed correctly.'
        ],
        starterCode: content.dataTypes.typesList[0]?.example || '// Data types example',
        solutionCode: content.dataTypes.typesList[0]?.example || '// Data types example',
        hints: ['Check the types documentation.'],
        validationCriteria: ['Valid data structure initialization']
      }
    },
    {
      id: `${content.id}-ch-3`,
      chapterNumber: 3,
      title: 'Control Flow, Branching & Scope',
      subtitle: `Master conditional logic, loops, and branching without creating code smells.`,
      estimatedMinutes: 25,
      difficulty: 'Beginner',
      objectives: [
        'Write clean conditional checks and pattern matches.',
        'Iterate efficiently over collections.',
        'Keep cyclomatic complexity low with early guard returns.'
      ],
      concepts: content.controlFlow.map((cf) => ({
        title: cf.name,
        explanation: cf.description,
        codeSnippet: cf.code,
        keyTakeaway: cf.note || 'Maintain low nesting depth.'
      })),
      examples: content.controlFlow.slice(0, 2).map((cf) => ({
        title: cf.name,
        explanation: cf.description,
        code: cf.code,
        tip: cf.note
      })),
      tryIt: {
        id: `${content.id}-try-3`,
        title: 'Control Flow Challenge',
        task: 'Write a branching condition with early guard returns.',
        instructions: [
          'Implement conditional validation.',
          'Avoid deeply nested if blocks.'
        ],
        starterCode: content.controlFlow[0]?.code || '// Control flow starter',
        solutionCode: content.controlFlow[0]?.code || '// Control flow solution',
        hints: ['Use guard clauses at the beginning of functions.'],
        validationCriteria: ['Clean control flow structure']
      }
    },
    {
      id: `${content.id}-ch-4`,
      chapterNumber: 4,
      title: 'Functions, Methods & Modularity',
      subtitle: `Structure reusable subroutines, parameter passing, and modular architecture.`,
      estimatedMinutes: 30,
      difficulty: 'Intermediate',
      objectives: [
        'Define clean functions with clear parameters and return types.',
        'Understand function scope and closures if supported.',
        'Structure modules and package dependencies.'
      ],
      concepts: content.functions.map((fn) => ({
        title: fn.title,
        explanation: fn.description,
        codeSnippet: fn.code,
        keyTakeaway: fn.paramsAndReturn || 'Prefer pure functions where possible.'
      })),
      examples: content.functions.slice(0, 2).map((fn) => ({
        title: fn.title,
        explanation: fn.description,
        code: fn.code
      })),
      tryIt: {
        id: `${content.id}-try-4`,
        title: 'Modular Function Design',
        task: 'Write a utility function that accepts parameters and returns computed results.',
        instructions: [
          'Ensure parameter validation.',
          'Return explicit values.'
        ],
        starterCode: content.functions[0]?.code || '// Function starter',
        solutionCode: content.functions[0]?.code || '// Function solution',
        hints: ['Keep functions under 25 lines of code.'],
        validationCriteria: ['Function declaration and return value']
      }
    },
    {
      id: `${content.id}-ch-5`,
      chapterNumber: 5,
      title: 'Error Handling, Robustness & Clean Code',
      subtitle: `Build resilient software with proper exception handling and defensive programming.`,
      estimatedMinutes: 30,
      difficulty: 'Intermediate',
      objectives: [
        'Handle errors predictably using the language-idiomatic error mechanisms.',
        'Avoid catching generic or blanket errors.',
        'Ensure all opened resources are reliably closed.'
      ],
      concepts: content.errorHandling.map((eh) => ({
        title: eh.type,
        explanation: eh.description,
        codeSnippet: eh.code,
        keyTakeaway: eh.debuggingTip
      })),
      examples: content.errorHandling.map((eh) => ({
        title: eh.type,
        explanation: `${eh.description} Mechanism: ${eh.mechanism}`,
        code: eh.code,
        tip: eh.debuggingTip
      })),
      tryIt: {
        id: `${content.id}-try-5`,
        title: 'Defensive Error Handling',
        task: 'Wrap potential runtime failures in proper error handlers.',
        instructions: [
          'Catch specific exceptions.',
          'Provide informative feedback.'
        ],
        starterCode: content.errorHandling[0]?.code || '// Error handling starter',
        solutionCode: content.errorHandling[0]?.code || '// Error handling solution',
        hints: ['Never swallow errors silently.'],
        validationCriteria: ['Contains try/catch or error check']
      }
    },
    {
      id: `${content.id}-ch-6`,
      chapterNumber: 6,
      title: 'Security Vulnerabilities & Best Practices',
      subtitle: `Identify security risks, prevent injection flaws, and audit code health.`,
      estimatedMinutes: 30,
      difficulty: 'Advanced',
      objectives: [
        'Identify common security vulnerabilities in the language ecosystem.',
        'Apply industry best practices for naming, organization, and performance.',
        'Audit code maintainability using automated metrics.'
      ],
      concepts: content.securityConsiderations.map((sec) => ({
        title: `${sec.vulnerability} (${sec.riskLevel} Risk)`,
        explanation: sec.description,
        codeSnippet: `// ❌ Vulnerable:\n${sec.vulnerableCode}\n\n// 🟢 Secure:\n${sec.secureCode}`,
        keyTakeaway: sec.remediation
      })),
      examples: content.bestPractices.slice(0, 2).map((bp) => ({
        title: `Best Practice: ${bp.title} [${bp.category}]`,
        explanation: bp.recommendation,
        code: bp.goodCode || '// Good practice',
        tip: bp.category
      })),
      tryIt: {
        id: `${content.id}-try-6`,
        title: 'Security Remediation Exercise',
        task: 'Refactor vulnerable code into a secure pattern.',
        instructions: [
          'Review the security concepts.',
          'Implement sanitized inputs or parameterized statements.'
        ],
        starterCode: content.securityConsiderations[0]?.vulnerableCode || '// Insecure code starter',
        solutionCode: content.securityConsiderations[0]?.secureCode || '// Secure code solution',
        hints: ['Avoid dynamic string evaluation or concatenation with untrusted input.'],
        validationCriteria: ['Remediates vulnerability']
      }
    }
  ];

  return {
    languageId: content.id,
    languageName: content.name,
    icon: content.icon,
    color: content.color,
    tagline: content.tagline,
    totalChapters: chapters.length,
    chapters
  };
}

export function getLanguageCurriculum(languageId: string): LanguageCurriculum {
  const norm = languageId.toLowerCase().trim();
  if (norm === 'python' || norm === 'py') {
    return pythonCurriculum;
  }
  if (norm === 'javascript' || norm === 'js') {
    return javascriptCurriculum;
  }
  // Check if we have another language content
  const content = getLanguageLearningContent(norm);
  if (content) {
    return generateGenericCurriculum(content);
  }
  // Default to python
  return pythonCurriculum;
}
