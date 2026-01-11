import React from 'react';
import DrillCanvas from '../DrillCanvas';
import { Loader2 } from 'lucide-react';

export default function DrillDesignerCanvas({
  initialElements,
  onElementsChange,
  isLoading,
  isReadOnly,
  activeTool,
}) {
  // Handle drag and drop from toolbar
  const handleDrop = (e) => {
    e.preventDefault();
    const shapeType = e.dataTransfer.getData('shape/type');
    const fromToolbar = e.dataTransfer.getData('fromToolbar');

    if (shapeType && fromToolbar === 'true') {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newElement = {
        id: Date.now(),
        type: shapeType,
        x,
        y,
        radius: shapeType === 'cone-yellow' ? 25 : 20,
        number: null,
      };

      const newElements = [...(initialElements || []), newElement];
      onElementsChange?.(newElements);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading drill canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-800/50 relative overflow-hidden min-h-0">
      <div className="absolute inset-0 w-full h-full">
        <DrillCanvas
          initialElements={initialElements}
          onElementsChange={onElementsChange}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          isReadOnly={isReadOnly}
          activeTool={activeTool}
        />
      </div>
    </div>
  );
}
