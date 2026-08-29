import { CodeSmell } from '../../types';
import { AnalogyEngine } from './analogyEngine';

export interface FormattedErrorExplanation {
  title: string;
  whatHappened: string;
  where: string;
  why: string;
  analogy?: string;
  fix: string;
  correctedCode: string;
  lesson: string;
}

export class ErrorExplainer {
  /**
   * Formats a complete error explanation adhering to the DevPulse Error Teaching Standard
   */
  public static explainError(smell: CodeSmell, language: string = 'python'): string {
    const analogy = AnalogyEngine.getAnalogy(smell.category);

    return `# 🔍 Diagnostic Error & Smell Analysis

## 1. What Happened?
**${smell.title}**
${smell.problem || smell.explanation}

## 2. Where Did It Occur?
- **Location:** Line ${smell.line}
- **Category:** ${smell.category.toUpperCase()}
- **Severity Level:** ${smell.severity.toUpperCase()}

## 3. Why Did This Happen?
${smell.explanation}

## 4. Think of It Like...
${analogy.everydayAnalogy}

## 5. How to Fix It
${smell.recommendation}

## 6. Corrected Code Pattern
\`\`\`${language}
// Recommended fix for Line ${smell.line}:
${smell.recommendation}
\`\`\`

## 7. What to Learn from This
${analogy.outputDescription} Understanding this rule prevents unexpected runtime exceptions, lowers mental debugging fatigue, and ensures standard ${language} best practices.`;
  }
}
