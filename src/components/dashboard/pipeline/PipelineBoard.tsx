'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useUser } from '@/components/UserProvider';
import PipelineColumn from './PipelineColumn';
import PipelineCard from './PipelineCard';
import { Loader2 } from 'lucide-react';

const STAGES = [
  { id: 'detected', title: 'Détectés' },
  { id: 'qualified', title: 'Qualifiés' },
  { id: 'dce_analyzed', title: 'DCE Analysés' },
  { id: 'drafting', title: 'En rédaction' },
  { id: 'submitted', title: 'Soumis' },
  { id: 'result', title: 'Résultats' },
];

interface PipelineItem {
  id: string;
  stage: string;
  position: number;
  ao_title: string;
  ao_issuer: string;
  ao_budget?: string;
  ao_deadline: string | null;
  ao_score?: number;
  ao_score_label?: 'GO' | 'MAYBE' | 'PASS';
  tags?: string[];
}

export default function PipelineBoard() {
  const { email } = useUser();
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!email) return;

    fetch(`/api/pipeline?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        setItems(data.pipeline || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const findContainer = (id: string) => {
    if (STAGES.find(s => s.id === id)) return id;
    const item = items.find(i => i.id === id);
    return item ? item.stage : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(overId));

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setItems((prev) => {
      const activeItem = prev.find(i => i.id === active.id);
      if (!activeItem) return prev;

      const updatedItem = { ...activeItem, stage: overContainer };
      const filtered = prev.filter(i => i.id !== active.id);
      
      // Place at the end of the new container for now
      return [...filtered, updatedItem];
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;

    const activeContainer = findContainer(activeId);
    const overContainer = overId ? findContainer(overId) : null;

    if (!activeContainer || !overContainer || !over) {
      setActiveId(null);
      return;
    }

    const activeIndex = items.findIndex(i => i.id === activeId);
    const overIndex = items.findIndex(i => i.id === overId);

    let newItems = [...items];
    if (activeIndex !== overIndex) {
      newItems = arrayMove(items, activeIndex, overIndex);
      // Update positions
      newItems = newItems.map((item, idx) => ({ ...item, position: idx }));
      setItems(newItems);
    }

    setActiveId(null);

    // Save to API
    try {
      const movedItem = newItems.find(i => i.id === activeId);
      if (movedItem) {
        await fetch(`/api/pipeline/${movedItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: movedItem.stage,
            position: movedItem.position
          })
        });
      }
    } catch {
      // Pipeline position save failed silently — will retry on next drag
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Chargement du pipeline...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar h-[calc(100vh-200px)] items-start">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {STAGES.map((stage) => {
          const stageItems = items.filter(i => i.stage === stage.id);
          return (
            <PipelineColumn
              key={stage.id}
              id={stage.id}
              title={stage.title}
              items={stageItems}
              count={stageItems.length}
            />
          );
        })}

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeId ? (
            <div className="w-[300px]">
              <PipelineCard
                {...items.find(i => i.id === activeId)!}
                id={activeId}
                title={items.find(i => i.id === activeId)!.ao_title}
                issuer={items.find(i => i.id === activeId)!.ao_issuer}
                deadline={items.find(i => i.id === activeId)!.ao_deadline}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
