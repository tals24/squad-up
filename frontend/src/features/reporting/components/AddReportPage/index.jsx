import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from '@/shared/api';
import { useSearchParams } from 'react-router-dom';
import {
  Eye,
  Star,
  Calendar,
  Trophy,
  Target,
  Hash,
  Clock,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';
import { createScoutReport } from '@/features/reporting/api';
import GenericAddPage from '@/shared/components/GenericAddPage';
import {
  TextInputField,
  SelectField,
  TextareaField,
  FormGrid,
} from '@/shared/components/FormFields';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/primitives/select';
import { Textarea } from '@/shared/ui/primitives/textarea';
import { Button } from '@/shared/ui/primitives/button';
import { useData } from '@/app/providers/DataProvider';

export default function AddReport() {
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get('playerId');
  const gameId = searchParams.get('gameId');
  const fromPage = searchParams.get('from');

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { users, teams, players, isLoading: isContextLoading } = useData();
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [isPlayerPreSelected, setIsPlayerPreSelected] = useState(false);

  const isScoutReport = !gameId;
  const reportType = isScoutReport ? 'Scout Report' : 'Game Report';

  const initialFormData = {
    Date: new Date().toISOString().split('T')[0],
    EventType: reportType,
    GeneralRating: 3,
    MinutesPlayed: isScoutReport ? undefined : 0,
    Goals: isScoutReport ? undefined : 0,
    Assists: isScoutReport ? undefined : 0,
    GeneralNotes: '',
  };

  // For player search - using client-side filtering
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState(null);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [kitNumber, setKitNumber] = useState('');
  const [selectedRating, setSelectedRating] = useState(3);
  const dropdownRef = useRef(null);

  // Efficient filtering with useMemo
  const filteredPlayers = useMemo(() => {
    let filtered = players;

    // Filter by team if not 'all'
    if (selectedTeam !== 'all') {
      filtered = filtered.filter((player) => player.team && player.team._id === selectedTeam);
    }

    // Filter by position if not 'all'
    if (selectedPosition !== 'all') {
      filtered = filtered.filter((player) => player.position === selectedPosition);
    }

    // Filter by kit number if not empty (exact match)
    if (kitNumber.trim()) {
      filtered = filtered.filter(
        (player) => player.kitNumber && player.kitNumber.toString() === kitNumber.trim()
      );
    }

    // Filter by search term if not empty
    if (playerSearch.trim()) {
      filtered = filtered.filter((player) =>
        player.fullName.toLowerCase().includes(playerSearch.toLowerCase())
      );
    }

    // Limit results to 50 for performance
    return filtered.slice(0, 50);
  }, [players, selectedTeam, selectedPosition, kitNumber, playerSearch]);

  useEffect(() => {
    loadData();
  }, []);

  // Pre-select player when coming from player page
  useEffect(() => {
    if (playerId && players.length > 0 && !selectedPlayerDetails) {
      const preSelectedPlayer = players.find((p) => p._id === playerId);

      if (preSelectedPlayer) {
        setSelectedPlayerDetails(preSelectedPlayer);
        setPlayerSearch(preSelectedPlayer.fullName);
        setIsPlayerPreSelected(true);

        // Set the team filter to the player's team
        if (preSelectedPlayer.team) {
          setSelectedTeam(preSelectedPlayer.team._id);
        }
      }
    }
  }, [playerId, players, selectedPlayerDetails]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPlayerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(isContextLoading);
  };

  const handleSubmit = async (formData) => {
    try {
      // Ensure we have a player selected
      if (!selectedPlayerDetails) {
        throw new Error('Please select a player for the report');
      }

      const reportData = {
        player: selectedPlayerDetails._id,
        title: formData.Title || null,
        content: formData.Content || null,
        generalRating: selectedRating,
        notes: formData.GeneralNotes || null,
        date: formData.Date || new Date().toISOString().split('T')[0], // Use form date or default to today
        game: null, // Scout reports don't require a specific game
      };

      const response = await createScoutReport(reportData);

      if (response?.success) {
        const playerName = selectedPlayerDetails?.fullName || 'Player';
        return {
          success: true,
          message: `${reportType} for ${playerName} has been saved successfully!`,
        };
      } else {
        throw new Error(response?.error || 'Failed to save report');
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const isFormValid = (formData) => {
    const isValid = selectedPlayerDetails && formData.GeneralNotes?.trim();

    // Debug logging
    console.log('Form validation:', {
      selectedPlayerDetails: !!selectedPlayerDetails,
      notes: formData.GeneralNotes?.trim(),
      isValid,
    });

    return isValid;
  };

  // Determine back URL based on context
  const getBackUrl = () => {
    if (gameId) return `GameDetails?id=${gameId}`;
    if (fromPage === 'Player' && playerId) return `Player?id=${playerId}`;
    if (fromPage) return fromPage;

    // Check if we came from Dashboard by looking at referrer
    const referrer = document.referrer;
    if (referrer && referrer.includes('/dashboard')) {
      return 'Dashboard';
    }

    // Default to Players for other cases
    return 'Players';
  };

  const backUrl = getBackUrl();

  return (
    <GenericAddPage
      entityName="Report"
      entityDisplayName={reportType}
      description={`Create a new ${reportType.toLowerCase()}`}
      icon={Eye}
      titleIcon={isScoutReport ? Eye : Trophy}
      titleColor={isScoutReport ? 'text-brand-purple' : 'text-brand-green'}
      backUrl={backUrl}
      initialFormData={initialFormData}
      onSubmit={handleSubmit}
      isFormValid={isFormValid}
      isLoading={isLoading}
    >
      <FormGrid columns={1}>
        {/* Team Selection */}
        {!playerId && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand-green" />
              Team (Optional)
            </Label>
            <Select
              value={selectedTeam}
              onValueChange={(newValue) => {
                setSelectedTeam(newValue);
                // Clear selected player and other filters when team changes
                setSelectedPlayerDetails(null);
                setPlayerSearch('');
                setSelectedPosition('all');
                setKitNumber('');
                setShowPlayerDropdown(false);
              }}
            >
              <SelectTrigger className="bg-background border-border text-foreground focus:border-ring focus:ring-ring/20 hover:bg-accent/50 transition-colors">
                <SelectValue placeholder="Select a team to filter players..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.teamName} ({team.season})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Player Selection Filters */}
        <div className="space-y-4">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-blue" />
            Search Player *
          </Label>

          {/* Pre-selected Player Display */}
          {isPlayerPreSelected && selectedPlayerDetails && (
            <div className="p-4 border border-border rounded-lg bg-card/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold">
                  {selectedPlayerDetails.kitNumber || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    {selectedPlayerDetails.fullName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    #{selectedPlayerDetails.kitNumber} • {selectedPlayerDetails.position}
                    {selectedPlayerDetails.team && (
                      <span className="ml-1">({selectedPlayerDetails.team.teamName})</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-cyan-400 font-medium">
                  Pre-selected from player page
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar - only show when not pre-selected */}
          {!isPlayerPreSelected && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Position Filter */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Position</Label>
                  <Select
                    value={selectedPosition}
                    onValueChange={(newValue) => {
                      setSelectedPosition(newValue);
                      setSelectedPlayerDetails(null);
                      setPlayerSearch('');
                      setShowPlayerDropdown(false);
                    }}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground focus:border-ring focus:ring-ring/20 hover:bg-accent/50 transition-colors">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground">
                      <SelectItem value="all">All Positions</SelectItem>
                      <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                      <SelectItem value="Defender">Defender</SelectItem>
                      <SelectItem value="Midfielder">Midfielder</SelectItem>
                      <SelectItem value="Forward">Forward</SelectItem>
                      <SelectItem value="Wing-back">Wing-back</SelectItem>
                      <SelectItem value="Striker">Striker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Kit Number Filter */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Kit Number</Label>
                  <Input
                    value={kitNumber}
                    onChange={(e) => {
                      setKitNumber(e.target.value);
                      setSelectedPlayerDetails(null);
                      setPlayerSearch('');
                      setShowPlayerDropdown(false);
                    }}
                    placeholder="Exact number"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 hover:bg-accent/50 transition-colors"
                  />
                </div>

                {/* Player Search */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Player Name</Label>
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <Input
                        value={playerSearch}
                        onChange={(e) => {
                          setPlayerSearch(e.target.value);
                          setShowPlayerDropdown(true);
                        }}
                        onFocus={() => setShowPlayerDropdown(true)}
                        onClick={() => setShowPlayerDropdown(true)}
                        placeholder="Type player name to search..."
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 pr-20"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        {selectedPlayerDetails && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlayerDetails(null);
                              setPlayerSearch('');
                              setShowPlayerDropdown(false);
                            }}
                            className="p-1 hover:bg-accent rounded-full transition-colors pointer-events-auto"
                            title="Remove selected player"
                          >
                            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
                          className="p-1 hover:bg-accent rounded-full transition-colors pointer-events-auto cursor-pointer"
                          title="Toggle player list"
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </div>
                    {showPlayerDropdown && (
                      <div className="absolute z-10 w-full mt-1 border border-border rounded-lg bg-card max-h-48 overflow-y-auto shadow-lg">
                        {filteredPlayers.length > 0 ? (
                          filteredPlayers.map((player) => (
                            <button
                              key={player._id}
                              type="button"
                              onClick={() => {
                                setSelectedPlayerDetails(player);
                                setPlayerSearch(player.fullName);
                                setShowPlayerDropdown(false);
                              }}
                              className="w-full py-1.5 px-2 text-left hover:bg-accent transition-colors flex items-center gap-2 text-sm"
                            >
                              <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {player.kitNumber || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">
                                  {player.fullName}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  #{player.kitNumber} • {player.position}
                                  {player.team && (
                                    <span className="ml-1">({player.team.teamName})</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="py-1.5 px-2 text-muted-foreground text-center text-sm">
                            {playerSearch.trim() || selectedPosition !== 'all' || kitNumber.trim()
                              ? 'No players found'
                              : 'Start typing to search players...'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(selectedPosition !== 'all' || kitNumber.trim() || playerSearch.trim()) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPosition('all');
                      setKitNumber('');
                      setPlayerSearch('');
                      setSelectedPlayerDetails(null);
                      setShowPlayerDropdown(false);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </FormGrid>

      <FormGrid columns={2}>
        <TextInputField
          id="Date"
          label="Date"
          type="date"
          icon={Calendar}
          iconColor="text-brand-green-400"
          width="w-48"
          required={true}
        />

        <div className="space-y-2">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Star className="w-4 h-4 text-brand-yellow" />
            Rating (1-5) *
          </Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRating(rating)}
                className={`p-2 transition-colors hover:bg-accent/20 ${
                  rating <= selectedRating
                    ? 'text-brand-yellow'
                    : 'text-muted-foreground hover:text-brand-yellow/70'
                }`}
              >
                <Star className={`w-6 h-6 ${rating <= selectedRating ? 'fill-current' : ''}`} />
              </Button>
            ))}
          </div>
        </div>

        {/* Game Report specific fields */}
        {!isScoutReport && (
          <>
            <TextInputField
              id="MinutesPlayed"
              label="Minutes Played"
              type="number"
              placeholder="90"
              icon={Clock}
              iconColor="text-brand-green-400"
            />

            <TextInputField
              id="Goals"
              label="Goals"
              type="number"
              placeholder="0"
              icon={Trophy}
              iconColor="text-brand-blue"
            />

            <TextInputField
              id="Assists"
              label="Assists"
              type="number"
              placeholder="0"
              icon={Target}
              iconColor="text-brand-purple"
            />
          </>
        )}
      </FormGrid>

      <FormGrid columns={1}>
        <TextareaField
          id="GeneralNotes"
          label="Report Notes"
          placeholder={`Enter detailed ${reportType.toLowerCase()} notes...`}
          icon={Eye}
          iconColor="text-brand-purple"
          required={true}
        />
      </FormGrid>
    </GenericAddPage>
  );
}
