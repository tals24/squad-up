import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Clock,
  Target
} from "lucide-react";
import { getTeams, createGame } from "@/api/functions";
import { getSeasonFromDate } from "@/utils/seasonUtils";
import GenericAddPage from "../components/GenericAddPage";
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";

export default function AddGame() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialFormData = {
    Date: "",
    Time: "",
    Venue: "Home", // Changed from Location to Venue with default Home
    Opponent: "",
    Team: "",
    GameType: "League",
    Status: "Scheduled"
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // Load teams for team selection using MongoDB backend
      const teamsResponse = await getTeams();
      if (teamsResponse.data?.success && teamsResponse.data?.data) {
        setTeams(teamsResponse.data.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (formData) => {
    try {
      // Combine date and time for the DateTime field
      const gameDateTime = formData.Date && formData.Time 
        ? `${formData.Date}T${formData.Time}:00.000Z`
        : undefined;

      // Find the selected team to get team name
      const selectedTeam = teams.find(team => team.id === formData.Team);
      const teamName = selectedTeam?.TeamName || selectedTeam?.Name || 'Our Team';
      
      // Auto-generate game title: "Team Name vs Opponent"
      const gameTitle = `${teamName} vs ${formData.Opponent}`;
      
      // Auto-detect season based on game date
      const season = getSeasonFromDate(gameDateTime);

      const gameData = {
        team: formData.Team || null,
        opponent: formData.Opponent || null,
        date: gameDateTime,
        location: formData.Venue || 'Home', // Changed from venue to location
        gameType: formData.GameType || 'League',
        status: formData.Status || 'Scheduled',
        gameTitle: gameTitle, // Auto-generated title
        season: season // Auto-detected season
      };

      const response = await createGame(gameData);

      if (response.data?.success) {
        return {
          success: true,
          message: `${gameTitle} has been scheduled successfully for the ${season} season!`
        };
      } else {
        throw new Error(response.data?.error || "Failed to save game");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const isFormValid = (formData) => {
    return formData.Date?.trim() && 
           formData.Opponent?.trim() &&
           formData.Team?.trim();
  };

  const gameTypeOptions = [
    { value: "League", label: "League Match" },
    { value: "Cup", label: "Cup Match" },
    { value: "Friendly", label: "Friendly Match" },
    { value: "Training", label: "Training Match" },
    { value: "Tournament", label: "Tournament" }
  ];

  const statusOptions = [
    { value: "Scheduled", label: "Scheduled" },
    { value: "Postponed", label: "Postponed" },
    { value: "Cancelled", label: "Cancelled" }
  ];

  const venueOptions = [
    { value: "Home", label: "Home" },
    { value: "Away", label: "Away" }
  ];

  // Create team options from loaded teams
  const teamOptions = teams.map(team => ({
    value: team.id,
    label: team.TeamName || team.Name
  }));

  return (
    <GenericAddPage
      entityName="Game"
      entityDisplayName="Game"
      description="Schedule a new game or match"
      icon={Trophy}
      titleIcon={Trophy}
      titleColor="text-brand-red"
      backUrl="GamesSchedule"
      initialFormData={initialFormData}
      onSubmit={handleSubmit}
      isFormValid={isFormValid}
      isLoading={isLoading}
    >
      {/* Game Title is auto-generated from Team + Opponent */}

      <FormGrid columns={2}>
        <TextInputField
          id="Date"
          label="Date"
          type="date"
          required={true}
          icon={Calendar}
          iconColor="text-brand-green-400"
        />

        <TextInputField
          id="Time"
          label="Time"
          type="time"
          placeholder="15:00"
          icon={Clock}
          iconColor="text-brand-blue-400"
        />

        <TextInputField
          id="Opponent"
          label="Opponent"
          placeholder="Enter opponent team name"
          required={true}
          icon={Target}
          iconColor="text-brand-red-400"
        />

        <SelectField
          id="Venue"
          label="Venue"
          placeholder="Select venue"
          options={venueOptions}
          icon={MapPin}
          iconColor="text-brand-purple-400"
        />

        <SelectField
          id="Team"
          label="Our Team"
          placeholder="Select team"
          required={true}
          options={teamOptions}
          icon={Users}
          iconColor="text-brand-blue"
        />

        <SelectField
          id="GameType"
          label="Game Type"
          placeholder="Select game type"
          options={gameTypeOptions}
          icon={Trophy}
          iconColor="text-brand-yellow"
        />
      </FormGrid>

      <FormGrid columns={1}>
        <SelectField
          id="Status"
          label="Status"
          placeholder="Select status"
          options={statusOptions}
          icon={Calendar}
          iconColor="text-brand-green"
        />
      </FormGrid>
    </GenericAddPage>
  );
}
