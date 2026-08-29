import { ClassAnalysis, FunctionAnalysis, ImportAnalysis, PulseMapData, StructureLink, StructureNode } from '../types';

export function generatePulseMap(
  fileName: string,
  imports: ImportAnalysis[],
  classes: ClassAnalysis[],
  functions: FunctionAnalysis[]
): PulseMapData {
  const nodes: StructureNode[] = [];
  const links: StructureLink[] = [];

  const rootId = `file-${fileName}`;
  nodes.push({
    id: rootId,
    label: fileName || 'source_file',
    type: 'file',
    group: 'file',
  });

  // 1. Add Import nodes
  imports.forEach((imp, idx) => {
    const impId = `import-${idx}-${imp.module}`;
    nodes.push({
      id: impId,
      label: imp.module,
      type: 'import',
      line: imp.line,
      group: imp.isExternal ? 'external_pkg' : 'internal_mod',
    });

    links.push({
      source: rootId,
      target: impId,
      relationship: 'imports',
    });
  });

  // 2. Add Class nodes
  classes.forEach((cls) => {
    const classId = `class-${cls.name}`;
    nodes.push({
      id: classId,
      label: cls.name,
      type: 'class',
      line: cls.line,
      metrics: {
        loc: cls.loc,
      },
      group: 'class',
    });

    links.push({
      source: rootId,
      target: classId,
      relationship: 'defines',
    });
  });

  // 3. Add Function nodes
  functions.forEach((fn) => {
    const fnId = `func-${fn.name}-${fn.line}`;
    nodes.push({
      id: fnId,
      label: `${fn.name}()`,
      type: 'function',
      line: fn.line,
      metrics: {
        complexity: fn.complexity,
        loc: fn.loc,
        params: fn.params,
      },
      group: fn.complexity > 10 ? 'high_complexity' : 'function',
    });

    // Check if function belongs to a class
    // Simple heuristic: if class defined before function
    const parentClass = classes.find((c) => c.line < fn.line && (c.endLine ? fn.line <= c.endLine : true));
    if (parentClass) {
      links.push({
        source: `class-${parentClass.name}`,
        target: fnId,
        relationship: 'contains',
      });
    } else {
      links.push({
        source: rootId,
        target: fnId,
        relationship: 'defines',
      });
    }
  });

  // If few nodes, add a baseline placeholder function or entry node to keep graph informative
  if (nodes.length === 1) {
    const mainNodeId = `func-main-entry`;
    nodes.push({
      id: mainNodeId,
      label: 'Main Script Body',
      type: 'function',
      line: 1,
      group: 'function',
    });
    links.push({
      source: rootId,
      target: mainNodeId,
      relationship: 'defines',
    });
  }

  return { nodes, links };
}
