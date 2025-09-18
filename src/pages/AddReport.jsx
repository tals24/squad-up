
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User } from "@/api/entities";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Save,
  Star,
  Eye,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { airtableSync } from "@/api/functions";
import { searchAllPlayers } from "@/api/functions";
import ConfirmationToast from "../components/ConfirmationToast";
import { Combobox } from "@/components/ui/combobox";
import { useData } from "../components/DataContext";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


export default function AddReport() {
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get('playerId');
  const gameId = searchParams.get('gameId');

  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { users, teams, isLoading: isContextLoading } = useData();
  const [selectedTeam, setSelectedTeam] = useState('all');

  const isScoutReport = !gameId;
  const reportType = isScoutReport ? "Scout Report" : "Game Report";

  const [formData, setFormData] = useState({
    Player: playerId ? [playerId] : [],
    Date: new Date().toISOString().split('T')[0],
    EventType: reportType,
    GeneralRating: 3,
    MinutesPlayed: isScoutReport ? undefined : 0,
    Goals: isScoutReport ? undefined : 0,
    Assists: isScoutReport ? undefined : 0,
    GeneralNotes: ""
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  // For player search combobox
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [playerSearchResults, setPlayerSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [kitNumber, setKitNumber] = useState('');
  const debouncedSearchTerm = useDebounce(playerSearchTerm, 300);

  const { filteredTeamsForDropdown } = useMemo(() => {
    // If teams or user data are not loaded yet, return empty array
    if (!teams.length || !currentUser || !users.length) {
      return { filteredTeamsForDropdown: [] };
    }

    // For Scout Reports: ALL users can see ALL teams.
    // This is different from the "My Players" page which is role-restricted.
    // Scout reports are meant to be global assessments.
    if (isScoutReport) {
      return { filteredTeamsForDropdown: teams };
    }

    // For Game Reports (not Scout Reports), apply existing role-based filtering
    if (currentUser.role === 'admin') {
      return { filteredTeamsForDropdown: teams };
    }

    const airtableUser = users.find(u => u.Email && u.Email.toLowerCase() === currentUser.email.toLowerCase());
    if (!airtableUser) {
      return { filteredTeamsForDropdown: [] };
    }

    const airtableRole = airtableUser.Role;
    let fTeams = [];

    if (airtableRole === 'Coach' && airtableUser.id) {
      fTeams = teams.filter(team => team.Coach && team.Coach.includes(airtableUser.id));
    } else if (airtableRole === 'Division Manager' && airtableUser.Department) {
      fTeams = teams.filter(team => team.Division === airtableUser.Department);
    } else {
        fTeams = teams; // Fallback to all teams if no specific role logic matches
    }

    return { filteredTeamsForDropdown: fTeams };
  }, [currentUser, users, teams, isScoutReport]);


  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            await User.me().then(setCurrentUser);
            if (playerId) {
                const response = await airtableSync({ action: 'fetchSingle', tableName: 'Players', recordId: playerId });
                if (response.data?.record) {
                    setSelectedPlayerDetails(response.data.record);
                }
            }
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
        setIsLoading(false);
    };
    loadInitialData();
  }, [playerId]);

  useEffect(() => {
    // We search if the user is typing a name, OR if they have selected a team, OR if they entered a kit number.
    const shouldSearch = (debouncedSearchTerm || (selectedTeam && selectedTeam !== 'all') || kitNumber);

    if (shouldSearch && isScoutReport) {
      setIsSearching(true);
      searchAllPlayers({
        searchTerm: debouncedSearchTerm,
        teamId: selectedTeam,
        kitNumber: kitNumber
      }).then(({ data }) => {
        setPlayerSearchResults(data?.records || []);
        setIsSearching(false);
      });
    } else {
      setPlayerSearchResults([]);
    }
  }, [debouncedSearchTerm, isScoutReport, selectedTeam, kitNumber]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let recordData = {
        Player: formData.Player,
        Date: formData.Date,
        EventType: reportType,
        GeneralRating: parseInt(formData.GeneralRating) || 3,
        GeneralNotes: formData.GeneralNotes || ""
      };

      if (!isScoutReport) {
        recordData.MinutesPlayed = parseInt(formData.MinutesPlayed) || 0;
        recordData.Goals = parseInt(formData.Goals) || 0;
        recordData.Assists = parseInt(formData.Assists) || 0;
        if (gameId) {
          recordData.Game = [gameId];
        }
      }

      const response = await airtableSync({
        action: 'create',
        tableName: 'TimelineEvents',
        recordData: recordData
      });

      if (response.data?.success) {
        setConfirmationConfig({
          type: 'success',
          title: `${reportType} Added Successfully!`,
          message: `${reportType} has been saved.`
        });
        setShowConfirmation(true);
        setTimeout(() => {
            const redirectUrl = playerId ? `Player?id=${playerId}` : gameId ? `GameDetails?id=${gameId}` : "Dashboard";
            window.location.href = createPageUrl(redirectUrl);
        }, 2000);
      } else {
        throw new Error(response.data?.details || 'Failed to add report');
      }
    } catch (error) {
      console.error("Error adding report:", error);
      setConfirmationConfig({
        type: 'error',
        title: `Failed to Add ${reportType}`,
        message: `An error occurred: ${error.message}. Please try again.`
      });
      setShowConfirmation(true);
    }
    setIsSaving(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlayerSelect = (value) => {
    handleChange('Player', value ? [value] : []);
    const player = playerSearchResults.find(p => p.id === value);
    if(player) setPlayerSearchTerm(player.FullName);
  };

  if (isLoading || isContextLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto animate-pulse space-y-6">
            <div className="h-8 bg-bg-secondary rounded w-1/3"></div>
            <div className="h-96 bg-bg-secondary rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 md:p-8 bg-bg-primary min-h-screen relative">
        {/* Ambient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>

        <div className="max-w-2xl mx-auto space-y-8 relative">
          <div className="flex items-center gap-4">
            <Link to={gameId ? createPageUrl(`GameDetails?id=${gameId}`) : playerId ? createPageUrl(`Player?id=${playerId}`) : createPageUrl("Dashboard")}>
              <Button variant="outline" size="icon" className="border-border-custom text-text-primary hover:bg-bg-secondary hover:border-accent-primary transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                Add New <span className="text-accent-primary">{reportType}</span>
              </h1>
              <p className="text-text-secondary text-lg font-mono">
                {isScoutReport
                  ? "Create a scouting evaluation for any player"
                  : `Game report for ${selectedPlayerDetails?.FullName || 'player'}`
                }
              </p>
            </div>
          </div>

          <Card className="shadow-2xl border border-accent-primary/20 bg-bg-secondary/70 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

            <CardHeader className="border-b border-border-custom/50 relative">
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0"></div>
              <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
                {isScoutReport ? <Eye className="w-6 h-6 text-accent-primary" /> : <Star className="w-6 h-6 text-warning" />}
                <span className="text-accent-primary">{reportType} Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {isScoutReport ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="team-filter" className="text-text-primary font-medium">Team</Label>
                                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                                    <SelectTrigger className="bg-bg-secondary border-border-custom text-text-primary focus:border-accent-primary focus:ring-accent-primary/20">
                                    <SelectValue placeholder="All Teams" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-bg-secondary border-border-custom text-text-primary">
                                    <SelectItem value="all" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">All Teams</SelectItem>
                                    {filteredTeamsForDropdown.map(team => (
                                        <SelectItem key={team.id} value={team.id} className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">
                                        {team.TeamName || team.Name}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="kit-number" className="text-text-primary font-medium">Kit #</Label>
                                <Input
                                    id="kit-number"
                                    type="number"
                                    placeholder="e.g. 10"
                                    value={kitNumber}
                                    onChange={(e) => setKitNumber(e.target.value)}
                                    className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-accent-primary/20"
                                />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="player" className="text-text-primary font-medium">Player *</Label>
                            <Combobox
                              options={playerSearchResults.map(p => ({ value: p.id, label: `${p.FullName} (#${p.KitNumber || 'N/A'})` }))}
                              value={formData.Player[0]}
                              onValueChange={handlePlayerSelect}
                              onInputChange={setPlayerSearchTerm}
                              placeholder="Select team or search by name..."
                              inputValue={playerSearchTerm}
                              loading={isSearching}
                            />
                          </div>
                        </>
                    ) : (
                         <div className="space-y-2">
                            <Label htmlFor="playerName" className="text-text-primary font-medium">Player</Label>
                            <Input id="playerName" value={selectedPlayerDetails?.FullName || ''} disabled className="bg-bg-secondary border-border-custom text-text-secondary" />
                        </div>
                    )}

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-text-primary font-medium">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.Date}
                      onChange={(e) => handleChange('Date', e.target.value)}
                      className="bg-bg-secondary border-border-custom text-text-primary focus:border-accent-primary focus:ring-accent-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating" className="text-text-primary font-medium">General Rating *</Label>
                    <Select value={formData.GeneralRating.toString()} onValueChange={(value) => handleChange('GeneralRating', parseInt(value))}>
                      <SelectTrigger className="bg-bg-secondary border-border-custom text-text-primary focus:border-accent-primary focus:ring-accent-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-bg-secondary border-border-custom text-text-primary">
                        <SelectItem value="1" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">1 Star</SelectItem>
                        <SelectItem value="2" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">2 Stars</SelectItem>
                        <SelectItem value="3" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">3 Stars</SelectItem>
                        <SelectItem value="4" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">4 Stars</SelectItem>
                        <SelectItem value="5" className="text-text-primary focus:bg-bg-secondary hover:bg-bg-secondary">5 Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {!isScoutReport && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="minutes" className="text-text-primary font-medium">Minutes Played</Label>
                        <Input id="minutes" type="number" min="0" max="120" value={formData.MinutesPlayed || ''} onChange={(e) => handleChange('MinutesPlayed', e.target.value)} className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-accent-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goals" className="text-text-primary font-medium">Goals</Label>
                        <Input id="goals" type="number" min="0" value={formData.Goals || ''} onChange={(e) => handleChange('Goals', e.target.value)} className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-accent-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assists" className="text-text-primary font-medium">Assists</Label>
                        <Input id="assists" type="number" min="0" value={formData.Assists || ''} onChange={(e) => handleChange('Assists', e.target.value)} className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-accent-primary/20" />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-text-primary font-medium">{isScoutReport ? "Scouting Notes" : "General Notes"}</Label>
                  <Textarea id="notes" value={formData.GeneralNotes} onChange={(e) => handleChange('GeneralNotes', e.target.value)} placeholder={isScoutReport ? "Strengths, areas for improvement..." : "Performance notes, feedback..."} className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-accent-primary/20 h-32" />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-border-custom">
                  <Link to={gameId ? createPageUrl(`GameDetails?id=${gameId}`) : playerId ? createPageUrl(`Player?id=${playerId}`) : createPageUrl("Dashboard")}>
                    <Button variant="outline" className="border-border-custom text-text-primary hover:bg-bg-secondary hover:border-accent-primary transition-all duration-300">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={isSaving || formData.Player.length === 0} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-text-primary shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/30 transition-all duration-300">
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save {reportType}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmationToast isOpen={showConfirmation} onClose={() => setShowConfirmation(false)} {...confirmationConfig} />
    </>
  );
}
