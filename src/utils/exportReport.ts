import { jsPDF } from 'jspdf';
import { AnalysisResult, CodeSmell, StructureNode } from '../types';

export interface ExportOptions {
  includeMetrics: boolean;
  includeSmells: boolean;
  includePulseMap: boolean;
  includeFunctions: boolean;
  includeImports: boolean;
  includeAiSummary?: boolean;
}

const defaultOptions: ExportOptions = {
  includeMetrics: true,
  includeSmells: true,
  includePulseMap: true,
  includeFunctions: true,
  includeImports: true,
  includeAiSummary: true,
};

/**
 * Export Analysis & Pulse Map data as a JSON file
 */
export function exportAnalysisAsJSON(
  analysis: AnalysisResult,
  code: string,
  fileName: string,
  aiSummaryText?: string
): void {
  const exportPayload = {
    metadata: {
      tool: 'DevPulse Intelligence Engine',
      tagline: 'See the Code. Find the Pulse.',
      exportedAt: new Date().toISOString(),
      fileName: fileName || 'untitled',
      language: analysis.language,
      languageName: analysis.languageName,
      linesOfCode: analysis.metrics.loc,
    },
    executiveSummary: {
      healthScore: analysis.metrics.healthScore,
      healthLevel: analysis.summary.healthLevel,
      maintainabilityScore: analysis.metrics.maintainabilityScore,
      cyclomaticComplexity: analysis.metrics.cyclomaticComplexity,
      cognitiveComplexity: analysis.metrics.cognitiveComplexity,
      smellsCount: analysis.smells.length,
      criticalSmellsCount: analysis.summary.criticalCount,
      warningSmellsCount: analysis.summary.warningCount,
      infoSmellsCount: analysis.summary.infoCount,
    },
    metrics: {
      loc: analysis.metrics.loc,
      sloc: analysis.metrics.sloc,
      blankLines: analysis.metrics.blankLines,
      commentLines: analysis.metrics.commentLines,
      commentRatio: analysis.metrics.commentRatio,
      cyclomaticComplexity: analysis.metrics.cyclomaticComplexity,
      cognitiveComplexity: analysis.metrics.cognitiveComplexity,
      maxNestingDepth: analysis.metrics.maxNestingDepth,
      functionCount: analysis.metrics.functionCount,
      classCount: analysis.metrics.classCount,
      averageFunctionLength: analysis.metrics.averageFunctionLength,
      dependenciesCount: analysis.metrics.dependenciesCount,
      externalDependenciesCount: analysis.metrics.externalDependenciesCount,
      internalDependenciesCount: analysis.metrics.internalDependenciesCount,
      scoreBreakdown: analysis.metrics.scoreBreakdown,
    },
    codeSmells: analysis.smells.map((s) => ({
      id: s.id,
      title: s.title,
      severity: s.severity,
      category: s.category,
      line: s.line,
      endLine: s.endLine,
      problem: s.problem,
      explanation: s.explanation,
      recommendation: s.recommendation,
      codeSnippet: s.codeSnippet,
    })),
    functions: analysis.metrics.functions.map((f) => ({
      name: f.name,
      line: f.line,
      endLine: f.endLine,
      loc: f.loc,
      params: f.params,
      paramNames: f.paramNames,
      complexity: f.complexity,
      cognitiveComplexity: f.cognitiveComplexity,
      nesting: f.nesting,
      isAsync: f.isAsync,
      returnType: f.returnType,
    })),
    classes: analysis.metrics.classes.map((c) => ({
      name: c.name,
      line: c.line,
      endLine: c.endLine,
      loc: c.loc,
      methodsCount: c.methodsCount,
      propertiesCount: c.propertiesCount,
      inheritance: c.inheritance,
    })),
    imports: analysis.metrics.imports.map((i) => ({
      module: i.module,
      names: i.names,
      isExternal: i.isExternal,
      line: i.line,
      riskNote: i.riskNote,
    })),
    pulseMap: {
      nodeCount: analysis.pulseMap.nodes.length,
      linkCount: analysis.pulseMap.links.length,
      nodes: analysis.pulseMap.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        line: n.line,
        group: n.group,
        metrics: n.metrics,
      })),
      links: analysis.pulseMap.links.map((l) => ({
        source: l.source,
        target: l.target,
        relationship: l.relationship,
      })),
    },
    aiInsights: aiSummaryText ? { summary: aiSummaryText } : undefined,
    rawSourceCode: code,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (fileName || 'code_intelligence').replace(/\.[^/.]+$/, '');
  link.href = url;
  link.download = `devpulse-intelligence-${safeName}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Analysis & Pulse Map data as a styled PDF report
 */
export function exportAnalysisAsPDF(
  analysis: AnalysisResult,
  code: string,
  fileName: string,
  options: ExportOptions = defaultOptions,
  aiSummaryText?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 18;

  const addHeader = (pageNum: number) => {
    // Top Brand Strip
    doc.setFillColor(13, 148, 136); // Teal #0D9488
    doc.rect(margin, 10, contentWidth, 2, 'F');

    // Brand text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(13, 148, 136);
    doc.text('DEVPULSE INTELLIGENCE REPORT', margin, 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Generated: ${dateStr}`, pageWidth - margin - 45, 8);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('DevPulse — "See the Code. Find the Pulse."', margin, pageHeight - 8);
    doc.text(`Page ${pageNum}`, pageWidth - margin - 15, pageHeight - 8);
  };

  let pageIndex = 1;
  addHeader(pageIndex);

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      pageIndex++;
      addHeader(pageIndex);
      currentY = 22;
    }
  };

  // 1. Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(18, 30, 28); // dark slate
  doc.text('Code Intelligence & Pulse Map Audit', margin, currentY);
  currentY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 95, 90);
  doc.text(
    `Target: ${fileName || 'Source Code'}  |  Language: ${analysis.languageName}  |  Lines: ${analysis.metrics.loc} LOC`,
    margin,
    currentY
  );
  currentY += 10;

  // 2. Executive Scorecard Box
  const healthScore = analysis.metrics.healthScore;
  const healthLevel = analysis.summary.healthLevel;
  const maintainability = analysis.metrics.maintainabilityScore;
  const cyclomatic = analysis.metrics.cyclomaticComplexity;
  const cognitive = analysis.metrics.cognitiveComplexity;

  // Background Box
  doc.setFillColor(245, 248, 247);
  doc.setDrawColor(204, 225, 221);
  doc.roundedRect(margin, currentY, contentWidth, 32, 3, 3, 'FD');

  // Health Score Big Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  if (healthScore >= 85) doc.setTextColor(13, 148, 136); // Teal
  else if (healthScore >= 70) doc.setTextColor(217, 119, 6); // Amber
  else doc.setTextColor(225, 29, 72); // Rose
  doc.text(`${healthScore}`, margin + 8, currentY + 16);

  doc.setFontSize(10);
  doc.setTextColor(100, 110, 110);
  doc.text('/ 100', margin + 30, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`HEALTH: ${healthLevel.toUpperCase()}`, margin + 8, currentY + 24);

  // Key Metric Columns
  const colX1 = margin + 55;
  const colX2 = margin + 105;
  const colX3 = margin + 145;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 110);
  doc.text('Maintainability Index', colX1, currentY + 10);
  doc.text('Cyclomatic Complexity', colX2, currentY + 10);
  doc.text('Cognitive Complexity', colX3, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 30, 30);
  doc.text(`${maintainability}/100`, colX1, currentY + 20);
  doc.text(`${cyclomatic}`, colX2, currentY + 20);
  doc.text(`${cognitive}`, colX3, currentY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`${analysis.smells.length} total code smells detected`, colX1, currentY + 27);
  doc.text(`Max Nesting: ${analysis.metrics.maxNestingDepth}`, colX2, currentY + 27);
  doc.text(`Avg Func Length: ${analysis.metrics.averageFunctionLength} lines`, colX3, currentY + 27);

  currentY += 40;

  // 3. Metrics Matrix Table
  if (options.includeMetrics) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text('1. Codebase Dimensions & Architecture Metrics', margin, currentY);
    currentY += 6;

    const metricsList = [
      ['Physical Lines (LOC)', `${analysis.metrics.loc}`],
      ['Source Lines (SLOC)', `${analysis.metrics.sloc}`],
      ['Comment Ratio', `${analysis.metrics.commentRatio}%`],
      ['Functions & Methods', `${analysis.metrics.functionCount}`],
      ['Classes Declared', `${analysis.metrics.classCount}`],
      ['Dependencies / Imports', `${analysis.metrics.dependenciesCount} (${analysis.metrics.externalDependenciesCount} external)`],
      ['Structural Health Score', `${analysis.metrics.scoreBreakdown.structure}/100`],
      ['Maintainability Score', `${analysis.metrics.scoreBreakdown.maintainability}/100`],
    ];

    const boxW = (contentWidth - 6) / 2;
    metricsList.forEach(([label, val], idx) => {
      const isRightCol = idx % 2 === 1;
      const x = isRightCol ? margin + boxW + 6 : margin;
      const rowY = currentY + Math.floor(idx / 2) * 9;

      doc.setFillColor(250, 252, 251);
      doc.setDrawColor(225, 235, 232);
      doc.roundedRect(x, rowY, boxW, 7.5, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 95, 90);
      doc.text(label, x + 3, rowY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 35, 30);
      doc.text(val, x + boxW - 4, rowY + 5, { align: 'right' });
    });

    currentY += Math.ceil(metricsList.length / 2) * 9 + 6;
  }

  // 4. Code Smells & Detected Vulnerabilities
  if (options.includeSmells && analysis.smells.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text(`2. Detected Code Smells & Security Findings (${analysis.smells.length})`, margin, currentY);
    currentY += 6;

    analysis.smells.slice(0, 8).forEach((smell: CodeSmell, sIdx: number) => {
      checkPageBreak(24);

      // Smell item card
      doc.setFillColor(252, 253, 252);
      doc.setDrawColor(220, 230, 228);
      doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

      // Severity Tag
      let sevBg = [204, 251, 241];
      let sevText = [13, 148, 136];
      if (smell.severity === 'critical') {
        sevBg = [255, 228, 230];
        sevText = [225, 29, 72];
      } else if (smell.severity === 'warning') {
        sevBg = [254, 243, 199];
        sevText = [217, 119, 6];
      }

      doc.setFillColor(sevBg[0], sevBg[1], sevBg[2]);
      doc.roundedRect(margin + 3, currentY + 3, 18, 4.5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(sevText[0], sevText[1], sevText[2]);
      doc.text(smell.severity.toUpperCase(), margin + 12, currentY + 6.2, { align: 'center' });

      // Title & Line
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20, 35, 30);
      doc.text(`${sIdx + 1}. ${smell.title}`, margin + 24, currentY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 130, 130);
      doc.text(`Line ${smell.line}`, pageWidth - margin - 5, currentY + 6.5, { align: 'right' });

      // Problem description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(60, 75, 70);
      const problemLines = doc.splitTextToSize(`Problem: ${smell.problem}`, contentWidth - 8);
      doc.text(problemLines.slice(0, 2), margin + 4, currentY + 11.5);

      // Recommendation
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(13, 148, 136);
      const fixLines = doc.splitTextToSize(`Fix: ${smell.recommendation}`, contentWidth - 8);
      doc.text(fixLines.slice(0, 1), margin + 4, currentY + 17.5);

      currentY += 23;
    });

    if (analysis.smells.length > 8) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`... and ${analysis.smells.length - 8} more findings detailed in JSON export.`, margin + 4, currentY);
      currentY += 6;
    }
  }

  // 5. Code Pulse Map Topology Overview
  if (options.includePulseMap) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text('3. Code Pulse Map Structural Topology', margin, currentY);
    currentY += 6;

    const nodes = analysis.pulseMap.nodes;
    const links = analysis.pulseMap.links;

    doc.setFillColor(245, 248, 247);
    doc.setDrawColor(204, 225, 221);
    doc.roundedRect(margin, currentY, contentWidth, 24, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 55, 50);
    doc.text(
      `Topology Graph Nodes: ${nodes.length} items   |   Structural Links: ${links.length} relationships`,
      margin + 6,
      currentY + 7
    );

    const fileNodes = nodes.filter((n) => n.type === 'file').length;
    const classNodes = nodes.filter((n) => n.type === 'class').length;
    const funcNodes = nodes.filter((n) => n.type === 'function').length;
    const impNodes = nodes.filter((n) => n.type === 'import').length;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(13, 148, 136);
    doc.text(
      `Files: ${fileNodes}   ·   Classes: ${classNodes}   ·   Functions/Methods: ${funcNodes}   ·   Imports: ${impNodes}`,
      margin + 6,
      currentY + 14
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 115, 110);
    doc.text(
      'Visual topology maps caller-callee bindings, import dependencies, and complexity hotspots.',
      margin + 6,
      currentY + 20
    );

    currentY += 28;

    // Node Sample Table
    checkPageBreak(25);
    const topFuncNodes = nodes.filter((n) => n.type === 'function').slice(0, 6);
    if (topFuncNodes.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 45, 40);
      doc.text('Key Functional Nodes in Pulse Topology:', margin, currentY);
      currentY += 5;

      topFuncNodes.forEach((node: StructureNode) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(20, 30, 30);
        doc.text(`• ${node.label}() [Line ${node.line || '?'}]`, margin + 4, currentY);

        if (node.metrics) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(node.metrics.complexity > 10 ? 225 : 13, node.metrics.complexity > 10 ? 29 : 148, node.metrics.complexity > 10 ? 72 : 136);
          doc.text(`Cyclomatic Complexity: ${node.metrics.complexity} | LOC: ${node.metrics.loc}`, pageWidth - margin - 5, currentY, { align: 'right' });
        }
        currentY += 5.5;
      });
    }
  }

  // 6. AI Summary Section
  if (options.includeAiSummary && aiSummaryText) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text('4. Pulse AI Architectural Recommendations', margin, currentY);
    currentY += 6;

    doc.setFillColor(248, 250, 249);
    doc.setDrawColor(210, 225, 220);
    const summaryLines = doc.splitTextToSize(aiSummaryText.slice(0, 1200), contentWidth - 10);
    const boxHeight = Math.min(60, summaryLines.length * 4.2 + 8);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 50, 50);
    doc.text(summaryLines.slice(0, 13), margin + 5, currentY + 6);
    currentY += boxHeight + 6;
  }

  // Save the document
  const safeName = (fileName || 'code_intelligence').replace(/\.[^/.]+$/, '');
  doc.save(`devpulse-report-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
