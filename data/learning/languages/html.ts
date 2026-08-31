import { LanguageLearningContent } from '../types';

export const htmlContent: LanguageLearningContent = {
  id: 'html',
  name: 'HTML5',
  icon: '🌐',
  color: 'text-orange-500',
  tagline: 'The foundational markup language of the World Wide Web, defining semantic structure and content for browser clients.',
  extensions: ['.html', '.htm'],
  difficulty: 'Beginner',
  paradigms: ['Declarative', 'Markup', 'Semantic Structure'],
  creator: 'Tim Berners-Lee',
  releaseYear: '1993',
  currentPurpose: 'Web document structure, accessibility (ARIA), SEO meta markup, browser canvas / media embedding.',
  typingSystem: 'None (Document Object Model hierarchy of Element Nodes and Attributes)',
  executionModel: 'Parsed into the DOM (Document Object Model) tree by the browser layout engine (Blink, WebKit, Gecko)',
  typicalEnvironments: ['All Web Browsers', 'WebView in Mobile Apps', 'Email Clients (HTML email templates)', 'Static Site Generators'],
  devPulseSupport: {
    level: 'Lexical & Structural',
    capabilities: [
      'Tag hierarchy & semantic element nesting verification',
      'Accessibility (a11y) & missing alt attribute detection',
      'Unclosed tag & deprecated element diagnostics',
      'SEO meta tag completeness evaluation',
    ],
  },
  whyLearn: {
    importance: 'HTML is the ubiquitous skeleton of every website and web application in existence.',
    commonDomains: ['Web Development', 'Email Design', 'Accessible User Interfaces', 'SEO Optimization'],
    strengths: [
      'Universally supported across 100% of web devices and browsers',
      'Semantic tags improve search engine indexing (SEO) and screen reader accessibility',
      'Simple, intuitive tag-based markup model',
    ],
    weaknesses: [
      'Not a programming language; has no logic, computation, or loops on its own',
      'Email HTML rendering remains notoriously fragmented across clients (e.g. Outlook)',
    ],
    careerRelevance: 'Mandatory prerequisite for all frontend developers, full-stack engineers, and web designers.',
    typicalProjects: ['Semantic Web Applications', 'Accessible Forms', 'SEO Optimized Landing Pages', 'Media Players'],
    whenToChoose: ['When structuring content for web browsers or web views'],
    whenToAvoid: ['When writing backend computational business logic (HTML is markup only)'],
  },
  coreConcepts: [
    { title: 'The Document Object Model (DOM)', summary: 'The browser parses HTML tags into a tree of live JavaScript-accessible DOM nodes.', relevance: 'The core interface between HTML and JavaScript.' },
    { title: 'Semantic HTML5 Elements', summary: 'Using tags like <article>, <nav>, <main>, <header>, <section> instead of generic <div> tags.', relevance: 'Enables screen readers and search engines to understand page architecture.' },
    { title: 'Accessibility & ARIA', summary: 'Accessible Rich Internet Applications attributes for assistive technologies.', relevance: 'Legal requirement and ethical best practice for web applications.' },
  ],
  syntaxFundamentals: [
    {
      title: 'Semantic Document Skeleton',
      concept: 'Modern HTML5 page structure',
      explanation: 'Use semantic landmarks and meta viewport tags for responsive layout.',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevPulse Health Dashboard</title>
</head>
<body>
  <header>
    <h1>DevPulse Code Intelligence</h1>
  </header>
  <main>
    <section aria-labelledby="metrics-heading">
      <h2 id="metrics-heading">System Metrics</h2>
      <p>Health Score: <strong>98%</strong></p>
    </section>
  </main>
</body>
</html>`,
      output: `(Rendered Semantic Web Page)`,
      importantNote: 'Always declare <!DOCTYPE html> and <meta name="viewport">.',
    },
  ],
  dataTypes: {
    summary: 'HTML defines elements, text nodes, comment nodes, and attributes.',
    typingNotes: 'Attributes accept strings, booleans (e.g. disabled), or enumerated tokens.',
    typesList: [
      { type: 'Block Elements', description: 'Take full width (<main>, <article>, <div>, <p>)', example: '<main>Content</main>', category: 'Special' },
      { type: 'Inline Elements', description: 'Flow with text (<span>, <a>, <strong>, <code>)', example: '<code>const x = 1</code>', category: 'Special' },
      { type: 'Void Elements', description: 'Self-closing tags without content (<img />, <input />, <meta />)', example: '<img src="logo.png" alt="DevPulse">', category: 'Special' },
    ],
  },
  controlFlow: [],
  functions: [],
  oop: { isSupported: false, paradigmNotes: 'HTML is a declarative markup language.', concepts: [] },
  errorHandling: [
    {
      type: 'Browser Error Tolerance',
      description: 'Browsers do not throw errors on invalid HTML; they attempt to repair broken tag structures automatically.',
      mechanism: 'Always validate with W3C validator to avoid unexpected DOM tree mutations.',
      code: `<!-- Unclosed tags will be auto-closed by browser parsing engine -->\n<p>Broken tag without closing`,
      debuggingTip: 'Inspect the live Elements panel in Chrome DevTools to see how the browser fixed broken tags.',
    },
  ],
  modulesAndPackages: {
    title: 'HTML Imports & Web Components',
    importSyntax: '<script type="module" src="main.js"></script> / <link rel="stylesheet" href="style.css">',
    exportSyntax: 'Custom Elements (customElements.define("pulse-card", PulseCard))',
    packageManager: 'npm (for bundlers like Vite)',
    packageManagerCommand: 'npm create vite@latest',
    standardModules: ['Web Components', 'Shadow DOM', 'HTML Templates (<template>)'],
    description: 'Modern HTML leverages ES Modules scripts and Web Components.',
  },
  memoryAndExecution: {
    model: 'Browser DOM Tree and Render Tree stored in browser process memory.',
    allocation: 'Managed by browser layout engine (Blink/WebKit).',
    garbageCollection: 'Garbage collected when DOM nodes are detached and unreferenced by JS.',
    keyDetails: ['Deep DOM trees (> 32 levels or > 1,500 nodes) degrade browser rendering performance.'],
  },
  concurrency: {
    model: 'Single-threaded UI rendering coordinated with JavaScript event loop and Web Workers.',
    keyPrimitives: ['<script defer>', '<script async>', '<script type="module">'],
    description: 'Use defer or type="module" on scripts so they do not block HTML parsing.',
    code: `<script type="module" src="/src/main.tsx"></script>`,
  },
  toolsAndEcosystem: [
    {
      category: 'Validators & Accessibility Tools',
      tools: [
        { name: 'Lighthouse', description: 'Automated auditing tool for performance, accessibility, SEO.', type: 'Linter/Formatter' },
        { name: 'axe-core', description: 'Accessibility testing engine for websites.', type: 'Testing' },
      ],
    },
  ],
  useCases: [
    { title: 'Web Applications', description: 'Semantic structure for single page apps and static websites.', popularity: 'Very High', examples: ['All web applications'] },
  ],
  bestPractices: [
    {
      title: 'Always Include Meaningful alt Attributes on Images',
      category: 'Security',
      recommendation: 'Ensures screen readers can describe images to visually impaired users and improves SEO.',
      goodCode: `<img src="chart.png" alt="Cyclomatic complexity distribution chart">`,
      badCode: `<img src="chart.png">`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Using Clickable <div> Elements Instead of <button>',
      whyItMatters: '<div> elements lack keyboard accessibility (Tab, Enter, Space) and screen reader roles.',
      badSnippet: `<div onclick="submitForm()">Submit</div>`,
      betterApproach: 'Use native <button type="button"> elements.',
      fixedSnippet: `<button type="button" onclick="submitForm()">Submit</button>`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'Cross-Site Scripting (XSS) via Unsanitized Injection',
      riskLevel: 'Critical',
      description: 'Injecting raw user-submitted text directly into HTML without HTML-escaping characters (<, >, &, ", \').',
      vulnerableCode: `<div>Hello \${user_input}</div>`,
      remediation: 'Encode HTML entities or use modern frameworks that auto-escape.',
      secureCode: `<div>Hello {user_input}</div>`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Add loading="lazy" to Below-the-Fold Images',
      impact: 'High',
      description: 'Defers offscreen image network requests until the user scrolls near them.',
      recommendation: 'Use <img loading="lazy" ...> for all non-hero images.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'HTML Basics', description: 'Tags, attributes, headings, paragraphs, lists, links, images.', topics: ['Tags', 'Attributes', 'Document Structure'], estimatedTime: '3-5 days' },
    { stepNumber: 2, title: 'Semantic Elements', description: 'header, nav, main, article, section, footer, aside, figure.', topics: ['Semantic HTML', 'SEO Basics'], estimatedTime: '1 week' },
    { stepNumber: 3, title: 'Forms & Validation', description: 'Inputs, select, textarea, form validation attributes (required, pattern).', topics: ['Forms', 'Validation', 'Input Types'], estimatedTime: '1 week' },
    { stepNumber: 4, title: 'Accessibility (a11y) & ARIA', description: 'ARIA roles, tabindex, screen reader optimization, WCAG compliance.', topics: ['WCAG AA', 'ARIA Roles', 'Keyboard Nav'], estimatedTime: '1-2 weeks' },
  ],
  practiceExercises: [
    {
      id: 'html-ex-1',
      title: 'Accessible Button & Landmark',
      difficulty: 'Beginner',
      objective: 'Write an accessible <main> section containing a heading and a <button> with type="button".',
      starterCode: `<!-- TODO: Write semantic markup -->`,
      solutionCode: `<main>
  <h1>DevPulse Dashboard</h1>
  <button type="button">Run Analysis</button>
</main>`,
      hints: ['Use <main>, <h1>, and <button type="button">'],
      sampleOutput: 'Rendered accessible main element',
    },
  ],
};
