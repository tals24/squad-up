import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Trophy,
  Users,
  Target,
  TrendingUp,
  Download,
  Save,
  Edit,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Textarea,
} from '@/shared/ui/primitives/design-system-components';

const MatchReportModal = ({ isOpen, onClose, game, gameRoster, formation, onSave }) => {
  const [report, setReport] = useState({
    matchSummary: '',
    keyMoments: [],
    teamPerformance: {
      overall: '',
      strengths: [],
      weaknesses: [],
      improvements: [],
    },
    individualHighlights: [],
    tacticalAnalysis: {
      formation: '',
      effectiveness: '',
      adjustments: [],
    },
    statistics: {
      possession: 50,
      shots: 0,
      shotsOnTarget: 0,
      passes: 0,
      passAccuracy: 0,
      tackles: 0,
      fouls: 0,
      corners: 0,
      offsides: 0,
    },
    recommendations: [],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // Load existing report data when modal opens
  useEffect(() => {
    if (isOpen && game) {
      console.log('🎮 Loading match report for game:', game);
      // TODO: Load existing report data from API
      // For now, initialize with default values
      setReport({
        matchSummary: '',
        keyMoments: [],
        teamPerformance: {
          overall: '',
          strengths: [],
          weaknesses: [],
          improvements: [],
        },
        individualHighlights: [],
        tacticalAnalysis: {
          formation: formation?.length > 0 ? 'Custom Formation' : 'No Formation Set',
          effectiveness: '',
          adjustments: [],
        },
        statistics: {
          possession: 50,
          shots: 0,
          shotsOnTarget: 0,
          passes: 0,
          passAccuracy: 0,
          tackles: 0,
          fouls: 0,
          corners: 0,
          offsides: 0,
        },
        recommendations: [],
      });
    }
  }, [isOpen, game, formation]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('🎮 Saving match report:', report);
      // TODO: Save report data to API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSave?.(report);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving match report:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setReport((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleArrayInputChange = (section, field, index, value) => {
    setReport((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].map((item, i) => (i === index ? value : item)),
      },
    }));
  };

  const addArrayItem = (section, field) => {
    setReport((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...prev[section][field], ''],
      },
    }));
  };

  const removeArrayItem = (section, field, index) => {
    setReport((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index),
      },
    }));
  };

  const getTeamStats = () => {
    const startingPlayers = gameRoster.filter((roster) => roster.status === 'Starting Lineup');
    const totalGoals = startingPlayers.reduce(
      (sum, roster) => sum + (roster.performance?.goals || 0),
      0
    );
    const totalAssists = startingPlayers.reduce(
      (sum, roster) => sum + (roster.performance?.assists || 0),
      0
    );
    const totalPasses = startingPlayers.reduce(
      (sum, roster) => sum + (roster.performance?.passes || 0),
      0
    );
    const totalTackles = startingPlayers.reduce(
      (sum, roster) => sum + (roster.performance?.tackles || 0),
      0
    );

    return {
      totalGoals,
      totalAssists,
      totalPasses,
      totalTackles,
      averageRating:
        startingPlayers.length > 0
          ? startingPlayers.reduce((sum, roster) => sum + (roster.performance?.rating || 0), 0) /
            startingPlayers.length
          : 0,
    };
  };

  const teamStats = getTeamStats();

  if (!isOpen || !game) return null;

  const gameTitle = game?.gameTitle || game?.GameTitle || 'Match Report';
  const gameDate = game?.date || game?.Date || new Date().toLocaleDateString();

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'tactics', label: 'Tactics', icon: Target },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{gameTitle}</h2>
              <p className="text-slate-400">Match Report - {gameDate}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Report
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Report'}
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

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 border-b border-slate-600">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white">Match Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={report.matchSummary}
                        onChange={(e) =>
                          setReport((prev) => ({ ...prev, matchSummary: e.target.value }))
                        }
                        className="w-full h-32 bg-slate-600 border border-slate-500 rounded-lg p-3 text-white placeholder-slate-400 resize-none"
                        placeholder="Describe the overall match, key events, and final outcome..."
                      />
                    ) : (
                      <div className="text-slate-300">
                        {report.matchSummary || 'No summary added yet'}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white">Key Moments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-2">
                        {report.keyMoments.map((moment, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={moment}
                              onChange={(e) =>
                                handleArrayInputChange('keyMoments', index, e.target.value)
                              }
                              className="bg-slate-600 border-slate-500 text-white"
                              placeholder="Describe a key moment..."
                            />
                            <Button
                              onClick={() => removeArrayItem('keyMoments', index)}
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => addArrayItem('keyMoments')}
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          + Add Moment
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {report.keyMoments.length > 0 ? (
                          report.keyMoments.map((moment, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs font-bold text-cyan-400 mt-1">
                                {index + 1}
                              </div>
                              <p className="text-slate-300">{moment}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500">No key moments recorded</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-cyan-400 mb-1">
                        {teamStats.totalGoals}
                      </div>
                      <div className="text-sm text-slate-400">Goals</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {teamStats.totalAssists}
                      </div>
                      <div className="text-sm text-slate-400">Assists</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">
                        {teamStats.totalPasses}
                      </div>
                      <div className="text-sm text-slate-400">Passes</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-1">
                        {teamStats.averageRating.toFixed(1)}
                      </div>
                      <div className="text-sm text-slate-400">Avg Rating</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white">Team Performance Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Overall Performance</Label>
                      {isEditing ? (
                        <Textarea
                          value={report.teamPerformance.overall}
                          onChange={(e) =>
                            handleInputChange('teamPerformance', 'overall', e.target.value)
                          }
                          className="w-full h-24 bg-slate-600 border border-slate-500 rounded-lg p-3 text-white placeholder-slate-400 resize-none"
                          placeholder="Overall team performance assessment..."
                        />
                      ) : (
                        <div className="text-slate-300 mt-2">
                          {report.teamPerformance.overall || 'No overall assessment added'}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Strengths</Label>
                        {isEditing ? (
                          <div className="space-y-2">
                            {report.teamPerformance.strengths.map((strength, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Input
                                  value={strength}
                                  onChange={(e) =>
                                    handleArrayInputChange(
                                      'teamPerformance',
                                      'strengths',
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className="bg-slate-600 border-slate-500 text-white"
                                  placeholder="Team strength..."
                                />
                                <Button
                                  onClick={() =>
                                    removeArrayItem('teamPerformance', 'strengths', index)
                                  }
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                            <Button
                              onClick={() => addArrayItem('teamPerformance', 'strengths')}
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              + Add Strength
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-1">
                            {report.teamPerformance.strengths.length > 0 ? (
                              report.teamPerformance.strengths.map((strength, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <span className="text-slate-300">{strength}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-slate-500">No strengths recorded</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-slate-300">Areas for Improvement</Label>
                        {isEditing ? (
                          <div className="space-y-2">
                            {report.teamPerformance.improvements.map((improvement, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Input
                                  value={improvement}
                                  onChange={(e) =>
                                    handleArrayInputChange(
                                      'teamPerformance',
                                      'improvements',
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className="bg-slate-600 border-slate-500 text-white"
                                  placeholder="Area for improvement..."
                                />
                                <Button
                                  onClick={() =>
                                    removeArrayItem('teamPerformance', 'improvements', index)
                                  }
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                            <Button
                              onClick={() => addArrayItem('teamPerformance', 'improvements')}
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              + Add Improvement
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-1">
                            {report.teamPerformance.improvements.length > 0 ? (
                              report.teamPerformance.improvements.map((improvement, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                  <span className="text-slate-300">{improvement}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-slate-500">No improvements recorded</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tactics Tab */}
            {activeTab === 'tactics' && (
              <div className="space-y-6">
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white">Tactical Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Formation Used</Label>
                      <div className="text-slate-300 mt-2">{report.tacticalAnalysis.formation}</div>
                    </div>

                    <div>
                      <Label className="text-slate-300">Formation Effectiveness</Label>
                      {isEditing ? (
                        <Textarea
                          value={report.tacticalAnalysis.effectiveness}
                          onChange={(e) =>
                            handleInputChange('tacticalAnalysis', 'effectiveness', e.target.value)
                          }
                          className="w-full h-24 bg-slate-600 border border-slate-500 rounded-lg p-3 text-white placeholder-slate-400 resize-none"
                          placeholder="How effective was the formation? What worked well?"
                        />
                      ) : (
                        <div className="text-slate-300 mt-2">
                          {report.tacticalAnalysis.effectiveness || 'No tactical analysis added'}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-slate-300">Tactical Adjustments</Label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {report.tacticalAnalysis.adjustments.map((adjustment, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={adjustment}
                                onChange={(e) =>
                                  handleArrayInputChange(
                                    'tacticalAnalysis',
                                    'adjustments',
                                    index,
                                    e.target.value
                                  )
                                }
                                className="bg-slate-600 border-slate-500 text-white"
                                placeholder="Tactical adjustment made..."
                              />
                              <Button
                                onClick={() =>
                                  removeArrayItem('tacticalAnalysis', 'adjustments', index)
                                }
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                          <Button
                            onClick={() => addArrayItem('tacticalAnalysis', 'adjustments')}
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            + Add Adjustment
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {report.tacticalAnalysis.adjustments.length > 0 ? (
                            report.tacticalAnalysis.adjustments.map((adjustment, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span className="text-slate-300">{adjustment}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-500">No tactical adjustments recorded</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-cyan-400 mb-1">
                        {report.statistics.possession}%
                      </div>
                      <div className="text-sm text-slate-400">Possession</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {report.statistics.shots}
                      </div>
                      <div className="text-sm text-slate-400">Shots</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">
                        {report.statistics.passAccuracy}%
                      </div>
                      <div className="text-sm text-slate-400">Pass Accuracy</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-400 mb-1">
                        {report.statistics.tackles}
                      </div>
                      <div className="text-sm text-slate-400">Tackles</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white">Match Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(report.statistics).map(([key, value]) => (
                          <div key={key}>
                            <Label className="text-slate-300 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                            <Input
                              type="number"
                              value={value}
                              onChange={(e) =>
                                setReport((prev) => ({
                                  ...prev,
                                  statistics: {
                                    ...prev.statistics,
                                    [key]: parseInt(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="bg-slate-600 border-slate-500 text-white"
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(report.statistics).map(([key, value]) => (
                          <div key={key} className="text-center p-3 bg-slate-600/50 rounded-lg">
                            <div className="text-lg font-bold text-white">{value}</div>
                            <div className="text-sm text-slate-400 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchReportModal;
