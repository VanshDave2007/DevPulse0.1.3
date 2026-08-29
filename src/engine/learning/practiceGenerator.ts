import { CodeMetrics, SupportedLanguage } from '../../types';

export interface PracticeChallenge {
  title: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  problemStatement: string;
  starterCode: string;
  expectedOutput: string;
  hint1: string;
  hint2: string;
  solution: string;
  explanation: string;
}

export class PracticeGenerator {
  public static generateChallenge(
    language: SupportedLanguage,
    metrics?: CodeMetrics
  ): PracticeChallenge {
    const lang = (language || 'python').toLowerCase();

    if (lang === 'python') {
      return {
        title: 'Safe Division & Input Validation',
        topic: 'Conditionals & Exception Handling',
        difficulty: 'Beginner',
        problemStatement:
          'Write a function `safe_divide(a, b)` that returns `a / b`. If `b` is zero, it should return `"Cannot divide by zero"` instead of crashing with a ZeroDivisionError.',
        starterCode: `def safe_divide(a, b):\n    # TODO: Check if b is 0 before dividing\n    pass\n\nprint(safe_divide(10, 2)) # Expected: 5.0\nprint(safe_divide(10, 0)) # Expected: "Cannot divide by zero"`,
        expectedOutput: `5.0\nCannot divide by zero`,
        hint1: 'Use an `if` conditional to check `if b == 0:` before attempting division.',
        hint2: 'Remember to return a string message for the zero case and `a / b` for the valid case.',
        solution: `def safe_divide(a, b):\n    if b == 0:\n        return "Cannot divide by zero"\n    return a / b`,
        explanation:
          'Guard clauses allow you to handle invalid input or boundary cases early, preventing unexpected runtime crashes and improving code reliability.',
      };
    }

    if (lang === 'javascript' || lang === 'typescript') {
      return {
        title: 'Array Filtering & Transformation',
        topic: 'Higher-Order Functions & Loops',
        difficulty: 'Beginner',
        problemStatement:
          'Write a function `getPositiveSquares(numbers)` that takes an array of numbers, filters out negative numbers and zero, and returns an array of their squared values.',
        starterCode: `function getPositiveSquares(numbers) {\n  // TODO: Filter numbers > 0 and square them\n  return [];\n}\n\nconsole.log(getPositiveSquares([-2, 0, 3, 5])); // Expected: [9, 25]`,
        expectedOutput: `[9, 25]`,
        hint1: 'You can use array `.filter()` followed by `.map()`, or use a single `for...of` loop.',
        hint2: 'To square a number, multiply it by itself: `num * num` or `num ** 2`.',
        solution: `function getPositiveSquares(numbers) {\n  return numbers.filter(n => n > 0).map(n => n * n);\n}`,
        explanation:
          'Chaining declarative higher-order functions like `filter` and `map` produces clean, concise, and highly readable transformations without manual indexing.',
      };
    }

    return {
      title: 'Sum of Even Numbers in a Range',
      topic: 'Loops & Modulo Operator',
      difficulty: 'Beginner',
      problemStatement:
        'Write a function that calculates the sum of all even numbers between 1 and `n` inclusive.',
      starterCode: `// Calculate sum of all even numbers from 1 to n\nfunction sumEven(n) {\n  let total = 0;\n  // TODO: Implement loop\n  return total;\n}`,
      expectedOutput: `30 (for n = 10)`,
      hint1: 'Use the modulo operator `% 2 === 0` to test if a number is even.',
      hint2: 'Iterate from 2 up to `n` in steps of 2, or iterate 1 to `n` and check evenness.',
      solution: `function sumEven(n) {\n  let total = 0;\n  for (let i = 2; i <= n; i += 2) {\n    total += i;\n  }\n  return total;\n}`,
      explanation:
        'Iterating with a step of 2 reduces the total number of loop iterations by half compared to checking every single number with a conditional.',
    };
  }

  public static formatChallengeMarkdown(challenge: PracticeChallenge): string {
    return `# 🎯 Hands-On Practice Challenge: ${challenge.title}

- **Topic:** ${challenge.topic}
- **Difficulty:** ${challenge.difficulty}

## 📝 Problem Statement
${challenge.problemStatement}

## 💻 Starter Code
\`\`\`
${challenge.starterCode}
\`\`\`

## 🔍 Expected Output
\`\`\`
${challenge.expectedOutput}
\`\`\`

---
### 💡 Available Hints (Ask anytime)
- **Hint 1:** *Available on request*
- **Hint 2:** *Available on request*

*Try solving it in the editor! When you're ready, submit your code or ask for a hint.*`;
  }
}
