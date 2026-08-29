import { CodeSmell } from '../../types';

export interface DebuggingStep {
  stepNumber: number;
  name: 'Observe' | 'Locate' | 'Understand' | 'Test' | 'Fix' | 'Verify';
  title: string;
  description: string;
  actionablePrompt: string;
  exampleSnippet?: string;
}

export interface DebuggingSession {
  targetError: string;
  targetLine?: number;
  rootCause: string;
  steps: DebuggingStep[];
  hint: string;
  explanation: string;
  correctedSnippet: string;
  verificationQuestion: string;
}

export class DebuggingCoach {
  /**
   * Generates the standard 6-step debugging guidance framework
   */
  public static getSteps(errorSummary: string, line?: number): DebuggingStep[] {
    return [
      {
        stepNumber: 1,
        name: 'Observe',
        title: 'Step 1: Observe Without Panic',
        description: 'Carefully read the exact error message or symptom. What is the unexpected behavior?',
        actionablePrompt: `Notice the failure: "${errorSummary}". Note what was expected vs what actually happened.`,
      },
      {
        stepNumber: 2,
        name: 'Locate',
        title: 'Step 2: Locate the Exact Origin',
        description: 'Find the specific file and line number flagged by the analyzer/runtime stack trace.',
        actionablePrompt: line
          ? `Focus your attention strictly on Line ${line} (and the 2-3 lines immediately preceding it).`
          : 'Look at the top of the error callstack to identify which line triggered the issue.',
      },
      {
        stepNumber: 3,
        name: 'Understand',
        title: 'Step 3: Understand the Root Cause',
        description: 'Why did the computer halt here? What assumption did your code make that turned out to be false?',
        actionablePrompt: 'Ask: Was a variable undefined? Did an array index exceed its length? Did a syntax delimiter fail to close?',
      },
      {
        stepNumber: 4,
        name: 'Test',
        title: 'Step 4: Test a Focused Hypothesis',
        description: 'Form a testable guess about what is missing or incorrect before altering multiple lines at once.',
        actionablePrompt: 'Make ONE deliberate change that directly addresses the root cause identified in Step 3.',
      },
      {
        stepNumber: 5,
        name: 'Fix',
        title: 'Step 5: Apply the Clean Fix',
        description: 'Write the corrected syntax or logic statement following standard language idioms.',
        actionablePrompt: 'Apply the fix, ensuring proper types, null guards, or balanced delimiters.',
      },
      {
        stepNumber: 6,
        name: 'Verify',
        title: 'Step 6: Verify & Guard Against Regressions',
        description: 'Re-run the DevPulse analyzer and test cases to confirm the error is cleared and no new issues were introduced.',
        actionablePrompt: 'Click "Run Analysis" in DevPulse to check if your Maintainability and Health scores improved!',
      },
    ];
  }

  /**
   * Generates a patient, frustration-aware mentoring response
   */
  public static handleFrustration(userMessage: string, smells: CodeSmell[] = []): string {
    const primarySmell = smells[0];
    const lineHint = primarySmell?.line ? `on Line ${primarySmell.line}` : 'in your code';

    return `### Let's Pause & Breathe 🧘‍♂️
Getting errors while writing code is 100% normal — in fact, debugging is more than half of professional software engineering!

Let's ignore the rest of the file for a minute and focus strictly on the single issue ${lineHint}:
${primarySmell ? `> **Diagnostic Flag:** ${primarySmell.title} (${primarySmell.problem})` : '> **Focus:** Let\'s inspect the input data flow one step at a time.'}

**Our immediate 3-step action plan:**
1. **Look at line ${primarySmell?.line || 1}**: Notice the exact token or variable being accessed.
2. **Check the rule**: ${primarySmell?.recommendation || 'Ensure all variables are declared and delimiters are closed.'}
3. **Make one small edit**: Save and re-run analysis.

*Would you like a progressive hint to guide your fix, or would you prefer the complete solution right away?*`;
  }

  /**
   * Formats a complete learning-first debugging coach response
   */
  public static formatDebuggingGuide(
    smell: CodeSmell,
    codeSnippet: string,
    language: string
  ): string {
    const steps = this.getSteps(smell.title, smell.line);

    return `# 🛠️ DevPulse Debugging Coach

## 1. What Happened?
**${smell.title}**
${smell.problem || smell.explanation}

## 2. Where Did It Occur?
- **Location:** Line ${smell.line}
- **Category:** ${smell.category.toUpperCase()}
- **Severity:** ${smell.severity.toUpperCase()}

## 3. The 6-Step Debugging Workflow
${steps
  .map(
    (s) => `### ${s.title}
- **Mindset:** ${s.description}
- **Action:** ${s.actionablePrompt}`
  )
  .join('\n\n')}

## 4. Progressive Hint
💡 **Hint:** ${smell.recommendation}

## 5. Corrected Code Example
\`\`\`${language}
// Recommended pattern for Line ${smell.line}:
${smell.recommendation}
\`\`\`

## 6. What to Learn from This
Every bug teaches us a principle about how our language runtime evaluates memory, types, or syntax. Once you recognize this pattern, you will spot it instantly next time!

---
*Would you like to try applying the fix yourself, or do you want me to explain any step deeper?*`;
  }
}
