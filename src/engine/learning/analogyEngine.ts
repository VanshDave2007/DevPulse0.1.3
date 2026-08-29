export interface AnalogyDefinition {
  concept: string;
  category: 'fundamental' | 'control_flow' | 'data_structures' | 'architecture' | 'debugging' | 'performance';
  analogyTitle: string;
  everydayAnalogy: string;
  connectionToCode: string;
  technicalDefinition: string;
  codeExample: string;
  commonMistake: string;
  outputDescription: string;
  tryItYourselfPrompt: string;
}

export const STANDARD_ANALOGIES: Record<string, AnalogyDefinition> = {
  function: {
    concept: 'Function / Method',
    category: 'fundamental',
    analogyTitle: 'A Recipe with Ingredients and Output',
    everydayAnalogy:
      'Think of a function like a kitchen recipe or a smoothie blender. You provide ingredients (inputs/parameters), the blender follows precise steps (the function body), and it serves a smoothie (the return value).',
    connectionToCode:
      'In code, you define the recipe once with `def`, `function`, or `fn`, specify parameter names (the ingredient slots), execute the steps, and `return` the resulting value so other parts of your program can use it.',
    technicalDefinition:
      'A self-contained block of statements designed to perform a specific task, take zero or more parameters, manage its own local scope, and optionally return a value.',
    codeExample: `// Recipe: Add two numbers and return the total\nfunction add(ingredientA, ingredientB) {\n  const sum = ingredientA + ingredientB;\n  return sum;\n}\n\nconst result = add(5, 3); // result is 8`,
    commonMistake:
      'Forgetting to `return` a value (causing the function to yield `undefined`/`None`), or confusing function *definition* with function *execution*.',
    outputDescription: 'Returns the computed result to the caller.',
    tryItYourselfPrompt: 'Create a function `multiply(a, b)` that takes two numbers and returns their product.',
  },
  loop: {
    concept: 'Loop (For / While)',
    category: 'control_flow',
    analogyTitle: 'A Chef Preparing 10 Identical Dishes',
    everydayAnalogy:
      'Think of a loop like a chef plating 10 identical appetizers or an automated stamp machine. Instead of typing the same step 10 separate times, you tell the program: "repeat these exact steps until all items are processed or a condition changes".',
    connectionToCode:
      'A `for` loop iterates across a known sequence of items (like a list of tickets), while a `while` loop keeps running as long as its condition remains `true` (like working until the kitchen bell rings).',
    technicalDefinition:
      'A control structure that executes a block of instructions repeatedly until a specified terminating condition is met.',
    codeExample: `// Repeating the plating process for 5 dishes\nfor (let dishNumber = 1; dishNumber <= 5; dishNumber++) {\n  console.log(\`Prepared dish #\${dishNumber}\`);\n}`,
    commonMistake:
      'Creating an infinite loop by forgetting to update the loop condition variable inside a `while` loop, or off-by-one errors with array bounds.',
    outputDescription: 'Executes the loop body repeatedly for each iteration.',
    tryItYourselfPrompt: 'Write a loop that prints only even numbers from 2 to 20.',
  },
  conditional: {
    concept: 'Conditional (If / Else)',
    category: 'control_flow',
    analogyTitle: 'A Traffic Light Decision',
    everydayAnalogy:
      'Think of a conditional like a traffic light or a fork in the road. When approaching an intersection: IF the light is green, drive forward; ELSE IF the light is yellow, slow down; ELSE, stop completely.',
    connectionToCode:
      'A conditional evaluates a boolean expression (which evaluates strictly to `true` or `false`) and only executes the corresponding block of code if the test passes.',
    technicalDefinition:
      'A branch instruction that performs different computations or actions depending on whether a programmer-specified boolean condition evaluates to true or false.',
    codeExample: `const light = 'green';\nif (light === 'green') {\n  console.log('Go!');\n} else if (light === 'yellow') {\n  console.log('Caution');\n} else {\n  console.log('Stop');\n}`,
    commonMistake:
      'Using the assignment operator `=` instead of the equality comparison operator `===` or `==` inside the condition check.',
    outputDescription: 'Runs only the matching branch and skips the rest.',
    tryItYourselfPrompt: 'Write a conditional that checks if a user is 18 or older and prints "Adult" or "Minor".',
  },
  variable: {
    concept: 'Variable & Constants',
    category: 'fundamental',
    analogyTitle: 'A Labeled Box Holding a Value',
    everydayAnalogy:
      'Think of a variable like a storage box with a name tag stuck on the outside. You write "score" on the label, put the number 42 inside, and anytime you need that score later, you open the box labeled "score".',
    connectionToCode:
      'Variables allocate space in computer memory to store data, binding a human-readable identifier name to that memory location so you can read, update, or pass the value around.',
    technicalDefinition:
      'A named storage location in memory capable of holding a value that may be modified during program execution, with a defined data type and scope.',
    codeExample: `let score = 42; // Put 42 in the box\nscore = score + 10; // Update box to 52\nconsole.log(score); // Reads 52`,
    commonMistake:
      'Using a variable before declaring or initializing it, or attempting to reassign a `const` (constant) variable.',
    outputDescription: 'Retains and yields the stored value.',
    tryItYourselfPrompt: 'Declare a variable `userName` with your name and print a greeting using it.',
  },
  data_type: {
    concept: 'Data Types',
    category: 'fundamental',
    analogyTitle: 'Different Kinds of Containers',
    everydayAnalogy:
      'Think of data types like specialized containers: a water bottle is built for liquids (numbers for math), an envelope is built for paper letters (strings for text), and an on/off light switch is built for binary states (booleans for true/false). You cannot mail a smoothie in an envelope!',
    connectionToCode:
      'Data types tell the computer how much memory to allocate and what mathematical or textual operations are valid on that value (e.g., adding numbers vs concatenating text).',
    technicalDefinition:
      'An attribute of data that specifies the compiler or interpreter how the programmer intends to use the data and what operations can be performed on it.',
    codeExample: `const age = 25; // Number (can do math)\nconst name = "Alex"; // String (text)\nconst isStudent = true; // Boolean (true/false)\nconst skills = ["Python", "JS"]; // Array / List\nconst profile = { age, name }; // Object / Map`,
    commonMistake:
      'Treating strings like numbers (e.g. `"5" + "5"` resulting in `"55"` instead of `10`).',
    outputDescription: 'Determines the valid operations and memory layout of the value.',
    tryItYourselfPrompt: 'Create a variable holding your favorite number and verify its type using `typeof`.',
  },
  recursion: {
    concept: 'Recursion',
    category: 'fundamental',
    analogyTitle: 'Two Mirrors Reflecting Each Other',
    everydayAnalogy:
      'Think of recursion like standing between two parallel mirrors, or opening Russian Nesting Dolls (Matryoshka). Each doll contains a smaller doll inside itself, until you finally reach the tiniest solid doll (the "base case"), which stops you from opening any more.',
    connectionToCode:
      'A recursive function calls itself with a smaller input on each step. It MUST have a base case (an exit condition) to prevent it from calling itself infinitely until the call stack runs out of memory.',
    technicalDefinition:
      'A method where the solution to a problem depends on solutions to smaller instances of the same problem, achieved by a function calling itself directly or indirectly.',
    codeExample: `function countdown(n) {\n  // 1. Base Case (Stop Condition)\n  if (n <= 0) {\n    console.log("Blast off!");\n    return;\n  }\n  // 2. Recursive step with smaller input\n  console.log(n);\n  countdown(n - 1);\n}\ncountdown(3); // Prints 3, 2, 1, Blast off!`,
    commonMistake:
      'Missing or incorrect base case, resulting in a `RangeError: Maximum call stack size exceeded` (Stack Overflow).',
    outputDescription: 'Executes until base case is reached, unwinding results.',
    tryItYourselfPrompt: 'Write a recursive function to compute the factorial of a number `n!`.',
  },
  complexity: {
    concept: 'Cyclomatic & Cognitive Complexity',
    category: 'architecture',
    analogyTitle: 'A Road with Many Maze-Like Intersections',
    everydayAnalogy:
      'Think of complexity like a highway vs a chaotic maze. A simple highway goes straight from point A to point B. But if every mile has 4 roundabouts, 6 detours, and hidden tolls, a driver is much more likely to make a wrong turn or get lost.',
    connectionToCode:
      'Every `if`, `else`, `for`, `while`, `switch`, and `catch` in your code creates an alternate road (decision branch). More branches mean more tests needed to cover every possible journey.',
    technicalDefinition:
      'A quantitative measure of the number of linearly independent paths through a program source code, indicating how difficult the code is to test, understand, and maintain.',
    codeExample: `// Low Complexity (Linear highway)\nfunction getDiscount(isMember) {\n  return isMember ? 0.2 : 0.0;\n}\n\n// High Complexity (Maze with 4 branches)\nfunction complexLogic(a, b, c) {\n  if (a) { if (b) { return 1; } else if (c) { return 2; } }\n  return 3;\n}`,
    commonMistake:
      'Deeply nesting 4 or 5 levels of `if` statements instead of using early return guard clauses.',
    outputDescription: 'Lower complexity = cleaner, more reliable, and easily testable code.',
    tryItYourselfPrompt: 'Refactor a nested `if/else` block using early `return` guard clauses.',
  },
  coupling: {
    concept: 'Coupling & Architecture',
    category: 'architecture',
    analogyTitle: 'Rooms Connected by Too Many Open Doors',
    everydayAnalogy:
      'Think of tightly coupled code like two rooms where all furniture is glued together with cables. If you want to move the couch in Room A, you accidentally pull the refrigerator in Room B through the wall! Good modular code is like standardized LEGO bricks that snap together cleanly through defined plugs.',
    connectionToCode:
      'High coupling occurs when module A directly accesses internal variables of module B instead of interacting via a clean public interface or parameters.',
    technicalDefinition:
      'The degree of direct interdependence between software modules. Loose coupling ensures components can be modified, tested, and reused independently.',
    codeExample: `// Tightly coupled (hard to test or change)\nclass Order {\n  pay() { globalDatabase.savePayment(this.total); }\n}\n\n// Loosely coupled (injects payment service)\nclass Order {\n  constructor(paymentService) { this.paymentService = paymentService; }\n  pay() { this.paymentService.process(this.total); }\n}`,
    commonMistake:
      'Relying on mutable global variables or circular imports where module A imports B and B imports A.',
    outputDescription: 'Loose coupling makes systems easy to refactor without breaking unrelated modules.',
    tryItYourselfPrompt: 'Identify a global variable in your code and pass it as a function argument instead.',
  },
  vulnerability: {
    concept: 'Security Vulnerabilities',
    category: 'debugging',
    analogyTitle: 'An Unlocked Ground-Floor Window',
    everydayAnalogy:
      'Think of a security vulnerability like leaving a basement window unlocked with the latch open. Even if your heavy front door has three deadbolts, an intruder simply looks around until they spot the open window and climbs straight into your house.',
    connectionToCode:
      'In software, vulnerabilities happen when user-controlled inputs are passed directly to database queries (SQL Injection) or code evaluators (`eval`), without sanitization or boundary validation.',
    technicalDefinition:
      'A weakness or flaw in code, system design, or dependencies that can be exploited by an unauthorized entity to gain access, execute arbitrary code, or compromise data integrity.',
    codeExample: `// Insecure (Vulnerable to SQL Injection)\nconst query = "SELECT * FROM users WHERE id = " + userInput;\n\n// Secure (Parameterized Query)\nconst query = "SELECT * FROM users WHERE id = ?";\ndb.query(query, [userInput]);`,
    commonMistake:
      'Trusting raw client or user input without validation or using dangerous functions like `eval()` or unparameterized queries.',
    outputDescription: 'Securing inputs protects user data and system integrity.',
    tryItYourselfPrompt: 'Review your code for any direct string concatenation in database or command calls.',
  },
  dead_code: {
    concept: 'Dead Code / Unused Variables',
    category: 'architecture',
    analogyTitle: 'Old Unworn Clothes Cluttering the Closet',
    everydayAnalogy:
      'Think of dead code like keeping boxes of broken appliances or 15-year-old clothes in your bedroom closet. They do not do anything useful, but every time you look for your shoes, you have to dig through piles of junk to find what you actually need.',
    connectionToCode:
      'Dead code includes unused variables, unreachable lines after a `return` statement, or uncalled functions. It increases cognitive burden and confuses future developers.',
    technicalDefinition:
      'Source code that is executed but its result is never used, or code that can never be executed at runtime under any condition (unreachable code).',
    codeExample: `function calculateTotal(price) {\n  const discount = 0.1; // Unused variable\n  return price * 1.05;\n  console.log("Finished"); // Unreachable dead code\n}`,
    commonMistake:
      'Leaving temporary debugging variables or abandoned experiments inside production code.',
    outputDescription: 'Removing dead code clarifies logic and reduces maintenance overhead.',
    tryItYourselfPrompt: 'Run DevPulse analyzer and remove any variables flagged with "unused" warnings.',
  },
};

export class AnalogyEngine {
  public static getAnalogy(concept: string): AnalogyDefinition {
    const normalized = concept.toLowerCase().trim();

    if (normalized.includes('func') || normalized.includes('method') || normalized.includes('def')) {
      return STANDARD_ANALOGIES.function;
    }
    if (normalized.includes('loop') || normalized.includes('for') || normalized.includes('while') || normalized.includes('iterat')) {
      return STANDARD_ANALOGIES.loop;
    }
    if (normalized.includes('if') || normalized.includes('cond') || normalized.includes('switch') || normalized.includes('branch')) {
      return STANDARD_ANALOGIES.conditional;
    }
    if (normalized.includes('var') || normalized.includes('const') || normalized.includes('let') || normalized.includes('state')) {
      return STANDARD_ANALOGIES.variable;
    }
    if (normalized.includes('type') || normalized.includes('int') || normalized.includes('str') || normalized.includes('bool') || normalized.includes('array')) {
      return STANDARD_ANALOGIES.data_type;
    }
    if (normalized.includes('recur') || normalized.includes('base case')) {
      return STANDARD_ANALOGIES.recursion;
    }
    if (normalized.includes('complex') || normalized.includes('cyclomatic') || normalized.includes('nest')) {
      return STANDARD_ANALOGIES.complexity;
    }
    if (normalized.includes('coupl') || normalized.includes('import') || normalized.includes('depend') || normalized.includes('modular')) {
      return STANDARD_ANALOGIES.coupling;
    }
    if (normalized.includes('vuln') || normalized.includes('secur') || normalized.includes('inject') || normalized.includes('cve')) {
      return STANDARD_ANALOGIES.vulnerability;
    }
    if (normalized.includes('dead') || normalized.includes('unused') || normalized.includes('unreach')) {
      return STANDARD_ANALOGIES.dead_code;
    }

    return STANDARD_ANALOGIES.function;
  }

  public static formatAnalogyExplanation(concept: string): string {
    const item = this.getAnalogy(concept);
    return `# ${item.concept}
## Simple Definition
${item.technicalDefinition}

## Think of it like...
${item.everydayAnalogy}

## Connecting Analogy to Code
${item.connectionToCode}

## Code Example
\`\`\`javascript
${item.codeExample}
\`\`\`

## Common Mistake to Avoid
${item.commonMistake}

## Remember
${item.outputDescription}

## Try It Yourself
${item.tryItYourselfPrompt}`;
  }
}
