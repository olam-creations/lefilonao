'use client';

import { useCallback, useRef } from 'react';
import { GripVertical } from 'lucide-react';

interface WorkspaceDividerProps {
  onResize: (ratio: number) => void;
  onReset: () => void;
}

export default function WorkspaceDivider({ onResize, onReset }: WorkspaceDividerProps) {
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0.25, Math.min(0.75, ratio));
    onResize(clamped);
  }, [onResize]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={onReset}
      className="flex-shrink-0 w-2 cursor-col-resize flex items-center justify-center group hover:bg-indigo-50 transition-colors relative select-none"
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionner les panneaux"
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
    </div>
  );
}
