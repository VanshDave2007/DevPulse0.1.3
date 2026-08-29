/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionFinding,
  DeveloperSkill,
  KnowledgeLevel,
  LearningConcept,
  LearningEvent,
  LearningEventType,
  LearningGoal,
  LearningRecommendation,
  SkillDomain,
  SkillLevelStage,
  UserPersonalizationProfile,
} from '../types';
import { ProjectMemoryService } from './projectMemoryService';

const STORAGE_KEY_LEARNING_EVENTS = 'devpulse_learning_events_store';
const STORAGE_KEY_LEARNING_GOALS = 'devpulse_learning_goals_store';

// ----------------------------------------------------
// 1. COMPREHENSIVE CURATED LEARNING CONCEPTS
// ----------------------------------------------------
export const CORE_LEARNING_CONCEPTS: LearningConcept[] = [
  {
    id: 'sql-injection-parameterization',
    domain: 'SECURITY',
    title: 'SQL Injection Prevention & Parameterized Queries',
    summary: 'Directly interpolating untrusted input into database queries allows attackers to execute arbitrary SQL commands. Parameterized queries guarantee strict separation between query code and data.',
    whyItMatters: 'SQL injection remains in the OWASP Top 10 vulnerabilities. A single unchecked query string can lead to complete database compromise, unauthorized data exfiltration, and data destruction.',
    beginnerExplanation: 'Think of a database query like a form letter. If you let someone write anywhere on the paper, they can change the whole message. Parameterized queries put strict blank boxes on the form where only safe answers can be filled in, without changing the instructions.',
    intermediateExplanation: 'When query strings are constructed via concatenation or template literals (`SELECT * FROM users WHERE id = ${id}`), the database parser interprets user inputs as executable SQL tokens. Prepared statements send the SQL structure and the parameters across separate channels, ensuring parameter literals cannot alter query AST execution semantics.',
    expertExplanation: 'Modern database drivers compile parameterized prepared statements ahead of time at the protocol level. Parameter binding uses binary wire protocol encoding rather than textual escaping, neutralizing SQL injection, Unicode normalization bypasses, and multi-byte charset evasion techniques.',
    badCodeExample: `// ❌ Vulnerable: Dynamic string concatenation
async function getUserById(userId: string) {
  const query = \`SELECT * FROM users WHERE id = '\${userId}'\`;
  return await db.query(query);
}`,
    goodCodeExample: `// ✅ Secure: Parameterized prepared statement
async function getUserById(userId: string) {
  const query = 'SELECT * FROM users WHERE id = $1';
  return await db.query(query, [userId]);
}`,
    practiceQuestions: [
      {
        id: 'q-sqli-1',
        question: 'Which of the following database query snippets is immune to SQL injection?',
        options: [
          'db.query("SELECT * FROM items WHERE category = \'" + category + "\'")',
          'db.query("SELECT * FROM items WHERE category = $1", [category])',
          'db.query(`SELECT * FROM items WHERE category = "${escape(category)}"`)',
          'db.query("SELECT * FROM items WHERE category = " + sanitizeCategory(category))',
        ],
        correctIndex: 1,
        explanation: 'Parameterized queries with placeholder tokens ($1 or ?) separate the query structure from untrusted arguments at the driver level.',
      },
      {
        id: 'q-sqli-2',
        question: 'Why is string escaping often insufficient compared to native parameterized binding?',
        options: [
          'Escaping makes database queries run 10x slower on modern hardware.',
          'Attackers can bypass naive regex filters using multi-byte charsets or SQL dialect quirks.',
          'Database drivers disable indexing whenever strings are escaped.',
          'String escaping is only supported on legacy MySQL servers.',
        ],
        correctIndex: 1,
        explanation: 'Custom regex or string replace filters frequently miss character encoding edge-cases, null-byte injections, and nested query syntaxes.',
      },
    ],
    relatedFindingCategories: ['SECURITY', 'VULNERABILITY', 'DATABASE'],
    relatedSmellTypes: ['sql_injection', 'unsafe_query', 'security'],
  },
  {
    id: 'secret-management',
    domain: 'SECURITY',
    title: 'Secret Management & Token Exposure Prevention',
    summary: 'Hardcoding API tokens, private keys, or credentials in client bundles or public git repositories exposes infrastructure to credential theft and automated scanning bots.',
    whyItMatters: 'Public git repositories and client-side JavaScript bundles are continuously scanned by bots. Exposed cloud tokens can result in infrastructure hijacking, data breaches, and severe financial losses in minutes.',
    beginnerExplanation: 'Never write passwords or keys directly inside your code. Instead, store them in secret locked boxes called environment variables (.env files) on your secure server, and never commit secrets to GitHub.',
    intermediateExplanation: 'Secrets should reside in process environment variables (or cloud secret vaults like GCP Secret Manager / AWS Secrets Manager) and never be prefixed with client-exposed tags like `VITE_` or `NEXT_PUBLIC_`. Backend API endpoints should proxy requests to third-party services.',
    expertExplanation: 'Employ dynamic secret rotation, principle of least privilege IAM roles, and server-side envelope encryption. Inject credentials through ephemeral IAM workload identity federation rather than static long-lived keys.',
    badCodeExample: `// ❌ Vulnerable: Hardcoded API Key in code
const STRIPE_SECRET_KEY = "sk_live_51M0abcdef1234567890";

export async function chargeCustomer(amount: number) {
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  // ...
}`,
    goodCodeExample: `// ✅ Secure: Environment variable accessed server-side
import Stripe from 'stripe';

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }
  return new Stripe(key);
}`,
    practiceQuestions: [
      {
        id: 'q-sec-1',
        question: 'Where should sensitive third-party API secret keys (e.g. payment or LLM keys) be stored?',
        options: [
          'In a client-side constants.ts file for easy access',
          'In server-side environment variables or a secure key management service',
          'Embedded in local HTML meta tags',
          'Inside localStorage or browser indexedDB',
        ],
        correctIndex: 1,
        explanation: 'Secret keys must always be stored in server-side environment variables or dedicated secret managers and never bundled into frontend assets.',
      },
    ],
    relatedFindingCategories: ['SECURITY', 'SECRET', 'CONFIGURATION'],
    relatedSmellTypes: ['hardcoded_secret', 'exposed_credential', 'insecure_storage'],
  },
  {
    id: 'cyclomatic-complexity-refactor',
    domain: 'CODE QUALITY',
    title: 'Managing Cyclomatic Complexity & Branch Reduction',
    summary: 'Cyclomatic complexity measures the number of independent execution paths through source code. High complexity exponentially increases testing surface and developer cognitive load.',
    whyItMatters: 'Methods with cyclomatic complexity > 10 are significantly more prone to defects during refactoring, require dozens of test cases for full path coverage, and resist comprehension.',
    beginnerExplanation: 'When code has too many nested `if`, `else`, and `switch` statements, it is like a maze with too many turns. Breaking the maze into small, clear steps makes it easy to read, test, and fix.',
    intermediateExplanation: 'Reduce complexity using early returns (guard clauses), strategy lookup tables, polymorphism, or by extracting isolated helper functions. Each function should ideally have a single responsibility with ≤ 5 decision branches.',
    expertExplanation: 'Apply functional composition, state machines, or domain-driven command patterns to replace nested branching trees with deterministic, composable pipelines.',
    badCodeExample: `// ❌ High Complexity: Deeply nested decision tree (CC > 8)
function calculateDiscount(user: User, order: Order): number {
  if (user.isActive) {
    if (user.isVip) {
      if (order.total > 100) {
        if (order.items.length > 5) {
          return 0.30;
        } else {
          return 0.25;
        }
      } else {
        return 0.15;
      }
    } else if (order.total > 200) {
      return 0.10;
    }
  }
  return 0;
}`,
    goodCodeExample: `// ✅ Clean: Guard clauses and dedicated tier calculation
function calculateDiscount(user: User, order: Order): number {
  if (!user.isActive) return 0;
  if (user.isVip) return calculateVipDiscount(order);
  return order.total > 200 ? 0.10 : 0;
}

function calculateVipDiscount(order: Order): number {
  if (order.total <= 100) return 0.15;
  return order.items.length > 5 ? 0.30 : 0.25;
}`,
    practiceQuestions: [
      {
        id: 'q-cc-1',
        question: 'Which technique is most effective for reducing deeply nested "if-else" pyramids?',
        options: [
          'Replacing if-statements with multiple nested ternary operators',
          'Using guard clauses with early returns at the beginning of the function',
          'Disabling linter complexity rules in configuration',
          'Combining all conditions into a single 500-character logical OR line',
        ],
        correctIndex: 1,
        explanation: 'Guard clauses handle edge cases and exit conditions early, flattening the execution flow and drastically improving readability.',
      },
    ],
    relatedFindingCategories: ['MAINTAINABILITY', 'COMPLEXITY', 'CODE_SMELL'],
    relatedSmellTypes: ['cyclomatic_complexity', 'long_method', 'nested_control_flow'],
  },
  {
    id: 'unit-testing-fundamentals',
    domain: 'TESTING',
    title: 'Unit Testing, Isolation & Boundary Coverage',
    summary: 'High-quality unit tests verify discrete units of logic under normal, boundary, and error conditions using isolated mocks for external network and database I/O.',
    whyItMatters: 'Untested logic invites regressions during updates. Well-structured tests act as executable specifications, enabling fear-free refactoring and continuous deployment.',
    beginnerExplanation: 'Unit tests are like automatic quality checkpoints. When you write a function, you write small test scripts that check: "Does 2 + 2 give 4? What if I pass negative numbers or null?"',
    intermediateExplanation: 'Structure tests around the Arrange-Act-Assert (AAA) pattern. Ensure mock dependencies (e.g. APIs, timers) are reset between test cases and test boundary edge cases (0, empty arrays, null values, max limits).',
    expertExplanation: 'Implement property-based testing and mutation testing to detect subtle semantic flaws. Separate deterministic pure unit tests from end-to-end integration contracts with strict test isolation.',
    badCodeExample: `// ❌ Fragile: No test isolation, relies on live external database
test('fetch and process user', async () => {
  const user = await realDatabase.query('SELECT * FROM users LIMIT 1');
  const result = processUser(user);
  expect(result.status).toBe('PROCESSED');
});`,
    goodCodeExample: `// ✅ Robust: Isolated unit test with clear Arrange-Act-Assert
test('processUser applies tier discount accurately', () => {
  // Arrange
  const mockUser: User = { id: 'u1', isVip: true, isActive: true };
  const mockOrder: Order = { total: 150, items: new Array(6) };

  // Act
  const discount = calculateDiscount(mockUser, mockOrder);

  // Assert
  expect(discount).toBe(0.30);
});`,
    practiceQuestions: [
      {
        id: 'q-test-1',
        question: 'What is the primary benefit of the Arrange-Act-Assert (AAA) pattern in test suites?',
        options: [
          'It makes tests execute in parallel automatically.',
          'It provides a clear, predictable structure that separates setup, invocation, and verification.',
          'It replaces the need for test assertions in modern Jest/Vitest setups.',
          'It guarantees 100% mutation test scores.',
        ],
        correctIndex: 1,
        explanation: 'AAA structure provides immediate clarity on test preconditions (Arrange), the tested behavior (Act), and the expected outcome (Assert).',
      },
    ],
    relatedFindingCategories: ['TESTING', 'COVERAGE', 'QUALITY_GATE'],
    relatedSmellTypes: ['missing_tests', 'low_coverage', 'untested_branch'],
  },
  {
    id: 'circular-dependencies',
    domain: 'ARCHITECTURE',
    title: 'Decoupling Modules & Breaking Circular Dependencies',
    summary: 'Circular dependencies occur when Module A imports Module B which directly or indirectly imports Module A, causing undefined imports, evaluation deadlocks, and high coupling.',
    whyItMatters: 'Cycles in the dependency graph degrade tree-shaking, break bundle evaluation orders at runtime, and make modules impossible to test or reuse in isolation.',
    beginnerExplanation: 'If File A needs File B to work, but File B also needs File A, neither can finish starting up. Moving the shared piece to a neutral File C solves the loop.',
    intermediateExplanation: 'Break cycles using Dependency Inversion (passing interfaces/callbacks), extracting common shared types/constants into dedicated leaves (e.g. `types.ts` or `shared/`), or introducing an orchestrator layer.',
    expertExplanation: 'Enforce acyclic dependency graphs (DAG) using static architecture linters (`madge`, `eslint-plugin-import`). Apply hex-architecture ports & adapters so domain entities never depend on outer infrastructure layers.',
    badCodeExample: `// ❌ Circular Loop:
// user.ts
import { Order } from './order';
export class User {
  orders: Order[] = [];
}

// order.ts
import { User } from './user';
export class Order {
  owner: User; // Cycle: user -> order -> user
}`,
    goodCodeExample: `// ✅ Decoupled: Shared interface in leaf types module
// types.ts
export interface IUserSummary {
  id: string;
  name: string;
}

export interface IOrderSummary {
  id: string;
  total: number;
}`,
    practiceQuestions: [
      {
        id: 'q-arch-1',
        question: 'What is the most maintainable strategy to resolve a circular dependency between two business modules?',
        options: [
          'Ignore the cycle if Vite or Webpack compiles without runtime errors',
          'Extract shared types, data interfaces, or utilities into a separate common module',
          'Merge both 2,000-line files into a single monolithic script',
          'Use setTimeout to delay import resolution',
        ],
        correctIndex: 1,
        explanation: 'Extracting shared models or introducing interfaces eliminates the bidirectional dependency without creating messy monoliths.',
      },
    ],
    relatedFindingCategories: ['ARCHITECTURE', 'DEPENDENCIES', 'COUPLING'],
    relatedSmellTypes: ['circular_dependency', 'tight_coupling', 'spaghetti_code'],
  },
  {
    id: 'unhandled-exceptions',
    domain: 'DEBUGGING',
    title: 'Defensive Error Handling & Error Boundaries',
    summary: 'Swallowing exceptions silently or failing to handle asynchronous promise rejections leads to unrecoverable crashes, corrupted application state, and unhelpful blank screens.',
    whyItMatters: 'Unhandled errors cause silent application hangs, data loss in client stores, and difficult-to-diagnose production downtime without actionable telemetry.',
    beginnerExplanation: 'When something goes wrong (like a network drop), the app should politely explain what happened and offer a retry button instead of freezing or crashing.',
    intermediateExplanation: 'Wrap high-risk async operations in structured try/catch blocks with contextual error logging. Use React Error Boundaries for UI isolation and always reject promises with meaningful `Error` objects rather than raw strings.',
    expertExplanation: 'Adopt discriminated union Result types (`Result<T, E>`) for domain operations to enforce explicit error handling at compile-time. Implement centralized telemetry dispatch with breadcrumbs and error fingerprinting.',
    badCodeExample: `// ❌ Anti-pattern: Silent catch swallowing errors
async function syncUserProfile(id: string) {
  try {
    const res = await api.fetchUser(id);
    updateStore(res.data);
  } catch (err) {
    // Silent catch: User sees nothing, state is out of sync
  }
}`,
    goodCodeExample: `// ✅ Robust: Contextual handling with user notification and telemetry
async function syncUserProfile(id: string): Promise<boolean> {
  try {
    const res = await api.fetchUser(id);
    updateStore(res.data);
    return true;
  } catch (err) {
    logger.error('Failed to sync user profile', { userId: id, error: err });
    showNotification('Network synchronization failed. Retrying in background...', 'error');
    return false;
  }
}`,
    practiceQuestions: [
      {
        id: 'q-deb-1',
        question: 'Why is an empty `catch (e) {}` block considered an anti-pattern in production software?',
        options: [
          'It consumes extra memory in V8 garbage collector.',
          'It hides critical failures, making bugs impossible to detect, troubleshoot, or recover from.',
          'Modern JavaScript engines throw syntax errors for empty catch blocks.',
          'It prevents synchronous functions from returning promises.',
        ],
        correctIndex: 1,
        explanation: 'Swallowing errors hides root causes from developers and leaves users in broken states without recovery paths.',
      },
    ],
    relatedFindingCategories: ['RELIABILITY', 'ERROR_HANDLING', 'DEBUGGING'],
    relatedSmellTypes: ['empty_catch', 'unhandled_promise', 'silent_error'],
  },
  {
    id: 'resource-leak-cleanup',
    domain: 'PERFORMANCE',
    title: 'Resource Lifecycle Management & Memory Leaks',
    summary: 'Failing to unsubscribe from event listeners, clear timers, or close database/stream handles prevents garbage collection and steadily exhausts memory.',
    whyItMatters: 'Memory leaks cause browser tabs to become sluggish over time, trigger Out-Of-Memory (OOM) crashes in long-running services, and degrade user experience.',
    beginnerExplanation: 'Whenever you turn something on in code (like a timer, interval, or subscription), you must remember to turn it off when you are done with it.',
    intermediateExplanation: 'In React `useEffect` hooks, always return a cleanup function to unsubscribe from events, clear intervals (`clearInterval`), and abort in-flight network requests using `AbortController`.',
    expertExplanation: 'Use `WeakRef` and `FinalizationRegistry` for advanced cache lifecycles. Profile heap snapshots in DevTools to identify detached DOM trees and uncollected closures.',
    badCodeExample: `// ❌ Memory Leak: Interval runs forever even after component unmounts
useEffect(() => {
  setInterval(() => {
    fetchLatestMetrics();
  }, 1000);
}, []);`,
    goodCodeExample: `// ✅ Safe: Cleanup callback returned
useEffect(() => {
  const timer = setInterval(() => {
    fetchLatestMetrics();
  }, 1000);

  return () => clearInterval(timer);
}, []);`,
    practiceQuestions: [
      {
        id: 'q-perf-1',
        question: 'What is the standard way to prevent memory leaks with setInterval inside a React useEffect hook?',
        options: [
          'Wrap the setInterval in a try-catch block',
          'Return a cleanup function from useEffect that calls clearInterval',
          'Use window.alert before starting the timer',
          'Pass an empty string as the dependency array',
        ],
        correctIndex: 1,
        explanation: 'The return function of useEffect executes on component unmount and before re-running the effect, ensuring timers are cleaned up.',
      },
    ],
    relatedFindingCategories: ['PERFORMANCE', 'MEMORY', 'LIFECYCLE'],
    relatedSmellTypes: ['memory_leak', 'unclosed_resource', 'missing_cleanup'],
  },
];

export class DeveloperLearningService {
  private static eventsCache: LearningEvent[] | null = null;
  private static goalsCache: LearningGoal[] | null = null;

  // ----------------------------------------------------
  // 2. LEARNING EVENTS MANAGEMENT
  // ----------------------------------------------------
  public static getLearningEvents(): LearningEvent[] {
    if (this.eventsCache) return this.eventsCache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LEARNING_EVENTS);
      if (raw) {
        this.eventsCache = JSON.parse(raw);
        return this.eventsCache || [];
      }
    } catch (e) {
      console.warn('Failed to load learning events from storage:', e);
    }
    this.eventsCache = [];
    return this.eventsCache;
  }

  public static recordLearningEvent(event: Omit<LearningEvent, 'id' | 'timestamp'>): LearningEvent {
    const events = this.getLearningEvents();
    const newEvent: LearningEvent = {
      ...event,
      id: `lev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };

    const updated = [newEvent, ...events];
    this.eventsCache = updated;
    try {
      localStorage.setItem(STORAGE_KEY_LEARNING_EVENTS, JSON.stringify(updated.slice(0, 500)));
    } catch (e) {
      console.warn('Failed to persist learning event:', e);
    }

    return newEvent;
  }

  // ----------------------------------------------------
  // 3. FINDING TO CONCEPT MAPPING
  // ----------------------------------------------------
  public static getRelevantConcept(finding: ActionFinding): LearningConcept | null {
    if (!finding) return null;

    const cat = (finding.category || '').toUpperCase();
    const title = (finding.title || '').toLowerCase();
    const msg = (finding.message || '').toLowerCase();

    // 1. SQL Injection / Database Security
    if (title.includes('sql') || msg.includes('sql injection') || msg.includes('prepared statement')) {
      return CORE_LEARNING_CONCEPTS.find((c) => c.id === 'sql-injection-parameterization') || null;
    }

    // 2. Hardcoded Secret / Credential
    if (title.includes('secret') || title.includes('key') || title.includes('token') || msg.includes('hardcoded') || msg.includes('credential')) {
      return CORE_LEARNING_CONCEPTS.find((c) => c.id === 'secret-management') || null;
    }

    // 3. Cyclomatic Complexity / Cognitive Complexity
    if (title.includes('complexity') || msg.includes('cyclomatic') || title.includes('branch') || msg.includes('cognitive complexity')) {
      return CORE_LEARNING_CONCEPTS.find((c) => c.id === 'cyclomatic-complexity-refactor') || null;
    }

    // 4. Missing Tests / Coverage
    if (cat === 'TESTING' || title.includes('test') || msg.includes('test gap') || msg.includes('untested')) {
      return CORE_LEARNING_CONCEPTS.find((c) => c.id === 'unit-testing-fundamentals') || null;
    }

    // 5. Circular Dependency / Tight Coupling
    if (title.includes('circular') || title.includes('dependency') || msg.includes('cycle') || msg.includes('coupling')) {
      return CORE_LEARNING_CONCEPTS.find((c) => c.id === 'circular-dependencies') || null;
    }

    // 6. Unhandled Exceptions / Error Handling
    if (title.includes('catch') || title.includes('error') || msg.includes('unhandled') || msg.includes('exception')) {
      return CORE_LEARNING_CONCEPTS.find((c) => c.id === 'unhandled-exceptions') || null;
    }

    // 7. Resource Leaks / Memory
    if (title.includes('leak') || title.includes('memory') || msg.includes('cleanup') || msg.includes('interval')) {
      return CORE_LEARNING_CONCEPTS.find((c) => c.id === 'resource-leak-cleanup') || null;
    }

    // Fallback: match by domain
    const domainMatch = CORE_LEARNING_CONCEPTS.find((c) => c.relatedFindingCategories.includes(cat));
    return domainMatch || CORE_LEARNING_CONCEPTS[0];
  }

  // ----------------------------------------------------
  // 4. EVIDENCE-BASED DEVELOPER SKILL ENGINE
  // ----------------------------------------------------
  public static calculateDeveloperSkills(
    profile: UserPersonalizationProfile,
    allFindings: ActionFinding[] = []
  ): DeveloperSkill[] {
    const events = this.getLearningEvents();
    const domains: SkillDomain[] = [
      'PROGRAMMING',
      'DEBUGGING',
      'CODE QUALITY',
      'SECURITY',
      'TESTING',
      'ARCHITECTURE',
      'DEPENDENCIES',
      'PERFORMANCE',
      'MAINTAINABILITY',
      'DEVOPS / CI',
    ];

    // Baseline mapping from questionnaire / personalization profile
    const baselineMap: Record<SkillDomain, number> = {
      PROGRAMMING: profile.skill_dimensions?.programming || 3,
      DEBUGGING: profile.skill_dimensions?.debugging || 3,
      'CODE QUALITY': profile.skill_dimensions?.code_comprehension || 3,
      SECURITY: profile.skill_dimensions?.security || 3,
      TESTING: profile.skill_dimensions?.debugging ? Math.min(5, profile.skill_dimensions.debugging + 0.2) : 3,
      ARCHITECTURE: profile.skill_dimensions?.architecture || 3,
      DEPENDENCIES: profile.skill_dimensions?.dependencies || 3,
      PERFORMANCE: profile.skill_dimensions?.cs_concepts || 3,
      MAINTAINABILITY: profile.skill_dimensions?.code_comprehension || 3,
      'DEVOPS / CI': profile.skill_dimensions?.architecture || 3,
    };

    return domains.map((domain) => {
      const domainEvents = events.filter((e) => e.skillDomain === domain);
      const passedPractices = domainEvents.filter((e) => e.eventType === 'PRACTICE_PASSED').length;
      const failedPractices = domainEvents.filter((e) => e.eventType === 'PRACTICE_FAILED').length;
      const completedLessons = domainEvents.filter((e) => e.eventType === 'LESSON_COMPLETED').length;
      const verifiedFixes = domainEvents.filter((e) => e.eventType === 'FIX_VERIFIED').length;
      const regressions = domainEvents.filter((e) => e.eventType === 'REGRESSION_DETECTED').length;

      // Active findings count in this domain
      const activeDomainFindings = allFindings.filter((f) => {
        if (f.status === 'FIXED' || f.status === 'FALSE_POSITIVE') return false;
        const cat = (f.category || '').toUpperCase();
        if (domain === 'SECURITY' && (cat === 'SECURITY' || cat === 'VULNERABILITY')) return true;
        if (domain === 'TESTING' && (cat === 'TESTING' || cat === 'QUALITY_GATE')) return true;
        if (domain === 'ARCHITECTURE' && cat === 'ARCHITECTURE') return true;
        if (domain === 'PERFORMANCE' && cat === 'PERFORMANCE') return true;
        if (domain === 'MAINTAINABILITY' && (cat === 'MAINTAINABILITY' || cat === 'COMPLEXITY')) return true;
        return false;
      }).length;

      const baseScore = baselineMap[domain] || 3;
      const positiveEvidence = passedPractices * 0.25 + completedLessons * 0.2 + verifiedFixes * 0.3;
      const negativeEvidence = failedPractices * 0.15 + regressions * 0.3 + (activeDomainFindings > 3 ? 0.3 : 0);

      const computedLevel = Math.max(1, Math.min(5, Number((baseScore + positiveEvidence - negativeEvidence).toFixed(1))));
      const totalEvidenceCount = domainEvents.length + verifiedFixes;

      let confidence: DeveloperSkill['confidence'] = 'Initial Estimate';
      if (totalEvidenceCount >= 10) confidence = 'Validated';
      else if (totalEvidenceCount >= 5) confidence = 'High';
      else if (totalEvidenceCount >= 2) confidence = 'Medium';

      let stage: SkillLevelStage = 'Developing';
      if (activeDomainFindings >= 3 || failedPractices > passedPractices + 2) {
        stage = 'Needs Attention';
      } else if (computedLevel >= 4.0 && positiveEvidence > 0.5) {
        stage = 'Strong';
      } else if (positiveEvidence > 0.3 || computedLevel >= 3.2) {
        stage = 'Improving';
      } else {
        stage = 'Developing';
      }

      let historicalTrend: 'Improving' | 'Stable' | 'Needs Attention' = 'Stable';
      if (passedPractices + verifiedFixes > failedPractices + regressions + 1) {
        historicalTrend = 'Improving';
      } else if (activeDomainFindings >= 3 || regressions > 0) {
        historicalTrend = 'Needs Attention';
      }

      const evidenceSnippets: string[] = [];
      if (verifiedFixes > 0) evidenceSnippets.push(`Verified ${verifiedFixes} code remediation(s) in active repository`);
      if (passedPractices > 0) evidenceSnippets.push(`Passed ${passedPractices} interactive practice challenge(s)`);
      if (completedLessons > 0) evidenceSnippets.push(`Completed ${completedLessons} learning walkthrough(s)`);
      if (activeDomainFindings > 0) evidenceSnippets.push(`${activeDomainFindings} active finding(s) detected in current codebase`);

      return {
        skillId: `skill-${domain.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        domain,
        level: computedLevel,
        stage,
        confidence,
        evidenceCount: totalEvidenceCount,
        improvedCount: passedPractices + verifiedFixes,
        regressionCount: regressions + failedPractices,
        lastUpdated: domainEvents[0]?.timestamp || Date.now(),
        evidenceSnippets,
        historicalTrend,
      };
    });
  }

  // ----------------------------------------------------
  // 5. PERSONALIZED RECOMMENDATIONS ENGINE
  // ----------------------------------------------------
  public static getRecommendations(
    profile: UserPersonalizationProfile,
    allFindings: ActionFinding[] = []
  ): LearningRecommendation[] {
    const skills = this.calculateDeveloperSkills(profile, allFindings);
    const recommendations: LearningRecommendation[] = [];

    // Prioritize concepts related to active findings
    for (const concept of CORE_LEARNING_CONCEPTS) {
      const matchingFindings = allFindings.filter((f) => {
        if (f.status === 'FIXED' || f.status === 'FALSE_POSITIVE') return false;
        const cat = (f.category || '').toUpperCase();
        return concept.relatedFindingCategories.includes(cat);
      });

      const skill = skills.find((s) => s.domain === concept.domain);
      const stage = skill?.stage || 'Developing';

      if (matchingFindings.length > 0) {
        recommendations.push({
          conceptId: concept.id,
          conceptTitle: concept.title,
          domain: concept.domain,
          priority: matchingFindings.length >= 2 || stage === 'Needs Attention' ? 'HIGH' : 'MEDIUM',
          reason: `Detected ${matchingFindings.length} active ${concept.domain.toLowerCase()} finding(s) in your code that can be permanently prevented.`,
          findingCount: matchingFindings.length,
          relatedFindingId: matchingFindings[0]?.id,
          estimatedMinutes: 4,
          currentSkillStage: stage,
        });
      } else if (stage === 'Needs Attention' || stage === 'Developing') {
        recommendations.push({
          conceptId: concept.id,
          conceptTitle: concept.title,
          domain: concept.domain,
          priority: 'LOW',
          reason: `Strengthen your foundational knowledge in ${concept.domain.toLowerCase()}.`,
          findingCount: 0,
          estimatedMinutes: 5,
          currentSkillStage: stage,
        });
      }
    }

    return recommendations.sort((a, b) => {
      const pOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return pOrder[a.priority] - pOrder[b.priority] || b.findingCount - a.findingCount;
    });
  }

  // ----------------------------------------------------
  // 6. LEARNING GOALS
  // ----------------------------------------------------
  public static getGoals(): LearningGoal[] {
    if (this.goalsCache) return this.goalsCache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LEARNING_GOALS);
      if (raw) {
        this.goalsCache = JSON.parse(raw);
        return this.goalsCache || [];
      }
    } catch (e) {
      console.warn('Failed to load learning goals:', e);
    }
    const defaultGoals: LearningGoal[] = [
      {
        id: 'goal-sec-mastery',
        domain: 'SECURITY',
        title: 'Zero High-Severity Security Findings',
        target: 'Eliminate SQL injection and hardcoded secret findings across active repository',
        progress: 65,
        createdAt: Date.now() - 86400000 * 5,
        status: 'ACTIVE',
      },
      {
        id: 'goal-test-coverage',
        domain: 'TESTING',
        title: 'Establish 80%+ Test Coverage on Modified Code',
        target: 'Close critical test gaps on changed controller and service modules',
        progress: 40,
        createdAt: Date.now() - 86400000 * 3,
        status: 'ACTIVE',
      },
    ];
    this.goalsCache = defaultGoals;
    return defaultGoals;
  }

  public static addGoal(goal: Omit<LearningGoal, 'id' | 'createdAt'>): LearningGoal {
    const goals = this.getGoals();
    const newGoal: LearningGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = [newGoal, ...goals];
    this.goalsCache = updated;
    try {
      localStorage.setItem(STORAGE_KEY_LEARNING_GOALS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save goal:', e);
    }
    return newGoal;
  }
}
