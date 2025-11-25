import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Module {
  key: string;
  name: string;
  icon: JSX.Element;
  component: React.ReactNode;
  isCardStyle?: boolean;
}

export interface DashboardDnDWrapperProps {
  modules: Module[];
  modulesVisible: Record<string, boolean>;
  toggleModuleVisibility: (key: string) => void;
  toggleSymbolsList: () => void;
  isLocked: boolean;
  toggleLockGrid: () => void;
}

interface SortableItemProps {
  module: Module;
  toggleSymbolsList: () => void;
  toggleModuleVisibility: (key: string) => void;
  isLocked: boolean;
}

// Default sizes for cards
const defaultSizes = {
  activeTrades: { width: 400, height: 300 },
  symbolAgent: { width: 400, height: 300 },
  orders: { width: 400, height: 300 },
  highPotentialTrades: { width: 400, height: 300 },
  ticker: { width: 2000, height: 220 },
  buySell: { width: 256, height: 128 },
  // Compact cards → smaller defaults (2/3 width, 1/2 height of others)
  cashAvailable: { width: 266, height: 100 },
  portfolioValue: { width: 266, height: 100 },
  dailyChange: { width: 266, height: 100 },
  totalPnL: { width: 266, height: 100 },
  symbolsList: { width: 266, height: 100 },
};

const SortableItem: React.FC<SortableItemProps> = ({
  module,
  toggleSymbolsList,
  toggleModuleVisibility,
  isLocked,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const savedLayout = JSON.parse(localStorage.getItem('dashboardCardLayout') || '{}');
  const initialSize = savedLayout[module.key]?.size || defaultSizes[module.key] || { width: 320, height: 200 };
  const initialPosition = savedLayout[module.key]?.position || { x: 0, y: 0 };
  const [size, setSize] = useState(initialSize);
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    const layout = JSON.parse(localStorage.getItem('dashboardCardLayout') || '{}');
    layout[module.key] = { size, position };
    localStorage.setItem('dashboardCardLayout', JSON.stringify(layout));
  }, [size, position, module.key]);

  // Compact card keys: reduce inner padding/height/font for minimal-data modules
  const isCompact = ['cashAvailable', 'portfolioValue', 'dailyChange', 'totalPnL', 'symbolsList'].includes(module.key);

  return (
    <div ref={setNodeRef} style={style} {...(!isLocked ? { ...attributes, ...listeners } : {})}>
      <Rnd
        size={{ width: size.width, height: size.height }}
        position={{ x: position.x, y: position.y }}
        minWidth={200}
        minHeight={100}
        maxWidth={1800}
        maxHeight={600}
        enableResizing={!isLocked}
        disableDragging={isLocked}
        onResizeStop={(e, direction, ref, delta, pos) => {
          if (isLocked) return;
          setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
          setPosition(pos);
        }}
          onDragStop={(e, d) => {
            if (isLocked) return;
            const maxRight = window.innerWidth - 100;     // same sidebar padding on right
            const maxBottom = window.innerHeight * 2;     // extend downward 2x viewport
            const newX = Math.min(Math.max(0, d.x), maxRight);
            const newY = Math.min(Math.max(0, d.y), maxBottom);
            setPosition({ x: newX, y: newY });
                }}
      >
        <Card
          className={`bg-[#1a1a1a] border-gray-700 w-full h-full ${isLocked ? 'cursor-default' : 'cursor-move'}`}
        >
          <CardHeader className={isCompact ? "compact" : ""}>
            {/* Title font matches content font for compact cards */}
            <CardTitle className={isCompact ? "compact text-xs leading-tight" : ""}>
              {module.name}
            </CardTitle>
          </CardHeader>
          <CardContent className={isCompact ? "compact" : ""}>
            {module.key === 'symbolsList' ? (
              <button
                className="underline text-blue-400 hover:text-blue-300 text-xs px-1 py-0"
                onClick={() => toggleSymbolsList()}
              >
                Symbols List
              </button>
            ) : (
              module.component
            )}
          </CardContent>
        </Card>
      </Rnd>
    </div>
  );
};

const DashboardDnDWrapper: React.FC<DashboardDnDWrapperProps> = ({
  modules,
  modulesVisible,
  toggleModuleVisibility,
  toggleSymbolsList,
  isLocked,
  toggleLockGrid,
}) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const [cardOrder, setCardOrder] = useState(() => {
    const stored = localStorage.getItem('dashboardCardOrder');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('dashboardCardOrder', JSON.stringify(cardOrder));
  }, [cardOrder]);

  useEffect(() => {
    setCardOrder((prev) => {
      let newOrder = prev.filter((key) => modulesVisible[key]);
      Object.keys(modulesVisible).forEach((key) => {
        if (modulesVisible[key] && !newOrder.includes(key)) newOrder.push(key);
      });
      return newOrder;
    });
  }, [modulesVisible]);

  const handleDragEnd = (event: any) => {
    if (isLocked) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCardOrder((prev) => {
      const oldIndex = prev.indexOf(active.id);
      const newIndex = prev.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const dashboardStyle = {
    border: !isLocked ? '1px dashed rgba(100,100,255,0.4)' : 'none',
    transition: 'border 0.3s ease',
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="relative w-full h-[calc(100vh-80px)] min-h-[600px]" style={dashboardStyle}>
        <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
          {cardOrder.map((key) => {
            const module = modules.find((m) => m.key === key);
            if (!module || !modulesVisible[module.key]) return null;
            return (
              <SortableItem
                key={module.key}
                module={module}
                toggleSymbolsList={toggleSymbolsList}
                toggleModuleVisibility={toggleModuleVisibility}
                isLocked={isLocked}
              />
            );
          })}
        </SortableContext>
      </div>
    </DndContext>
  );
};

export default DashboardDnDWrapper;
