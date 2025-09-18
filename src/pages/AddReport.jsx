import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/api/entities";
import { useSearchParams } from "react-router-dom";
import {
  Eye,
  Star,
  Calendar,
  Trophy,
  Target,
  Hash,
  Clock,
  Search
} from "lucide-react";
import { airtableSync, searchAllPlayers } from "@/api/functions";
import GenericAddPage from "../components/GenericAddPage";
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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

  const { users, teams, players, isLoading: isContextLoading } = useData();
  const [selectedTeam, setSelectedTeam] = useState('all');

  const isScoutReport = !gameId;
  const reportType = isScoutReport ? "Scout Report" : "Game Report";

  const initialFormData = {
    Player: playerId ? [playerId] : [],
    Date: new Date().toISOString().split('T')[0],
    EventType: reportType,
    GeneralRating: 3,
    MinutesPlayed: isScoutReport ? undefined : 0,
    Goals: isScoutReport ? undefined : 0,
    Assists: isScoutReport ? undefined : 0,
    GeneralNotes: ""
  };

  // For player search
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [playerSearchResults, setPlayerSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(playerSearchTerm, 300);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!playerId && debouncedSearchTerm.length >= 2) {
      searchPlayers(debouncedSearchTerm);
    } else if (debouncedSearchTerm.length < 2) {
      setPlayerSearchResults([]);
    }
  }, [debouncedSearchTerm, playerId]);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // If we have a playerId, load the player details
      if (playerId && players.length > 0) {
        const player = players.find(p => p.id === playerId);
        if (player) {
          setSelectedPlayerDetails(player);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(isContextLoading);
  };

  const searchPlayers = async (searchTerm) => {
    if (!searchTerm?.trim()) return;

    setIsSearching(true);
    try {
      const response = await searchAllPlayers({ searchTerm });
      if (response.data?.success && response.data.players) {
        setPlayerSearchResults(response.data.players);
      }
    } catch (error) {
      console.error("Error searching players:", error);
    }
    setIsSearching(false);
  };

  const handleSubmit = async (formData) => {
    try {
      // Ensure we have a player selected
      if (!formData.Player || formData.Player.length === 0) {
        throw new Error("Please select a player for the report");
      }

      const response = await airtableSync({
        action: 'create',
        tableName: 'TimelineEvents',
        recordData: {
          ...formData,
          GeneralRating: parseInt(formData.GeneralRating) || 3,
          MinutesPlayed: formData.MinutesPlayed ? parseInt(formData.MinutesPlayed) : undefined,
          Goals: formData.Goals ? parseInt(formData.Goals) : undefined,
          Assists: formData.Assists ? parseInt(formData.Assists) : undefined,
        }
      });

      if (response.data?.success) {
        const playerName = selectedPlayerDetails?.FullName || "Player";
        return {
          success: true,
          message: `${reportType} for ${playerName} has been saved successfully!`
        };
      } else {
        throw new Error(response.data?.error || "Failed to save report");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const isFormValid = (formData) => {
    return formData.Player?.length > 0 && 
           formData.Date?.trim() && 
           formData.GeneralNotes?.trim();
  };

  const backUrl = gameId ? `GameDetails?id=${gameId}` : "Players";

  return (
    <GenericAddPage
      entityName="Report"
      entityDisplayName={reportType}
      description={`Create a new ${reportType.toLowerCase()}`}
      icon={Eye}
      titleIcon={isScoutReport ? Eye : Trophy}
      titleColor={isScoutReport ? "text-brand-purple" : "text-brand-green"}
      backUrl={backUrl}
      initialFormData={initialFormData}
      onSubmit={handleSubmit}
      isFormValid={isFormValid}
      isLoading={isLoading}
    >
      <FormGrid columns={1}>
        {/* Player Selection */}
        {!playerId && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <Search className="w-4 h-4 text-brand-blue" />
              Search Player *
            </Label>
            <div className="relative">
              <Input
                value={playerSearchTerm}
                onChange={(e) => setPlayerSearchTerm(e.target.value)}
                placeholder="Type player name to search..."
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {playerSearchResults.length > 0 && (
              <div className="border border-border rounded-lg bg-card max-h-48 overflow-y-auto">
                {playerSearchResults.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlayerDetails(player);
                      setPlayerSearchTerm(player.FullName);
                      setPlayerSearchResults([]);
                    }}
                    className="w-full p-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {player.KitNumber || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{player.FullName}</div>
                      <div className="text-sm text-muted-foreground">{player.Position}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Player Display */}
        {selectedPlayerDetails && (
          <div className="bg-accent/20 border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold">
                {selectedPlayerDetails.KitNumber || '?'}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{selectedPlayerDetails.FullName}</h3>
                <p className="text-muted-foreground">{selectedPlayerDetails.Position}</p>
              </div>
            </div>
          </div>
        )}
      </FormGrid>

      <FormGrid columns={2}>
        <TextInputField
          id="Date"
          label="Date"
          type="date"
          required={true}
          icon={Calendar}
          iconColor="text-brand-green-400"
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
                className={`p-2 ${rating <= 3 ? 'text-brand-yellow' : 'text-muted'}`}
              >
                <Star className="w-6 h-6 fill-current" />
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
        <div className="space-y-2">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-purple" />
            Report Notes *
          </Label>
          <Textarea
            placeholder={`Enter detailed ${reportType.toLowerCase()} notes...`}
            className="h-32 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
          />
        </div>
      </FormGrid>
    </GenericAddPage>
  );
}