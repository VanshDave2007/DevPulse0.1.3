import { SupportedLanguage } from '../types';

export interface DetectionResult {
  language: SupportedLanguage;
  confidence: 'high' | 'medium' | 'low';
  name: string;
}

const LANGUAGE_PATTERNS: Array<{
  lang: SupportedLanguage;
  name: string;
  patterns: RegExp[];
  keywords: string[];
}> = [
  {
    lang: 'python',
    name: 'Python',
    patterns: [
      /^#!\/usr\/bin\/(?:env )?python/m,
      /\bdef\s+[a-zA-Z_]\w*\s*\(/,
      /\bclass\s+[a-zA-Z_]\w*\s*(?:\([^)]*\))?:/,
      /\bimport\s+[\w.]+|\bfrom\s+[\w.]+\s+import/,
      /\bif\s+__name__\s*==\s*['"]__main__['"]:/,
      /\belif\s+/,
      /:\s*$\n\s+(?:print|return|pass|yield|raise|def|class|if|for|while)/m,
    ],
    keywords: ['def', 'elif', 'lambda', 'yield', 'None', 'True', 'False', 'pass', 'raise', 'except', 'finally', 'with', 'async def'],
  },
  {
    lang: 'typescript',
    name: 'TypeScript',
    patterns: [
      /\binterface\s+[A-Z]\w*/,
      /\btype\s+[A-Z]\w*\s*=/,
      /:\s*(?:string|number|boolean|any|void|Promise<[^>]+>|Array<[^>]+>)\b/,
      /\bas\s+(?:string|number|boolean|const)\b/,
      /\bexport\s+(?:interface|type|enum)\b/,
    ],
    keywords: ['interface', 'type', 'readonly', 'implements', 'enum', 'namespace', 'as const'],
  },
  {
    lang: 'javascript',
    name: 'JavaScript',
    patterns: [
      /\bconsole\.(?:log|error|warn|info)\s*\(/,
      /\bconst\s+[a-zA-Z_]\w*\s*=|\blet\s+[a-zA-Z_]\w*\s*=|\bvar\s+[a-zA-Z_]\w*\s*=/,
      /\bfunction\s+[a-zA-Z_]\w*\s*\(/,
      /\b(?:import|export)\s+(?:\{|\*|default)/,
      /=>\s*\{|\(\s*\)\s*=>/,
      /\brequire\s*\(['"][^'"]+['"]\)/,
    ],
    keywords: ['const', 'let', 'var', 'function', 'async', 'await', 'export', 'import', 'module.exports'],
  },
  {
    lang: 'java',
    name: 'Java',
    patterns: [
      /\bpublic\s+class\s+[A-Z]\w*/,
      /\bpublic\s+static\s+void\s+main\s*\(/,
      /\bSystem\.out\.println\s*\(/,
      /\bpackage\s+[\w.]+;/,
      /@(?:Override|Autowired|Getter|Setter|Entity|Controller|Service|Component)\b/,
    ],
    keywords: ['public', 'private', 'protected', 'static', 'final', 'extends', 'implements', 'throws', 'new', 'abstract'],
  },
  {
    lang: 'cpp',
    name: 'C / C++',
    patterns: [
      /#include\s*<[\w.]+>/,
      /#include\s*"[\w.]+"/,
      /\bstd::(?:cout|cin|endl|vector|string|map)\b/,
      /\bcout\s*<<|\bcin\s*>>/,
      /\bint\s+main\s*\(/,
      /\bprintf\s*\(|\bscanf\s*\(/,
    ],
    keywords: ['std::', 'namespace', 'template', 'nullptr', 'cout', 'cin', 'size_t', 'struct', 'typedef', 'inline'],
  },
  {
    lang: 'csharp',
    name: 'C#',
    patterns: [
      /\busing\s+System(?:[\w.]+)?;/,
      /\bnamespace\s+[\w.]+/,
      /\bConsole\.WriteLine\s*\(/,
      /\bpublic\s+class\s+[A-Z]\w*/,
    ],
    keywords: ['using System', 'namespace', 'Console.WriteLine', 'async Task', 'get; set;', 'LINQ', 'var '],
  },
  {
    lang: 'go',
    name: 'Go',
    patterns: [
      /\bpackage\s+main\b|\bpackage\s+[a-zA-Z_]\w*/,
      /\bfunc\s+[a-zA-Z_]\w*\s*\(/,
      /\bimport\s*\(\s*["']/,
      /\bfmt\.(?:Println|Printf|Sprintf)\s*\(/,
      /:=\s*/,
    ],
    keywords: ['func', 'package', 'fmt.Println', 'struct', 'chan', 'defer', 'go func', 'iota'],
  },
  {
    lang: 'rust',
    name: 'Rust',
    patterns: [
      /\bfn\s+[a-zA-Z_]\w*\s*\(/,
      /\blet\s+mut\s+/,
      /\bprintln!\s*\(/,
      /\buse\s+std::/,
      /\bimpl\s+[A-Z]\w*/,
      /\bmatch\s+[a-zA-Z_]\w*\s*\{/,
    ],
    keywords: ['fn', 'let mut', 'println!', 'impl', 'pub fn', 'Option<', 'Result<', 'derive'],
  },
  {
    lang: 'ruby',
    name: 'Ruby',
    patterns: [
      /\bdef\s+[a-zA-Z_]\w*.*?\n.*?end\b/s,
      /\brequire\s+['"][\w.\/]+['"]/,
      /\bputs\s+|\bp\s+/,
      /\bclass\s+[A-Z]\w*(?:\s*<\s*[A-Z]\w*)?/,
      /\battr_accessor\b|\battr_reader\b/,
    ],
    keywords: ['def', 'end', 'puts', 'attr_accessor', 'elsif', 'unless', 'nil', 'yield'],
  },
  {
    lang: 'php',
    name: 'PHP',
    patterns: [
      /<\?php/,
      /\$[a-zA-Z_]\w*\s*=/,
      /\becho\s+/,
      /\bfunction\s+[a-zA-Z_]\w*\s*\(/,
    ],
    keywords: ['<?php', 'echo', '$_GET', '$_POST', 'public function', '->'],
  },
  {
    lang: 'sql',
    name: 'SQL',
    patterns: [
      /\bSELECT\b.*?\bFROM\b/i,
      /\bINSERT\s+INTO\b/i,
      /\bCREATE\s+TABLE\b/i,
      /\bUPDATE\b.*?\bSET\b/i,
      /\bWHERE\b.*?\bGROUP\s+BY\b/i,
    ],
    keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT INTO', 'JOIN', 'PRIMARY KEY', 'GROUP BY'],
  },
  {
    lang: 'kotlin',
    name: 'Kotlin',
    patterns: [
      /\bfun\s+[a-zA-Z_]\w*\s*\(/,
      /\bval\s+[a-zA-Z_]\w*\s*[:=]|\bvar\s+[a-zA-Z_]\w*\s*[:=]/,
      /\bpackage\s+[\w.]+/,
      /\bprintln\s*\(/,
      /\bdata\s+class\s+[A-Z]\w*/,
    ],
    keywords: ['fun', 'val', 'var', 'package', 'println', 'data class', 'companion object', 'suspend fun', 'when'],
  },
  {
    lang: 'swift',
    name: 'Swift',
    patterns: [
      /\bfunc\s+[a-zA-Z_]\w*\s*\(/,
      /\blet\s+[a-zA-Z_]\w*\s*[:=]|\bvar\s+[a-zA-Z_]\w*\s*[:=]/,
      /\bimport\s+(?:Foundation|UIKit|SwiftUI|Cocoa)\b/,
      /\bguard\s+let\b|\bif\s+let\b/,
      /\bstruct\s+[A-Z]\w*\s*:\s*View\b/,
    ],
    keywords: ['func', 'let', 'var', 'guard', 'SwiftUI', 'Foundation', 'struct', 'mutating func'],
  },
  {
    lang: 'html',
    name: 'HTML',
    patterns: [
      /<!DOCTYPE\s+html>/i,
      /<html[^>]*>/i,
      /<div[^>]*>|<\/div>/i,
      /<body[^>]*>|<\/body>/i,
    ],
    keywords: ['<!DOCTYPE', '<html', '<head', '<body', '<div', '<script', '<style'],
  },
  {
    lang: 'css',
    name: 'CSS',
    patterns: [
      /[a-zA-Z0-9_.-]+\s*\{[^}]*:[^}]*;[^}]*\}/,
      /@media\s*\([^)]+\)/,
      /@keyframes\s+/,
    ],
    keywords: ['margin:', 'padding:', 'display:', 'color:', 'background:', 'font-family:'],
  },
];

export function detectLanguage(code: string, fileName?: string): DetectionResult {
  if (!code || !code.trim()) {
    return { language: 'python', confidence: 'low', name: 'Python' };
  }

  // 1. Extension check if fileName provided
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return { language: 'python', confidence: 'high', name: 'Python' };
      case 'ts':
      case 'tsx': return { language: 'typescript', confidence: 'high', name: 'TypeScript' };
      case 'js':
      case 'jsx':
      case 'mjs':
      case 'cjs': return { language: 'javascript', confidence: 'high', name: 'JavaScript' };
      case 'java': return { language: 'java', confidence: 'high', name: 'Java' };
      case 'cpp':
      case 'cc':
      case 'cxx':
      case 'hpp':
      case 'h':
      case 'c': return { language: 'cpp', confidence: 'high', name: 'C / C++' };
      case 'cs': return { language: 'csharp', confidence: 'high', name: 'C#' };
      case 'go': return { language: 'go', confidence: 'high', name: 'Go' };
      case 'rs': return { language: 'rust', confidence: 'high', name: 'Rust' };
      case 'rb': return { language: 'ruby', confidence: 'high', name: 'Ruby' };
      case 'php': return { language: 'php', confidence: 'high', name: 'PHP' };
      case 'sql': return { language: 'sql', confidence: 'high', name: 'SQL' };
      case 'kt':
      case 'kts': return { language: 'kotlin', confidence: 'high', name: 'Kotlin' };
      case 'swift': return { language: 'swift', confidence: 'high', name: 'Swift' };
      case 'html':
      case 'htm': return { language: 'html', confidence: 'high', name: 'HTML' };
      case 'css': return { language: 'css', confidence: 'high', name: 'CSS' };
    }
  }

  // 2. Pattern and keyword scoring
  let bestMatch: { lang: SupportedLanguage; name: string; score: number } = {
    lang: 'python',
    name: 'Python',
    score: 0,
  };

  for (const item of LANGUAGE_PATTERNS) {
    let score = 0;
    for (const pattern of item.patterns) {
      if (pattern.test(code)) {
        score += 3;
      }
    }
    for (const kw of item.keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const matches = (code.match(regex) || []).length;
      score += Math.min(matches, 5);
    }

    if (score > bestMatch.score) {
      bestMatch = { lang: item.lang, name: item.name, score };
    }
  }

  if (bestMatch.score >= 5) {
    return { language: bestMatch.lang, confidence: 'high', name: bestMatch.name };
  } else if (bestMatch.score >= 2) {
    return { language: bestMatch.lang, confidence: 'medium', name: bestMatch.name };
  }

  return { language: 'generic', confidence: 'low', name: 'Universal Source Code' };
}
