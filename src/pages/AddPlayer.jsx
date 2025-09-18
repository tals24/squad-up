import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import {
  User as UserIcon,
  Shield,
  Calendar,
  Hash,
  Trophy,
  Target
} from "lucide-react";
import { airtableSync } from "@/api/functions";
import GenericAddPage from "../components/GenericAddPage";
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";

export default function AddPlayer() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialFormData = {
    FullName: "",
    KitNumber: "",
    DateOfBirth: "",
    Position: "",
    Team: "",
    ProfileImageURL: ""
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // Load teams for team selection
      const teamsResponse = await airtableSync({ action: 'fetch', tableName: 'Teams' });
      if (teamsResponse.data?.records) {
        setTeams(teamsResponse.data.records);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await airtableSync({
        action: 'create',
        tableName: 'Players',
        recordData: {
          ...formData,
          Team: formData.Team ? [formData.Team] : undefined,
          DateOfBirth: formData.DateOfBirth || undefined,
          ProfileImageURL: formData.ProfileImageURL || undefined,
        }
      });

      if (response.data?.success) {
        return {
          success: true,
          message: `${formData.FullName} has been added to the squad and is now ready to start training!`
        };
      } else {
        throw new Error(response.data?.error || "Failed to save player");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const isFormValid = (formData) => {
    return formData.FullName?.trim() && 
           formData.Position?.trim() && 
           formData.KitNumber?.trim();
  };

  const positionOptions = [
    { value: "Goalkeeper", label: "Goalkeeper" },
    { value: "Defender", label: "Defender" },
    { value: "Midfielder", label: "Midfielder" },
    { value: "Forward", label: "Forward" }
  ];

  // Create team options from loaded teams
  const teamOptions = teams.map(team => ({
    value: team.id,
    label: team.TeamName || team.Name
  }));

  return (
    <GenericAddPage
      entityName="Player"
      entityDisplayName="Player"
      description="Add a new player to the squad"
      icon={Target}
      titleIcon={UserIcon}
      titleColor="text-brand-green"
      backUrl="Players"
      initialFormData={initialFormData}
      onSubmit={handleSubmit}
      isFormValid={isFormValid}
      isLoading={isLoading}
    >
      <FormGrid columns={2}>
        <TextInputField
          id="FullName"
          label="Full Name"
          placeholder="Enter player's full name"
          required={true}
          icon={UserIcon}
          iconColor="text-brand-blue"
        />

        <TextInputField
          id="KitNumber"
          label="Kit Number"
          type="number"
          placeholder="Enter kit number"
          required={true}
          icon={Hash}
          iconColor="text-brand-yellow"
        />

        <SelectField
          id="Position"
          label="Position"
          placeholder="Select position"
          required={true}
          options={positionOptions}
          icon={Shield}
          iconColor="text-brand-purple-400"
        />

        <TextInputField
          id="DateOfBirth"
          label="Date of Birth"
          type="date"
          icon={Calendar}
          iconColor="text-brand-green-400"
        />

        <SelectField
          id="Team"
          label="Team"
          placeholder="Select team"
          options={teamOptions}
          icon={Trophy}
          iconColor="text-brand-red-400"
        />

        <TextInputField
          id="ProfileImageURL"
          label="Profile Image URL"
          placeholder="Enter image URL (optional)"
          icon={UserIcon}
          iconColor="text-brand-blue-400"
        />
      </FormGrid>
    </GenericAddPage>
  );
}