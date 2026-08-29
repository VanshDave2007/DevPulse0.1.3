import { LanguageLearningContent } from '../types';

export const cssContent: LanguageLearningContent = {
  id: 'css',
  name: 'CSS3',
  icon: '🎨',
  color: 'text-sky-400',
  tagline: 'Style sheet language describing the presentation, visual aesthetics, responsive layout, and animations of web documents.',
  extensions: ['.css', '.scss', '.sass', '.less'],
  difficulty: 'Beginner',
  paradigms: ['Declarative', 'Cascading Rules', 'Rule-Based Styling'],
  creator: 'Håkon Wium Lie',
  releaseYear: '1996',
  currentPurpose: 'Web styling, responsive design (Flexbox/Grid), Tailwind utility classes, CSS custom properties (variables), transitions and animations.',
  typingSystem: 'Property-Value Declarations with dimensional units (px, rem, %, vh, fr)',
  executionModel: 'Parsed into CSSOM (CSS Object Model) and combined with DOM to compute styles during browser layout/paint',
  typicalEnvironments: ['All Web Browsers', 'CSS-in-JS (Tailwind CSS, styled-components)', 'PostCSS / SASS / Less bundlers'],
  devPulseSupport: {
    level: 'Lexical & Structural',
    capabilities: [
      'Selector specificity & cascade rule evaluation',
      'Unused CSS rule & dead selector diagnostics',
      'Modern CSS Grid & Flexbox layout analysis',
      'Color contrast & visual accessibility verification',
    ],
  },
  whyLearn: {
    importance: 'CSS transforms raw HTML into modern, responsive, and delightful user interfaces.',
    commonDomains: ['Frontend User Interfaces', 'Responsive Web Design', 'Design Systems (Tailwind / Shadcn)', 'Micro-Animations'],
    strengths: [
      'Declarative and hardware-accelerated animations using GPU compositing',
      'Modern layout engines (Flexbox and CSS Grid) make complex 2D layouts trivial',
      'CSS Custom Properties (--variables) enable dynamic instant dark/light theming',
    ],
    weaknesses: [
      'The Cascade and selector specificity can cause unintended overrides in large unorganized stylesheets',
      'Cross-browser quirks for cutting-edge experimental properties',
    ],
    careerRelevance: 'Essential skill for all UI/UX Engineers, Frontend Developers, and Design Technologists.',
    typicalProjects: ['Design Systems', 'Responsive Dashboard Layouts', 'Dark/Light Theme Engines', 'Interactive Hover Animations'],
    whenToChoose: ['When styling and laying out web applications and documents'],
    whenToAvoid: ['When writing backend computational data processing logic'],
  },
  coreConcepts: [
    { title: 'The Box Model', summary: 'Every element consists of Content, Padding, Border, and Margin. Always set `box-sizing: border-box;`.', relevance: 'The mathematical foundation of all element sizing.' },
    { title: 'Flexbox vs CSS Grid', summary: 'Flexbox for 1D component rows/columns; CSS Grid for 2D macro layouts and bento grids.', relevance: 'Modern responsive alignment without floats or tables.' },
    { title: 'The Cascade & Specificity', summary: 'Rules are resolved by Origin, Specificity (ID > Class > Tag), and Source Order.', relevance: 'Understanding specificity prevents aggressive !important overrides.' },
  ],
  syntaxFundamentals: [
    {
      title: 'Modern CSS Variables & Grid',
      concept: 'Theming and 2D grid layouts',
      explanation: 'Use custom properties for design tokens and auto-fit grids for responsive layouts without media queries.',
      code: `:root {
  --pulse-cyan: #06b6d4;
  --pulse-dark: #0f172a;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.pulse-card {
  background: var(--pulse-dark);
  border: 1px solid var(--pulse-cyan);
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pulse-card:hover {
  transform: translateY(-2px);
}`,
      output: `(Responsive CSS Grid Layout with Theme Tokens)`,
      importantNote: 'Always use repeat(auto-fit, minmax(...)) for instant responsive grids without manual breakpoints.',
    },
  ],
  dataTypes: {
    summary: 'CSS values include Lengths (px, rem), Angles (deg), Colors (hex, rgb, hsl, oklch), and Identifiers.',
    typingNotes: 'rem units scale relative to the root font size, ensuring user accessibility preferences are respected.',
    typesList: [
      { type: 'Relative Units (rem, em, %, vh, vw)', description: 'Scalable units responding to user root font size or viewport', example: 'padding: 1.5rem;', category: 'Primitive' },
      { type: 'Color (hex, rgb, hsl, oklch)', description: 'Modern color spaces with wide gamut support', example: 'color: oklch(0.7 0.2 150);', category: 'Primitive' },
    ],
  },
  controlFlow: [
    {
      name: '@media and @container Queries',
      description: 'Adapt layouts based on viewport width or parent container dimensions.',
      code: `@container (min-width: 400px) {
  .pulse-card { display: flex; }
}`,
    },
  ],
  functions: [
    {
      title: 'Math & Color Functions (calc, min, max, clamp)',
      description: 'Compute values dynamically in CSS without JavaScript.',
      code: `font-size: clamp(1rem, 2.5vw, 2rem); /* Fluid responsive typography */`,
    },
  ],
  oop: { isSupported: false, paradigmNotes: 'Rule-based declarative stylesheet language.', concepts: [] },
  errorHandling: [
    {
      type: 'Silent Property Fallback',
      description: 'Browsers ignore unrecognized CSS properties and continue parsing.',
      mechanism: 'Provide fallback properties before modern experimental ones.',
      code: `background: #06b6d4; /* Fallback for older browsers */\nbackground: color(display-p3 0 0.8 0.9);`,
      debuggingTip: 'Use Chrome DevTools Styles pane to inspect strikethrough invalid rules.',
    },
  ],
  modulesAndPackages: {
    title: 'PostCSS, Tailwind CSS & CSS Modules',
    importSyntax: '@import "tailwindcss"; / @import "./theme.css";',
    exportSyntax: ':export { ... } in CSS Modules',
    packageManager: 'npm / pnpm / yarn',
    packageManagerCommand: 'npm i tailwindcss @tailwindcss/vite',
    standardModules: ['CSS Grid', 'CSS Flexbox', 'CSS Transitions', 'CSS Custom Properties'],
    description: 'Modern projects use Tailwind CSS v4 or CSS Modules for scoped, performant styling.',
  },
  memoryAndExecution: {
    model: 'CSSOM tree computed and matched with DOM nodes during Layout (Reflow) and Paint (Repaint) phases.',
    allocation: 'Managed in browser GPU compositor and layout memory.',
    garbageCollection: 'None (freed with page lifecycle).',
    keyDetails: ['Animate transform and opacity for 60fps/120fps hardware-accelerated animations.'],
  },
  concurrency: {
    model: 'Asynchronous stylesheet downloading with render-blocking CSSOM building.',
    keyPrimitives: ['<link rel="preload">', '<link rel="stylesheet">'],
    description: 'Keep critical CSS small to optimize First Contentful Paint (FCP).',
    code: `<link rel="stylesheet" href="/src/index.css">`,
  },
  toolsAndEcosystem: [
    {
      category: 'Frameworks & Preprocessors',
      tools: [
        { name: 'Tailwind CSS', description: 'Utility-first CSS framework for rapid UI development.', type: 'Framework' },
        { name: 'PostCSS', description: 'Tool for transforming CSS with JavaScript plugins.', type: 'Runtime/Build' },
        { name: 'Sass / SCSS', description: 'CSS extension language with nesting and mixins.', type: 'Framework' },
      ],
    },
  ],
  useCases: [
    { title: 'Responsive Design & Dashboards', description: 'Layouts that scale seamlessly across mobile, tablet, and ultra-wide screens.', popularity: 'Very High', examples: ['DevPulse Analytics UI', 'Tailwind Dashboards'] },
  ],
  bestPractices: [
    {
      title: 'Always Set box-sizing: border-box',
      category: 'Maintainability',
      recommendation: 'Ensures padding and borders are included in total width calculations.',
      goodCode: `*, *::before, *::after { box-sizing: border-box; }`,
    },
  ],
  commonMistakes: [
    {
      mistake: 'Overusing !important to Fix Specificity Issues',
      whyItMatters: '!important breaks the natural cascade and makes future stylesheet maintenance a nightmare.',
      badSnippet: `.card { color: red !important; }`,
      betterApproach: 'Refactor selector hierarchy or use CSS Cascade Layers (@layer).',
      fixedSnippet: `@layer components { .card { color: red; } }`,
    },
  ],
  securityConsiderations: [
    {
      vulnerability: 'CSS Injection via Untrusted User-Supplied Styles',
      riskLevel: 'Medium',
      description: 'Injecting raw user CSS can exfiltrate sensitive data via background-image url() attributes.',
      vulnerableCode: `<style>{user_supplied_css}</style>`,
      remediation: 'Sanitize user CSS and disallow url() or external font loads.',
      secureCode: `/* Strip url() references from user CSS */`,
    },
  ],
  performanceConsiderations: [
    {
      topic: 'Animate Only transform and opacity',
      impact: 'High',
      description: 'Animating top, left, width, or height triggers full Layout Reflow and Paint on the main thread.',
      recommendation: 'Use transform: translate3d() to leverage the GPU compositor thread.',
    },
  ],
  roadmap: [
    { stepNumber: 1, title: 'CSS Fundamentals', description: 'Selectors, Box Model, Margin/Padding, Typography, Colors.', topics: ['Box Model', 'Specificity', 'Units (rem, px)'], estimatedTime: '1 week' },
    { stepNumber: 2, title: 'Flexbox & CSS Grid', description: 'Flex container/items, justify/align, grid-template, auto-fit, minmax.', topics: ['Flexbox', 'CSS Grid', 'Gap'], estimatedTime: '2 weeks' },
    { stepNumber: 3, title: 'Responsive Design & Variables', description: 'Media queries, container queries, CSS custom properties, fluid clamp().', topics: ['Media Queries', 'CSS Variables', 'Fluid Sizing'], estimatedTime: '1-2 weeks' },
    { stepNumber: 4, title: 'Tailwind CSS & Design Systems', description: 'Utility classes, theme tokens, animations, responsive prefixes.', topics: ['Tailwind CSS', 'Transitions', 'Design Tokens'], estimatedTime: '2 weeks' },
  ],
  practiceExercises: [
    {
      id: 'css-ex-1',
      title: 'Responsive Flexbox Center',
      difficulty: 'Beginner',
      objective: 'Write CSS rules to center content both horizontally and vertically inside a full-height container.',
      starterCode: `.center-container {
  /* TODO */
}`,
      solutionCode: `.center-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}`,
      hints: ['Use display: flex;', 'justify-content: center;', 'align-items: center;'],
      sampleOutput: 'Centered layout',
    },
  ],
};
