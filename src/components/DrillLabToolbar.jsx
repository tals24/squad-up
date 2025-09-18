
import React from 'react';
import { Goal, ArrowRight, Waypoints, MousePointer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-bg-secondary/50 cursor-grab active:cursor-grabbing transition-colors duration-200 w-12 h-12"
      title={label}
    >
      <div className="flex items-center justify-center">
        <IconComponent />
      </div>
      <span className="text-xs text-text-primary font-medium text-center leading-none">{label}</span>
    </div>
  );
};

const ToolButtonItem = ({ tool, label, activeTool, onToolSelect, icon: IconComponent }) => (
  <Button
    onClick={() => onToolSelect(tool)}
    variant={activeTool === tool ? 'default' : 'ghost'}
    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg cursor-pointer transition-colors duration-200 w-12 h-12 ${
      activeTool === tool ? 'bg-accent-primary hover:bg-blue-600' : 'hover:bg-bg-secondary/50'
    }`}
    title={label}
  >
    <div className="flex items-center justify-center">
      <IconComponent className="w-4 h-4 text-text-primary" />
    </div>
    <span className="text-xs text-text-primary font-medium text-center leading-none">{label}</span>
  </Button>
);

// Improved Soccer Ball SVG Component
const SoccerBallSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
    <circle cx="12" cy="12" r="11" fill="white" stroke="black" strokeWidth="1"/>
    
    {/* Pentagon in center */}
    <path d="M12 6 L15.5 8.5 L14 12 L10 12 L8.5 8.5 Z" fill="black"/>
    
    {/* Top hexagons */}
    <path d="M12 6 L8.5 8.5 L6 6 L8 3 L12 4 Z" fill="white" stroke="black" strokeWidth="0.5"/>
    <path d="M12 6 L12 4 L16 3 L18 6 L15.5 8.5 Z" fill="white" stroke="black" strokeWidth="0.5"/>
    
    {/* Side hexagons */}
    <path d="M8.5 8.5 L10 12 L6 14 L3 11 L6 6 Z" fill="white" stroke="black" strokeWidth="0.5"/>
    <path d="M15.5 8.5 L18 6 L21 11 L18 14 L14 12 Z" fill="white" stroke="black" strokeWidth="0.5"/>
    
    {/* Bottom hexagons */}
    <path d="M10 12 L14 12 L16 16 L12 19 L8 16 Z" fill="white" stroke="black" strokeWidth="0.5"/>
  </svg>
);

export default function DrillLabToolbar({ activeTool, onToolSelect }) {
  const shapes = [
    { type: 'player-blue', label: 'Player', icon: () => <div className="w-5 h-5 bg-accent-primary rounded-full border-2 border-white shadow-lg"></div> },
    { type: 'opponent-red', label: 'Opponent', icon: () => <div className="w-5 h-5 bg-error rounded-full border-2 border-white shadow-lg"></div> },
    { type: 'cone-yellow', label: 'Cone', icon: () => <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '12px solid #eab308' }} className="drop-shadow-lg"></div> },
    { type: 'ball', label: 'Ball', icon: SoccerBallSVG },
    { type: 'goal', label: 'Goal', icon: () => <Goal className="w-5 h-5 text-text-primary drop-shadow-lg" /> },
  ];

  const tools = [
    { tool: 'select', label: 'Select', icon: MousePointer },
    { tool: 'pass-arrow', label: 'Pass', icon: ArrowRight },
    { tool: 'dribble-arrow', label: 'Dribble', icon: Waypoints },
    { tool: 'shoot-arrow', label: 'Shoot', icon: () => <div className="flex flex-col items-center"><div className="w-4 h-0.5 bg-white mb-0.5"></div><div className="w-4 h-0.5 bg-white"></div></div> },
    { tool: 'delete', label: 'Delete', icon: Trash2 },
  ];

  return (
    <div className="flex items-center gap-1">
      {tools.map(tool => (
        <ToolButtonItem key={tool.tool} {...tool} activeTool={activeTool} onToolSelect={onToolSelect} />
      ))}
      <div className="w-px h-6 bg-bg-secondary mx-1"></div>
      {shapes.map(shape => (
        <DraggableToolbarItem key={shape.type} {...shape} />
      ))}
    </div>
  );
}
