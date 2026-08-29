import { CodeSmell } from '../../types';

export interface ProgressiveHintSet {
  problemTitle: string;
  line?: number;
  hint1_General: string;
  hint2_Concept: string;
  hint3_Location: string;
  hint4_Correction: string;
  solution: string;
}

export class HintSystem {
  public static generateHintsForSmell(smell: CodeSmell, language: string = 'python'): ProgressiveHintSet {
    const line = smell.line;
    const title = smell.title;

    let hint1 = `Take a close look at the structure near line ${line}. There is a mismatch with standard ${language} syntax or best practices.`;
    let hint2 = `The issue relates to ${smell.category.replace('_', ' ')}. Consider how ${language} expects this construct to be defined or scoped.`;
    let hint3 = `Examine line ${line} directly: "${smell.problem || smell.explanation}". Notice the specific keywords or operators used.`;
    let hint4 = `To resolve this, apply this specific change: ${smell.recommendation}`;
    let solution = `// Fix for Line ${line}:\n${smell.recommendation}`;

    // Specialized hint refinement based on category
    if (smell.category === 'syntax' || smell.category === 'correctness') {
      hint1 = `There is an unbalanced delimiter, missing punctuation, or invalid operator near line ${line}.`;
      hint2 = `Check if parentheses \`()\`, brackets \`[]\`, braces \`{}\`, or quotation marks \`""\` match their pairs properly.`;
      hint3 = `Look right at line ${line}: check for missing colons, illegal increment/equality operators, or unclosed literals.`;
      hint4 = `${smell.recommendation}`;
      solution = `Ensure line ${line} complies with: ${smell.recommendation}`;
    } else if (smell.category === 'complexity') {
      hint1 = `This block of code is doing too many things at once or contains deep nested logic.`;
      hint2 = `Each \`if\`, loop, or switch branch adds extra paths to test and understand.`;
      hint3 = `Look at line ${line}: Can you extract inner logic into a helper function or use early return guard clauses?`;
      hint4 = `Replace nested \`if/else\` structures with guard clauses: \`if (!valid) return;\``;
      solution = `Extract helper functions or invert conditionals to return early, flattening indentation.`;
    } else if (smell.category === 'dead_code') {
      hint1 = `There is something declared in the file that is never actually referenced or used.`;
      hint2 = `Unused variables and unreachable code after \`return\` statements take up space without doing work.`;
      hint3 = `Inspect line ${line}: find the identifier that is declared but never read.`;
      hint4 = `Remove or comment out the unused identifier on line ${line}.`;
      solution = `Delete the unused declaration on line ${line}.`;
    }

    return {
      problemTitle: title,
      line,
      hint1_General: hint1,
      hint2_Concept: hint2,
      hint3_Location: hint3,
      hint4_Correction: hint4,
      solution,
    };
  }

  public static formatHintOutput(hints: ProgressiveHintSet, level: 1 | 2 | 3 | 4 | 'solution'): string {
    if (level === 1) {
      return `### 💡 Hint 1 of 4 (General Clue)
**Focus Area:**
${hints.hint1_General}

*Need more help? Ask for "Hint 2" or "Point me to the concept".*`;
    }

    if (level === 2) {
      return `### 💡 Hint 2 of 4 (Underlying Concept)
**Concept Direction:**
${hints.hint2_Concept}

*Still stuck? Ask for "Hint 3" to pinpoint the exact line and token.*`;
    }

    if (level === 3) {
      return `### 💡 Hint 3 of 4 (Location & Construct)
**Target Location:** Line ${hints.line || 'Analyzed'}
${hints.hint3_Location}

*Ready for the exact correction steps? Ask for "Hint 4" or "Show Solution".*`;
    }

    if (level === 4) {
      return `### 💡 Hint 4 of 4 (Exact Required Change)
**How to Correct:**
${hints.hint4_Correction}

*Would you like to try writing this fix yourself, or should I show the complete solution?*`;
    }

    return `### ✅ Complete Solution
${hints.solution}

**Why this fix works:**
It directly resolves the root cause while maintaining code cleanliness and eliminating the diagnostic flag.`;
  }
}
