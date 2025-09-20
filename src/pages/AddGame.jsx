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
import GenericAddPage from "../components/GenericAddPage";
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";

export default function AddGame() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialFormData = {
    GameTitle: "",
    Date: "",
    Time: "",
    Location: "",
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

      const gameData = {
        team: formData.Team || null,
        opponent: formData.Opponent || null,
        date: gameDateTime,
        venue: formData.Location || null,
        type: formData.GameType || 'Friendly',
        status: formData.Status || 'Scheduled',
        title: formData.GameTitle || null
      };

      const response = await createGame(gameData);

      if (response.data?.success) {
        return {
          success: true,
          message: `${formData.GameTitle} has been scheduled successfully!`
        };
      } else {
        throw new Error(response.data?.error || "Failed to save game");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const isFormValid = (formData) => {
    return formData.GameTitle?.trim() && 
           formData.Date?.trim() && 
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
      <FormGrid columns={1}>
        <TextInputField
          id="GameTitle"
          label="Game Title"
          placeholder="e.g., vs Manchester United - Premier League"
          required={true}
          icon={Trophy}
          iconColor="text-brand-red"
        />
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

        <TextInputField
          id="Location"
          label="Location"
          placeholder="Stadium or venue name"
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
