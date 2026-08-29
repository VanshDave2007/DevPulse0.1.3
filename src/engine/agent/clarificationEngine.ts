import { ClarificationQuestion } from '../../types';

export function checkQueryAmbiguity(userQuery: string): ClarificationQuestion | null {
  if (!userQuery || !userQuery.trim()) return null;
  const q = userQuery.trim().toLowerCase();

  // Ambiguous prompt 1: "Review my code" or "Check changes" without target
  if (q === 'review' || q === 'review my code' || q === 'check changes' || q === 'analyze') {
    return {
      id: 'clarify-scope',
      question: 'Which review scope would you like DevPulse Agent to run?',
      options: [
        {
          id: 'full-agentic',
          label: 'Full Agentic Review (Git Diff + AST + Call Graph + Security)',
          description: 'Comprehensive multi-stage impact analysis and regression testing.',
        },
        {
          id: 'breaking-contract',
          label: 'Contract & Signature Mismatches Only',
          description: 'Focus strictly on public API breaking changes and downstream caller compatibility.',
        },
        {
          id: 'security-vuln',
          label: 'Security & Dependency Vulnerabilities',
          description: 'Scan code and manifests for CVE advisories, injection, and secret leaks.',
        },
      ],
    };
  }

  // Ambiguous prompt 2: "Fix this" without specifying finding
  if (q === 'fix this' || q === 'fix the bug' || q === 'fix error') {
    return {
      id: 'clarify-fix-target',
      question: 'Which specific finding or regression would you like to generate a fix for?',
      options: [
        {
          id: 'fix-signature',
          label: 'Fix Missing Arguments in Caller (e.g. checkout.py)',
          description: 'Update downstream call sites with backward-compatible defaults or proper arguments.',
        },
        {
          id: 'fix-sql',
          label: 'Fix SQL Injection via Query Parameterization',
          description: 'Replace raw string interpolation with secure parameterized queries.',
        },
        {
          id: 'fix-pool',
          label: 'Fix Database Connection Leak',
          description: 'Wrap database connections in try/finally release blocks.',
        },
      ],
    };
  }

  return null;
}
