import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RotateCcw, 
  Save, 
  Users, 
  Target, 
  Shield, 
  Zap, 
  TrendingUp,
  User,
  Plus,
  X
} from "lucide-react";

// Formation templates
const FORMATION_TEMPLATES = {
  '4-4-2': {
    name: '4-4-2',
    description: 'Classic balanced formation',
    positions: [
      { id: 'gk', x: 50, y: 10, position: 'Goalkeeper', required: true },
      { id: 'lb', x: 20, y: 30, position: 'Defender', required: true },
      { id: 'cb1', x: 40, y: 30, position: 'Defender', required: true },
      { id: 'cb2', x: 60, y: 30, position: 'Defender', required: true },
      { id: 'rb', x: 80, y: 30, position: 'Defender', required: true },
      { id: 'lm', x: 20, y: 50, position: 'Midfielder', required: true },
      { id: 'cm1', x: 40, y: 50, position: 'Midfielder', required: true },
      { id: 'cm2', x: 60, y: 50, position: 'Midfielder', required: true },
      { id: 'rm', x: 80, y: 50, position: 'Midfielder', required: true },
      { id: 'st1', x: 40, y: 70, position: 'Forward', required: true },
      { id: 'st2', x: 60, y: 70, position: 'Forward', required: true }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    description: 'Attacking formation with wing-backs',
    positions: [
      { id: 'gk', x: 50, y: 10, position: 'Goalkeeper', required: true },
      { id: 'cb1', x: 30, y: 30, position: 'Defender', required: true },
      { id: 'cb2', x: 50, y: 30, position: 'Defender', required: true },
      { id: 'cb3', x: 70, y: 30, position: 'Defender', required: true },
      { id: 'lwb', x: 15, y: 50, position: 'Defender', required: true },
      { id: 'cm1', x: 35, y: 50, position: 'Midfielder', required: true },
      { id: 'cm2', x: 50, y: 50, position: 'Midfielder', required: true },
      { id: 'cm3', x: 65, y: 50, position: 'Midfielder', required: true },
      { id: 'rwb', x: 85, y: 50, position: 'Defender', required: true },
      { id: 'st1', x: 40, y: 70, position: 'Forward', required: true },
      { id: 'st2', x: 60, y: 70, position: 'Forward', required: true }
    ]
  },
  '4-3-3': {
    name: '4-3-3',
    description: 'Attacking formation with wide forwards',
    positions: [
      { id: 'gk', x: 50, y: 10, position: 'Goalkeeper', required: true },
      { id: 'lb', x: 20, y: 30, position: 'Defender', required: true },
      { id: 'cb1', x: 40, y: 30, position: 'Defender', required: true },
      { id: 'cb2', x: 60, y: 30, position: 'Defender', required: true },
      { id: 'rb', x: 80, y: 30, position: 'Defender', required: true },
      { id: 'cm1', x: 30, y: 50, position: 'Midfielder', required: true },
      { id: 'cm2', x: 50, y: 50, position: 'Midfielder', required: true },
      { id: 'cm3', x: 70, y: 50, position: 'Midfielder', required: true },
      { id: 'lw', x: 20, y: 70, position: 'Forward', required: true },
      { id: 'st', x: 50, y: 70, position: 'Forward', required: true },
      { id: 'rw', x: 80, y: 70, position: 'Forward', required: true }
    ]
  },
  '5-3-2': {
    name: '5-3-2',
    description: 'Defensive formation with three center-backs',
    positions: [
      { id: 'gk', x: 50, y: 10, position: 'Goalkeeper', required: true },
      { id: 'lwb', x: 15, y: 30, position: 'Defender', required: true },
      { id: 'cb1', x: 35, y: 30, position: 'Defender', required: true },
      { id: 'cb2', x: 50, y: 30, position: 'Defender', required: true },
      { id: 'cb3', x: 65, y: 30, position: 'Defender', required: true },
      { id: 'rwb', x: 85, y: 30, position: 'Defender', required: true },
      { id: 'cm1', x: 30, y: 50, position: 'Midfielder', required: true },
      { id: 'cm2', x: 50, y: 50, position: 'Midfielder', required: true },
      { id: 'cm3', x: 70, y: 50, position: 'Midfielder', required: true },
      { id: 'st1', x: 40, y: 70, position: 'Forward', required: true },
      { id: 'st2', x: 60, y: 70, position: 'Forward', required: true }
    ]
  }
};

const FormationEditor = ({ 
  gameRoster = [], 
  onFormationChange, 
  onSave, 
  isReadOnly = false 
}) => {
  const canvasRef = useRef(null);
  const [selectedFormation, setSelectedFormation] = useState('4-4-2');
  const [formation, setFormation] = useState([]);
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Initialize formation from template
  useEffect(() => {
    const template = FORMATION_TEMPLATES[selectedFormation];
    if (template) {
      const newFormation = template.positions.map(pos => ({
        ...pos,
        player: null,
        playerId: null
      }));
      setFormation(newFormation);
    }
  }, [selectedFormation]);

  // Get available players (not already assigned)
  const getAvailablePlayers = useCallback(() => {
    const assignedPlayerIds = formation
      .filter(pos => pos.player)
      .map(pos => pos.playerId);
    
    return gameRoster.filter(roster => {
      const playerId = roster.player?._id || roster.player?.id;
      return !assignedPlayerIds.includes(playerId);
    });
  }, [formation, gameRosters]);

  // Get position icon
  const getPositionIcon = (position) => {
    switch (position) {
      case 'Goalkeeper':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'Defender':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'Midfielder':
        return <Zap className="w-4 h-4 text-green-400" />;
      case 'Forward':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      default:
        return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  // Get position color
  const getPositionColor = (position) => {
    switch (position) {
      case 'Goalkeeper':
        return 'bg-purple-500/20 border-purple-400';
      case 'Defender':
        return 'bg-blue-500/20 border-blue-400';
      case 'Midfielder':
        return 'bg-green-500/20 border-green-400';
      case 'Forward':
        return 'bg-red-500/20 border-red-400';
      default:
        return 'bg-slate-500/20 border-slate-400';
    }
  };

  // Handle formation template change
  const handleFormationChange = (newFormation) => {
    setSelectedFormation(newFormation);
    const template = FORMATION_TEMPLATES[newFormation];
    if (template) {
      const newFormationData = template.positions.map(pos => ({
        ...pos,
        player: null,
        playerId: null
      }));
      setFormation(newFormationData);
      onFormationChange?.(newFormationData);
    }
  };

  // Handle player drag start
  const handlePlayerDragStart = (e, player) => {
    if (isReadOnly) return;
    
    setDraggedPlayer(player);
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle canvas drag over
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle canvas drop
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    if (!draggedPlayer || isReadOnly) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Find closest position
    let closestPos = null;
    let minDistance = Infinity;

    formation.forEach((pos, index) => {
      const distance = Math.sqrt(
        Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPos = index;
      }
    });

    if (closestPos !== null) {
      const newFormation = [...formation];
      const playerId = draggedPlayer.player?._id || draggedPlayer.player?.id;
      const playerName = draggedPlayer.player?.fullName || draggedPlayer.player?.FullName || 'Unknown';
      
      // Remove player from any existing position
      newFormation.forEach(pos => {
        if (pos.playerId === playerId) {
          pos.player = null;
          pos.playerId = null;
        }
      });
      
      // Assign player to new position
      newFormation[closestPos] = {
        ...newFormation[closestPos],
        player: draggedPlayer.player,
        playerId: playerId,
        playerName: playerName
      };
      
      setFormation(newFormation);
      onFormationChange?.(newFormation);
    }

    setDraggedPlayer(null);
    setIsDragging(false);
  };

  // Handle position click (remove player)
  const handlePositionClick = (index) => {
    if (isReadOnly) return;
    
    const newFormation = [...formation];
    newFormation[index] = {
      ...newFormation[index],
      player: null,
      playerId: null,
      playerName: null
    };
    
    setFormation(newFormation);
    onFormationChange?.(newFormation);
  };

  // Draw formation on canvas
  const drawFormation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pitch background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pitch lines
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Goal areas
    const goalWidth = canvas.width * 0.15;
    const goalHeight = canvas.height * 0.2;
    
    // Top goal
    ctx.strokeRect(canvas.width / 2 - goalWidth / 2, 0, goalWidth, goalHeight);
    
    // Bottom goal
    ctx.strokeRect(canvas.width / 2 - goalWidth / 2, canvas.height - goalHeight, goalWidth, goalHeight);
    
    // Draw positions
    formation.forEach((pos, index) => {
      const x = (pos.x / 100) * canvas.width;
      const y = (pos.y / 100) * canvas.height;
      
      // Position circle
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      
      if (pos.player) {
        // Filled circle for assigned position
        ctx.fillStyle = pos.position === 'Goalkeeper' ? '#8b5cf6' :
                       pos.position === 'Defender' ? '#3b82f6' :
                       pos.position === 'Midfielder' ? '#10b981' : '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
      } else {
        // Empty circle for unassigned position
        ctx.strokeStyle = pos.position === 'Goalkeeper' ? '#8b5cf6' :
                         pos.position === 'Defender' ? '#3b82f6' :
                         pos.position === 'Midfielder' ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
      }
      
      ctx.stroke();
      
      // Position label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(pos.id.toUpperCase(), x, y + 4);
      
      // Player name if assigned
      if (pos.player) {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Arial';
        const name = pos.playerName || 'Unknown';
        const maxWidth = 40;
        if (name.length > 8) {
          ctx.fillText(name.substring(0, 8) + '...', x, y + 20);
        } else {
          ctx.fillText(name, x, y + 20);
        }
      }
    });
  }, [formation]);

  // Redraw when formation changes
  useEffect(() => {
    drawFormation();
  }, [formation, drawFormation]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      drawFormation();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFormation]);

  return (
    <div className="space-y-4">
      {/* Formation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-semibold">Formation</span>
          </div>
          
          <Select
            value={selectedFormation}
            onValueChange={handleFormationChange}
            disabled={isReadOnly}
          >
            <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FORMATION_TEMPLATES).map(([key, template]) => (
                <SelectItem key={key} value={key}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge variant="outline" className="bg-slate-700/50 text-slate-400 border-slate-600">
            {FORMATION_TEMPLATES[selectedFormation]?.description}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleFormationChange(selectedFormation)}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            disabled={isReadOnly}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          
          {onSave && (
            <Button
              onClick={() => onSave(formation)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={isReadOnly}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Formation
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formation Canvas */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="w-full h-96 border border-slate-600 rounded-lg cursor-crosshair"
                  onDragOver={handleCanvasDragOver}
                  onDrop={handleCanvasDrop}
                  onClick={(e) => {
                    if (isReadOnly) return;
                    const canvas = canvasRef.current;
                    const rect = canvas.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    // Find clicked position
                    formation.forEach((pos, index) => {
                      const distance = Math.sqrt(
                        Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
                      );
                      if (distance < 5) {
                        handlePositionClick(index);
                      }
                    });
                  }}
                />
                
                {isDragging && (
                  <div className="absolute inset-0 bg-cyan-500/10 border-2 border-dashed border-cyan-400 rounded-lg flex items-center justify-center">
                    <div className="text-cyan-400 font-semibold">
                      Drop player on position
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Players */}
        <div className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-semibold">Available Players</span>
                <Badge variant="outline" className="bg-slate-700/50 text-slate-400 border-slate-600">
                  {getAvailablePlayers().length}
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {getAvailablePlayers().map((roster) => {
                  const player = roster.player || roster.Player?.[0];
                  const playerId = player?._id || player?.id;
                  const fullName = player?.fullName || player?.FullName || 'Unknown';
                  const kitNumber = player?.kitNumber || player?.KitNumber || '';
                  const position = player?.position || player?.Position || 'Unknown';
                  
                  return (
                    <div
                      key={playerId}
                      draggable={!isReadOnly}
                      onDragStart={(e) => handlePlayerDragStart(e, roster)}
                      className={`p-3 rounded-lg border cursor-move transition-all duration-200 ${
                        isReadOnly 
                          ? 'bg-slate-700/50 border-slate-600 cursor-not-allowed' 
                          : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700/70 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {kitNumber && (
                          <div className="w-6 h-6 bg-cyan-500/20 rounded text-xs flex items-center justify-center font-bold text-cyan-400">
                            {kitNumber}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{fullName}</p>
                          <div className="flex items-center gap-2">
                            {getPositionIcon(position)}
                            <span className="text-xs text-slate-400">{position}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {getAvailablePlayers().length === 0 && (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">All players assigned</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Formation Summary */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-semibold">Formation Summary</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].map(position => {
              const playersInPosition = formation.filter(pos => 
                pos.position === position && pos.player
              );
              
              return (
                <div key={position} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getPositionIcon(position)}
                    <span className="text-sm font-medium text-slate-300">{position}s</span>
                    <Badge variant="outline" className={`${getPositionColor(position)} text-xs`}>
                      {playersInPosition.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    {playersInPosition.map((pos, index) => (
                      <div key={index} className="text-xs text-slate-400 truncate">
                        {pos.playerName || 'Unknown'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormationEditor;
