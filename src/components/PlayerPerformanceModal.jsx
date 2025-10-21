import React, { useState, useEffect } from 'react';
import { X, Target, Clock, Trophy, Zap, Shield, TrendingUp, Save, Edit } from 'lucide-react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/design-system-components';

const PlayerPerformanceModal = ({ 
  isOpen, 
  onClose, 
  player, 
  gameId, 
  onSave 
}) => {
  const [performance, setPerformance] = useState({
    minutesPlayed: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    saves: 0,
    passes: 0,
    passesCompleted: 0,
    shots: 0,
    shotsOnTarget: 0,
    tackles: 0,
    interceptions: 0,
    clearances: 0,
    rating: 0,
    notes: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing performance data when modal opens
  useEffect(() => {
    if (isOpen && player) {
      // TODO: Load existing performance data from API
      console.log('🎮 Loading performance for player:', player);
      // For now, reset to default values
      setPerformance({
        minutesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        passes: 0,
        passesCompleted: 0,
        shots: 0,
        shotsOnTarget: 0,
        tackles: 0,
        interceptions: 0,
        clearances: 0,
        rating: 0,
        notes: ''
      });
    }
  }, [isOpen, player]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save performance data to API
      console.log('🎮 Saving performance data:', performance);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave?.(performance);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving performance:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPerformance(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPerformanceStats = () => {
    const passAccuracy = performance.passes > 0 ? 
      Math.round((performance.passesCompleted / performance.passes) * 100) : 0;
    
    const shotAccuracy = performance.shots > 0 ? 
      Math.round((performance.shotsOnTarget / performance.shots) * 100) : 0;

    return {
      passAccuracy,
      shotAccuracy,
      totalActions: performance.passes + performance.tackles + performance.interceptions + performance.clearances
    };
  };

  const stats = getPerformanceStats();

  if (!isOpen || !player) return null;

  const playerName = player?.fullName || player?.FullName || 'Unknown Player';
  const kitNumber = player?.kitNumber || player?.KitNumber || '';
  const position = player?.position || player?.Position || 'Unknown';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                {kitNumber && (
                  <span className="text-2xl font-bold text-cyan-400">{kitNumber}</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{playerName}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
                    {position}
                  </Badge>
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500">
                    Performance Tracking
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Performance
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <Button
                onClick={onClose}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Performance Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Stats */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Basic Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Minutes Played</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.minutesPlayed}
                        onChange={(e) => handleInputChange('minutesPlayed', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                        max="90"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-white">{performance.minutesPlayed}'</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-slate-300">Overall Rating</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.rating}
                        onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                        max="10"
                        step="0.1"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-white">{performance.rating}/10</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goals & Assists */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Goals & Assists
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Goals</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.goals}
                        onChange={(e) => handleInputChange('goals', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-yellow-400">{performance.goals}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-slate-300">Assists</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.assists}
                        onChange={(e) => handleInputChange('assists', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-blue-400">{performance.assists}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passing Stats */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="w-5 h-5 text-green-400" />
                  Passing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Total Passes</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.passes}
                        onChange={(e) => handleInputChange('passes', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                      />
                    ) : (
                      <div className="text-xl font-bold text-white">{performance.passes}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-slate-300">Completed</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.passesCompleted}
                        onChange={(e) => handleInputChange('passesCompleted', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                      />
                    ) : (
                      <div className="text-xl font-bold text-white">{performance.passesCompleted}</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Pass Accuracy</Label>
                  <div className="text-lg font-bold text-green-400">{stats.passAccuracy}%</div>
                </div>
              </CardContent>
            </Card>

            {/* Defensive Stats */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-red-400" />
                  Defensive
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Tackles</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.tackles}
                        onChange={(e) => handleInputChange('tackles', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                      />
                    ) : (
                      <div className="text-xl font-bold text-white">{performance.tackles}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-slate-300">Interceptions</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.interceptions}
                        onChange={(e) => handleInputChange('interceptions', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                      />
                    ) : (
                      <div className="text-xl font-bold text-white">{performance.interceptions}</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Clearances</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={performance.clearances}
                      onChange={(e) => handleInputChange('clearances', parseInt(e.target.value) || 0)}
                      className="bg-slate-600 border-slate-500 text-white"
                      min="0"
                    />
                  ) : (
                    <div className="text-xl font-bold text-white">{performance.clearances}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shooting Stats */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-orange-400" />
                  Shooting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Total Shots</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.shots}
                        onChange={(e) => handleInputChange('shots', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                      />
                    ) : (
                      <div className="text-xl font-bold text-white">{performance.shots}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-slate-300">On Target</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.shotsOnTarget}
                        onChange={(e) => handleInputChange('shotsOnTarget', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                      />
                    ) : (
                      <div className="text-xl font-bold text-white">{performance.shotsOnTarget}</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Shot Accuracy</Label>
                  <div className="text-lg font-bold text-orange-400">{stats.shotAccuracy}%</div>
                </div>
              </CardContent>
            </Card>

            {/* Cards & Saves */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Cards & Saves
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Yellow Cards</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.yellowCards}
                        onChange={(e) => handleInputChange('yellowCards', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                        max="2"
                      />
                    ) : (
                      <div className="text-xl font-bold text-yellow-400">{performance.yellowCards}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-slate-300">Red Cards</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={performance.redCards}
                        onChange={(e) => handleInputChange('redCards', parseInt(e.target.value) || 0)}
                        className="bg-slate-600 border-slate-500 text-white"
                        min="0"
                        max="1"
                      />
                    ) : (
                      <div className="text-xl font-bold text-red-400">{performance.redCards}</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Saves (GK)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={performance.saves}
                      onChange={(e) => handleInputChange('saves', parseInt(e.target.value) || 0)}
                      className="bg-slate-600 border-slate-500 text-white"
                      min="0"
                    />
                  ) : (
                    <div className="text-xl font-bold text-white">{performance.saves}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Notes */}
          <Card className="bg-slate-700/50 border-slate-600 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Performance Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={performance.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full h-32 bg-slate-600 border border-slate-500 rounded-lg p-3 text-white placeholder-slate-400 resize-none"
                  placeholder="Add notes about the player's performance..."
                />
              ) : (
                <div className="text-slate-300">
                  {performance.notes || 'No notes added yet'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlayerPerformanceModal;
