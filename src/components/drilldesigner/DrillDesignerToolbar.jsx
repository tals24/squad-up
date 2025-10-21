import React from 'react';
import { Button } from '@/shared/ui/primitives/button';
import { 
  Undo, 
  Redo, 
  Trash2, 
  Save, 
  ArrowLeft, 
  FileText,
  Goal,
  ArrowRight,
  Waypoints,
  MousePointer
} from 'lucide-react';

// Draggable Toolbar Item Component
const DraggableToolbarItem = ({ type, label, icon: IconComponent }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('shape/type', type);
    e.dataTransfer.setData('fromToolbar', 'true');
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable="true"
      onDragStart={handleDragStart}
      className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-slate-700/50 cursor-grab active:cursor-grabbing transition-colors duration-200 w-12 h-12"
      title={label}
    >
      <div className="flex items-center justify-center">
        <IconComponent />
      </div>
      <span className="text-xs text-slate-300 font-medium text-center leading-none">{label}</span>
    </div>
  );
};

// Tool Button Item Component
const ToolButtonItem = ({ tool, label, activeTool, onToolSelect, icon: IconComponent }) => (
  <Button
    onClick={() => onToolSelect(tool)}
    variant={activeTool === tool ? 'default' : 'ghost'}
    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg cursor-pointer transition-colors duration-200 w-12 h-12 ${
      activeTool === tool ? 'bg-cyan-600 hover:bg-cyan-700' : 'hover:bg-slate-700/50'
    }`}
    title={label}
  >
    <div className="flex items-center justify-center">
      <IconComponent className="w-4 h-4 text-slate-300" />
    </div>
    <span className="text-xs text-slate-300 font-medium text-center leading-none">{label}</span>
  </Button>
);

// Soccer Ball SVG Component
const SoccerBallSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
    <circle cx="12" cy="12" r="11" fill="white" stroke="black" strokeWidth="1"/>
    <path d="M12 6 L15.5 8.5 L14 12 L10 12 L8.5 8.5 Z" fill="black"/>
    <path d="M12 6 L8.5 8.5 L6 6 L8 3 L12 4 Z" fill="white" stroke="black" strokeWidth="0.5"/>
    <path d="M12 6 L12 4 L16 3 L18 6 L15.5 8.5 Z" fill="white" stroke="black" strokeWidth="0.5"/>
    <path d="M8.5 8.5 L10 12 L6 14 L3 11 L6 6 Z" fill="white" stroke="black" strokeWidth="0.5"/>
    <path d="M15.5 8.5 L18 6 L21 11 L18 14 L14 12 Z" fill="white" stroke="black" strokeWidth="0.5"/>
    <path d="M10 12 L14 12 L16 16 L12 19 L8 16 Z" fill="white" stroke="black" strokeWidth="0.5"/>
  </svg>
);

export default function DrillDesignerToolbar({
  // History controls
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  
  // Actions
  onSave,
  onClear,
  onBack,
  onDescription,
  
  // Drawing tools
  activeTool,
  onToolSelect,
  
  // States
  isSaving,
  isReadOnly,
  mode,
  
  // Loading state
  isLoading,
  
  // Dynamic back button
  backButtonText = "Back to Library",
  backButtonAction = onBack
}) {
  if (isLoading) {
    return (
      <div className="bg-slate-800/90 border-b border-slate-700 px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="animate-pulse flex items-center gap-4">
              <div className="h-8 bg-slate-700 rounded w-32"></div>
              <div className="h-8 bg-slate-700 rounded w-24"></div>
              <div className="h-8 bg-slate-700 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Define drawing tools
  const shapes = [
    { type: 'player-blue', label: 'Player', icon: () => <div className="w-5 h-5 bg-cyan-500 rounded-full border-2 border-white shadow-lg"></div> },
    { type: 'opponent-red', label: 'Opponent', icon: () => <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg"></div> },
    { type: 'cone-yellow', label: 'Cone', icon: () => <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '12px solid #eab308' }} className="drop-shadow-lg"></div> },
    { type: 'ball', label: 'Ball', icon: SoccerBallSVG },
    { type: 'goal', label: 'Goal', icon: () => <Goal className="w-5 h-5 text-slate-300 drop-shadow-lg" /> },
  ];

  const tools = [
    { tool: 'select', label: 'Select', icon: MousePointer },
    { tool: 'pass-arrow', label: 'Pass', icon: ArrowRight },
    { tool: 'dribble-arrow', label: 'Dribble', icon: Waypoints },
    { tool: 'shoot-arrow', label: 'Shoot', icon: () => <div className="flex flex-col items-center"><div className="w-4 h-0.5 bg-white mb-0.5"></div><div className="w-4 h-0.5 bg-white"></div></div> },
    { tool: 'delete', label: 'Delete', icon: Trash2 },
  ];

  return (
    <div className="bg-slate-800/90 border-b border-slate-700 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Drawing Tools */}
            {!isReadOnly && (
              <>
                <div className="flex items-center gap-1">
                  {tools.map(tool => (
                    <ToolButtonItem key={tool.tool} {...tool} activeTool={activeTool} onToolSelect={onToolSelect} />
                  ))}
                </div>
                <div className="w-px h-8 bg-slate-600 mx-2"></div>
                <div className="flex items-center gap-1">
                  {shapes.map(shape => (
                    <DraggableToolbarItem key={shape.type} {...shape} />
                  ))}
                </div>
                <div className="w-px h-8 bg-slate-600 mx-2"></div>
              </>
            )}

            {/* History Controls */}
            <Button
              onClick={onUndo}
              variant="outline"
              size="sm"
              disabled={!canUndo || isReadOnly}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-50 bg-slate-800 hover:bg-slate-700"
            >
              <Undo className="w-4 h-4" />
            </Button>

            <Button
              onClick={onRedo}
              variant="outline"
              size="sm"
              disabled={!canRedo || isReadOnly}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-50 bg-slate-800 hover:bg-slate-700"
            >
              <Redo className="w-4 h-4" />
            </Button>

            {!isReadOnly && <div className="w-px h-8 bg-slate-600 mx-2"></div>}

            {/* Description Button (only in edit mode) */}
            {mode !== 'create' && (
              <Button 
                onClick={onDescription} 
                variant="outline" 
                size="sm"
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white bg-slate-800"
              >
                <FileText className="w-4 h-4 mr-2" />
                Description
              </Button>
            )}

            {/* Save Button (only when not read-only) */}
            {!isReadOnly && (
              <Button 
                onClick={onSave} 
                variant="outline" 
                size="sm"
                disabled={isSaving}
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white disabled:opacity-50 bg-slate-800"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}

            {/* Clear Button (only when not read-only) */}
            {!isReadOnly && (
              <>
                <div className="w-px h-8 bg-slate-600 mx-2"></div>
                <Button 
                  onClick={onClear} 
                  variant="outline" 
                  size="icon"
                  disabled={isReadOnly}
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-50 bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Back Button */}
          <Button 
            onClick={backButtonAction}
            variant="outline" 
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 bg-slate-800 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
