'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import WorkspaceDivider from './WorkspaceDivider';

const STORAGE_KEY = 'lefilonao_workspace_split';
const DEFAULT_SPLIT = 0.4;

function loadSplit(): number {
  if (typeof window === 'undefined') return DEFAULT_SPLIT;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const val = parseFloat(saved);
      if (val >= 0.25 && val <= 0.75) return val;
    }
  } catch { /* ignore */ }
  return DEFAULT_SPLIT;
}

interface WorkspaceLayoutProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  coachBar?: React.ReactNode;
}

export default function WorkspaceLayout({ leftPane, rightPane, coachBar }: WorkspaceLayoutProps) {
  const [split, setSplit] = useState(loadSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // Persist split ratio
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(split));
    } catch { /* ignore */ }
  }, [split]);

  // Keyboard shortcuts: Ctrl+[ → focus left, Ctrl+] → focus right
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === '[') {
        e.preventDefault();
        leftRef.current?.focus();
      } else if (e.key === ']') {
        e.preventDefault();
        rightRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResize = useCallback((ratio: number) => {
    setSplit(ratio);
  }, []);

  const handleReset = useCallback(() => {
    setSplit(DEFAULT_SPLIT);
  }, []);

  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        ref={containerRef}
        className="flex min-h-[calc(100vh-280px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* Left pane — DCE context */}
        <div
          ref={leftRef}
          tabIndex={-1}
          className="overflow-y-auto overflow-x-hidden focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-200"
          style={{ width: `${split * 100}%` }}
        >
          <div className="p-5">
            {leftPane}
          </div>
        </div>

        {/* Resizable divider */}
        <WorkspaceDivider onResize={handleResize} onReset={handleReset} />

        {/* Right pane — Memoire editor */}
        <div
          ref={rightRef}
          tabIndex={-1}
          className="overflow-y-auto overflow-x-hidden focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-200"
          style={{ width: `${(1 - split) * 100}%` }}
        >
          <div className="p-5">
            {rightPane}
          </div>
        </div>
      </div>

      {/* Coach bar at bottom */}
      {coachBar}
    </motion.div>
  );
}
