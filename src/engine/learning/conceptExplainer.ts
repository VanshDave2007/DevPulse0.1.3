import { AnalogyEngine } from './analogyEngine';

export interface ConceptExplanationOptions {
  concept: string;
  language?: string;
  depthLevel?: 1 | 2 | 3 | 4; // 1: Simple, 2: Code example, 3: Technical, 4: Advanced
}

export class ConceptExplainer {
  public static explain(options: ConceptExplanationOptions): string {
    const { concept, language = 'javascript', depthLevel = 2 } = options;
    const analogy = AnalogyEngine.getAnalogy(concept);

    if (depthLevel === 1) {
      // Level 1: Pure simple explanation + analogy
      return `# ${analogy.concept} (Simple Overview)

## Simple Definition
${analogy.technicalDefinition}

## Think of It Like...
${analogy.everydayAnalogy}

## Key Takeaway
${analogy.outputDescription}`;
    }

    if (depthLevel === 2) {
      // Level 2: Standard Concept Format
      return `# ${analogy.concept}

## Simple Definition
${analogy.technicalDefinition}

## Think of It Like...
${analogy.everydayAnalogy}

## Example Code
\`\`\`${language}
${analogy.codeExample}
\`\`\`

## How It Works
${analogy.connectionToCode}

## Output & Behavior
${analogy.outputDescription}

## Common Mistake to Avoid
${analogy.commonMistake}

## Remember
Keep code modular, ensure variables and functions have clear descriptive names, and test small blocks frequently.

## Try It Yourself
${analogy.tryItYourselfPrompt}`;
    }

    // Level 3 & 4: Deep Technical Breakdown
    return `# ${analogy.concept} — Deep Technical Guide

## 1. Architectural & Theoretical Definition
${analogy.technicalDefinition}

## 2. Intuitive Mental Model
${analogy.everydayAnalogy}

## 3. Concrete Implementation
\`\`\`${language}
${analogy.codeExample}
\`\`\`

## 4. Execution Mechanics & Call Stack Flow
${analogy.connectionToCode}

## 5. Failure Modes & Edge Cases
- **Common Pitfall:** ${analogy.commonMistake}
- **Boundary Risk:** Watch out for off-by-one errors, state mutation side-effects, and unhandled null/undefined values.

## 6. Hands-On Practice Challenge
${analogy.tryItYourselfPrompt}`;
  }

  /**
   * Generates a step-by-step code walkthrough given lines of source code
   */
  public static generateStepByStep(code: string, language: string = 'python'): string {
    const lines = code.split('\n').slice(0, 30); // inspect first 30 lines
    const breakdown = lines
      .map((line, idx) => {
        const lineNum = idx + 1;
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
          return null;
        }

        let stepDesc = 'Executes statement.';
        if (trimmed.startsWith('def ') || trimmed.startsWith('function ') || trimmed.includes('=>')) {
          stepDesc = 'Declares a function and stores its reference in memory without executing it yet.';
        } else if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
          stepDesc = 'Sets up a loop iteration and evaluates the continuation condition.';
        } else if (trimmed.startsWith('if ')) {
          stepDesc = 'Evaluates boolean condition to decide whether to enter this branch.';
        } else if (trimmed.startsWith('else:') || trimmed.startsWith('else {')) {
          stepDesc = 'Fallback branch executed when previous conditions are false.';
        } else if (trimmed.startsWith('return ')) {
          stepDesc = 'Calculates final result, unwinds local scope, and returns value to caller.';
        } else if (trimmed.includes('=')) {
          stepDesc = 'Evaluates expression on right side and assigns value into labeled variable storage.';
        } else if (trimmed.includes('print(') || trimmed.includes('console.log(')) {
          stepDesc = 'Outputs formatted value to standard output stream (console).';
        }

        return `### Step ${lineNum} (Line ${lineNum})
\`\`\`${language}
${line}
\`\`\`
**What happens:** ${stepDesc}`;
      })
      .filter(Boolean);

    return `# 🧭 Step-by-Step Execution Walkthrough

Here is the exact sequential execution order for your ${language} code:

${breakdown.join('\n\n')}

---
### Summary
The program initializes state, evaluates control branches, processes iterative sequences, and returns or prints the final computed results.`;
  }
}
