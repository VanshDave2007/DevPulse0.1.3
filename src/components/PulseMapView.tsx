import React, { useMemo, useState } from 'react';
import {
  Boxes,
  Cpu,
  Download,
  FileCode,
  Filter,
  HelpCircle,
  Info,
  Layers,
  Maximize2,
  Minus,
  Network,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Zap,
  Eye,
  SlidersHorizontal,
  Code2,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StructureNode } from '../types';
import { useComponentPerformanceTracker } from '../hooks/usePerformanceTracker';

export const PulseMapView: React.FC = () => {
  useComponentPerformanceTracker('Pulse Architecture Map');
  const { analysis, setActiveTab, sendAiRequest, setIsExportModalOpen, setCode, setLanguage, runAnalysis } = useApp();
  const [selectedNode, setSelectedNode] = useState<StructureNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'file' | 'class' | 'function' | 'import'>('all');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<'beginner' | 'advanced'>('beginner');
  const [showLegend, setShowLegend] = useState(true);

  if (!analysis) {
    return (
      <div className="p-12 text-center rounded-3xl bg-pulse-surface border border-pulse-subtle max-w-xl mx-auto space-y-4 shadow-sm animate-fadeIn">
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 w-fit mx-auto">
          <Network className="h-10 w-10 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-pulse-primary">No Active Code Analyzed Yet</h2>
          <p className="text-xs text-pulse-secondary leading-relaxed">
            The Code Pulse Map visualizes how your functions, classes, and imported modules connect together. Load a project in Analyzer Studio to see its structural blueprint.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('analyzer')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm"
          >
            Go to Analyzer Studio
          </button>
          <button
            onClick={() => {
              const sample = `import os
import json
import logging

class OrderProcessor:
    def __init__(self, db_conn):
        self.db = db_conn
        self.logger = logging.getLogger("order_proc")

    def process_order(self, order_id, user_email):
        if not order_id:
            raise ValueError("Invalid order ID")
        data = self.db.query("SELECT * FROM orders WHERE id = ?", order_id)
        self.logger.info("Processing order for user: %s", user_email)
        return self._calculate_tax(data)

    def _calculate_tax(self, order_data):
        subtotal = order_data.get("subtotal", 0)
        return subtotal * 1.08`;
              setCode(sample);
              setLanguage('python');
              setActiveTab('pulse-map');
              setTimeout(() => runAnalysis(sample, 'python'), 100);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs font-semibold text-pulse-primary transition"
          >
            Load Sample Code Blueprint
          </button>
        </div>
      </div>
    );
  }

  const { pulseMap } = analysis;
  const nodes = pulseMap.nodes;
  const links = pulseMap.links;

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesSearch = n.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || n.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [nodes, searchTerm, filterType]);

  // Generate 2D coordinates with balanced spacing for maximum readability
  const positionedNodes = useMemo(() => {
    const total = nodes.length;
    if (total === 0) return [];

    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    return nodes.map((node, idx) => {
      if (node.type === 'file') {
        return { ...node, x: centerX, y: centerY };
      }

      // Group nodes into readable orbital rings
      let radius = 175;
      if (node.type === 'import') radius = 240;
      if (node.type === 'class') radius = 115;
      if (node.type === 'function') radius = 185;

      const nonFileIndex = idx;
      const angle = (nonFileIndex / Math.max(1, total - 1)) * 2 * Math.PI - Math.PI / 2;

      const x = Math.max(70, Math.min(width - 70, centerX + radius * Math.cos(angle)));
      const y = Math.max(50, Math.min(height - 50, centerY + radius * Math.sin(angle)));

      return { ...node, x, y };
    });
  }, [nodes]);

  // High contrast, theme-harmonized node colors
  const getNodeColor = (type: string, group?: string) => {
    if (group === 'high_complexity') return { bg: '#F43F5E', border: '#E11D48', text: '#FFE4E6' };
    if (type === 'file') return { bg: '#0D9488', border: '#14B8A6', text: '#CCFBF1' };
    if (type === 'class') return { bg: '#6366F1', border: '#818CF8', text: '#E0E7FF' };
    if (type === 'import') return { bg: '#10B981', border: '#34D399', text: '#D1FAE5' };
    return { bg: '#0284C7', border: '#38BDF8', text: '#E0F2FE' }; // function
  };

  const getFriendlyTypeDescription = (node: StructureNode) => {
    if (node.type === 'file') return 'Root Source File / Module';
    if (node.type === 'class') return 'Class Structure / Object Model';
    if (node.type === 'function') return 'Function / Subroutine';
    if (node.type === 'import') return 'External Library / Import';
    return 'Code Component';
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-pulse-primary">Code Architecture Map</h1>
              <p className="text-xs text-pulse-secondary">
                Interactive blueprint showing how your files, classes, routines, and libraries connect
              </p>
            </div>
          </div>
        </div>

        {/* Search, Mode Toggle & Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Beginner vs Advanced Mode Toggle */}
          <div className="flex items-center space-x-1 bg-pulse-elevated p-1 rounded-xl border border-pulse-subtle text-xs">
            <button
              onClick={() => setViewMode('beginner')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                viewMode === 'beginner'
                  ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/40 font-semibold'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              Simple View
            </button>
            <button
              onClick={() => setViewMode('advanced')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                viewMode === 'advanced'
                  ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/40 font-semibold'
                  : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              Technical View
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-pulse-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-pulse-elevated border border-pulse-subtle rounded-xl pl-8 pr-3 py-1.5 text-xs text-pulse-primary placeholder-pulse-muted focus:outline-none focus:border-pulse-accent w-40"
            />
          </div>

          {/* Filter Pills */}
          <div className="hidden sm:flex items-center space-x-1 bg-pulse-elevated p-1 rounded-xl border border-pulse-subtle">
            {(['all', 'class', 'function', 'import'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition ${
                  filterType === type
                    ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/40 font-semibold'
                    : 'text-pulse-muted hover:text-pulse-primary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pulse-elevated hover:bg-pulse-elevated-hover border border-pulse-subtle text-xs text-pulse-primary transition font-medium"
            title="Export Architecture Map report"
          >
            <Download className="h-3.5 w-3.5 text-pulse-accent" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Detail Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Interactive Visualizer */}
        <div className="lg:col-span-8 relative rounded-3xl bg-pulse-surface border border-pulse-subtle overflow-hidden min-h-[520px] flex items-center justify-center shadow-inner">
          {/* Floating Canvas Controls */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-1 bg-pulse-bg/90 border border-pulse-subtle p-1 rounded-2xl backdrop-blur-md shadow-md">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2, Number((z + 0.15).toFixed(2))))}
              className="p-2 rounded-xl text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated transition"
              title="Zoom In (+)"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
              className="p-2 rounded-xl text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated transition"
              title="Zoom Out (-)"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-2 rounded-xl text-pulse-secondary hover:text-pulse-primary hover:bg-pulse-elevated transition"
              title="Reset Zoom to 100%"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-mono font-semibold text-pulse-muted px-2">
              {Math.round(zoomLevel * 100)}%
            </span>
            <div className="h-4 w-px bg-pulse-subtle mx-1" />
            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`px-2 py-1 rounded-xl text-[11px] font-medium transition ${
                showLegend ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300' : 'text-pulse-muted hover:text-pulse-primary'
              }`}
            >
              Legend
            </button>
          </div>

          {/* Floating On-Canvas Color Legend */}
          {showLegend && (
            <div className="absolute bottom-4 left-4 z-10 p-3 rounded-2xl bg-pulse-bg/95 border border-pulse-subtle backdrop-blur-md shadow-md text-xs space-y-1.5 max-w-xs animate-fadeIn">
              <span className="text-[10px] font-mono font-bold uppercase text-pulse-muted block mb-1">
                Graph Legend
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-medium">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0D9488]" />
                  <span className="text-pulse-primary">File / Module</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6366F1]" />
                  <span className="text-pulse-primary">Class</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0284C7]" />
                  <span className="text-pulse-primary">Function</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                  <span className="text-pulse-primary">Import</span>
                </div>
                <div className="flex items-center space-x-1.5 col-span-2 pt-0.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F43F5E]" />
                  <span className="text-rose-500 font-semibold">High Complexity (Needs Fix)</span>
                </div>
              </div>
            </div>
          )}

          {/* SVG Canvas with High Contrast Labels & Halo Outlines */}
          <svg
            viewBox="0 0 800 500"
            className="w-full h-full select-none cursor-grab active:cursor-grabbing transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <defs>
              <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Draw Links between nodes */}
            {links.map((link, idx) => {
              const srcNode = positionedNodes.find((n) => n.id === link.source);
              const tgtNode = positionedNodes.find((n) => n.id === link.target);
              if (!srcNode || !tgtNode) return null;

              const isConnectedToSelected =
                selectedNode && (selectedNode.id === srcNode.id || selectedNode.id === tgtNode.id);

              return (
                <g key={idx}>
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={tgtNode.x}
                    y2={tgtNode.y}
                    stroke={isConnectedToSelected ? '#2DD4BF' : 'currentColor'}
                    className={isConnectedToSelected ? '' : 'text-pulse-subtle'}
                    strokeWidth={isConnectedToSelected ? 2.5 : 1.5}
                    strokeDasharray={link.relationship === 'imports' ? '5,5' : undefined}
                    opacity={isConnectedToSelected ? 1 : 0.6}
                  />
                </g>
              );
            })}

            {/* Draw Nodes with High Contrast Pill Labels */}
            {positionedNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isHighlighted =
                !searchTerm || node.label.toLowerCase().includes(searchTerm.toLowerCase());
              const color = getNodeColor(node.type, node.group);
              const isFile = node.type === 'file';
              const isClass = node.type === 'class';

              const radius = isFile ? 20 : isClass ? 15 : 12;

              // Truncate label for canvas if long
              const displayLabel =
                node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer transition-all duration-200"
                  opacity={isHighlighted ? 1 : 0.2}
                >
                  {/* Outer Pulsing Ring when Selected */}
                  {isSelected && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke="#2DD4BF"
                      strokeWidth={2.5}
                      className="animate-pulse"
                    />
                  )}

                  {/* Node Circle Container */}
                  <circle
                    r={radius}
                    fill={color.bg}
                    stroke={isSelected ? '#FFFFFF' : color.border}
                    strokeWidth={isSelected ? 3 : 2}
                    filter="url(#nodeShadow)"
                  />

                  {/* Icon indicator inside circle for files & classes */}
                  {isFile && (
                    <text
                      y={4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      FILE
                    </text>
                  )}
                  {isClass && (
                    <text
                      y={4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      C
                    </text>
                  )}

                  {/* High Contrast Background Pill for Label to Guarantee 100% Readability */}
                  <g transform={`translate(0, ${radius + 14})`}>
                    {/* Background Rect for Pill Label */}
                    <rect
                      x={-(displayLabel.length * 4.2 + 8)}
                      y={-10}
                      width={displayLabel.length * 8.4 + 16}
                      height={18}
                      rx={9}
                      className={isSelected ? 'fill-teal-900/90 stroke-teal-400' : 'fill-[#08110F]/90 stroke-pulse-subtle'}
                      strokeWidth={1}
                    />

                    {/* Highly Legible Text */}
                    <text
                      y={3}
                      textAnchor="middle"
                      className="font-mono font-semibold text-[11px] select-none"
                      fill={isSelected ? '#2DD4BF' : '#ECFDF5'}
                      letterSpacing="0.2px"
                    >
                      {displayLabel}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* RIGHT: Node Inspector & Beginner Guidance */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Node Details Card */}
          {selectedNode ? (
            <div className="p-5 rounded-3xl bg-pulse-surface border border-teal-500/50 space-y-4 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between border-b border-pulse-subtle pb-3">
                <span className="text-xs font-mono uppercase text-pulse-accent font-bold">
                  Component Details
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-pulse-elevated border border-pulse-subtle text-pulse-primary uppercase font-semibold">
                  {selectedNode.type}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold font-mono text-pulse-primary break-all">
                  {selectedNode.label}
                </h3>
                <p className="text-xs text-pulse-secondary mt-1">
                  {getFriendlyTypeDescription(selectedNode)}
                </p>
                {selectedNode.line && (
                  <span className="text-[11px] text-pulse-muted font-mono mt-1 block">
                    Defined at Line {selectedNode.line}
                  </span>
                )}
              </div>

              {/* Simple vs Technical Metrics */}
              {selectedNode.metrics && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pulse-subtle">
                  {selectedNode.metrics.complexity !== undefined && (
                    <div className="p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle">
                      <span className="text-[11px] text-pulse-muted block font-medium">
                        {viewMode === 'beginner' ? 'Code Complexity' : 'Cyclomatic Metric'}
                      </span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span
                          className={`text-base font-bold font-mono ${
                            selectedNode.metrics.complexity > 10
                              ? 'text-rose-500'
                              : selectedNode.metrics.complexity > 5
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {selectedNode.metrics.complexity}
                        </span>
                        <span className="text-[10px] text-pulse-muted">
                          {selectedNode.metrics.complexity > 10
                            ? '(High)'
                            : selectedNode.metrics.complexity > 5
                            ? '(Moderate)'
                            : '(Low/Good)'}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedNode.metrics.params !== undefined && (
                    <div className="p-3 rounded-2xl bg-pulse-elevated border border-pulse-subtle">
                      <span className="text-[11px] text-pulse-muted block font-medium">
                        {viewMode === 'beginner' ? 'Inputs / Arguments' : 'Parameters Count'}
                      </span>
                      <span className="text-base font-bold font-mono text-pulse-primary mt-0.5 block">
                        {selectedNode.metrics.params}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Friendly explanation of what to do */}
              <div className="p-3 rounded-2xl bg-pulse-bg border border-pulse-subtle text-xs text-pulse-secondary space-y-1">
                <span className="font-semibold text-pulse-primary flex items-center space-x-1">
                  <Info className="h-3.5 w-3.5 text-pulse-accent" />
                  <span>Why this matters:</span>
                </span>
                <p className="text-[11px] leading-relaxed">
                  {selectedNode.type === 'file'
                    ? 'This is the main entry point module that coordinates all subroutines.'
                    : selectedNode.type === 'class'
                    ? 'Classes group related data and functions together into an object model.'
                    : selectedNode.type === 'import'
                    ? 'Imports bring in external dependencies. Keep them minimal to reduce load times.'
                    : 'Functions carry out specific business tasks. Keeping them small makes testing easy.'}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  sendAiRequest(
                    'explain',
                    `Explain what the code component '${selectedNode.label}' does in simple terms, why it is structured this way, and whether its complexity can be improved.`
                  );
                  setActiveTab('pulse-ai');
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#08110F] text-xs font-bold transition shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Explain this Component with AI</span>
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-pulse-surface border border-pulse-subtle text-center space-y-3 shadow-sm">
              <div className="p-3 rounded-2xl bg-pulse-elevated text-pulse-accent w-fit mx-auto">
                <Boxes className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-pulse-primary">Interactive Component Inspector</h4>
              <p className="text-xs text-pulse-secondary leading-relaxed">
                Click on any node in the visual map above to inspect its parameters, complexity, and downstream connections.
              </p>
              <div className="pt-2 text-[11px] text-pulse-muted border-t border-pulse-subtle flex items-center justify-center space-x-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span>Tip: Click on red nodes first to review high complexity functions.</span>
              </div>
            </div>
          )}

          {/* Architecture Summary Breakdown */}
          <div className="p-5 rounded-3xl bg-pulse-surface border border-pulse-subtle space-y-3 shadow-sm">
            <h4 className="text-xs font-mono uppercase text-pulse-muted font-bold">
              Architecture Overview
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-elevated font-mono">
                <span className="text-pulse-secondary">Total Components</span>
                <span className="text-pulse-primary font-bold">{nodes.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-elevated font-mono">
                <span className="text-pulse-secondary">Connections / Calls</span>
                <span className="text-pulse-primary font-bold">{links.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-pulse-elevated font-mono">
                <span className="text-pulse-secondary">External Libraries</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">
                  {analysis.metrics.externalDependenciesCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
