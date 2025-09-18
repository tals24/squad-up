import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import {
  Trophy,
  Shield,
  Calendar,
  Users
} from "lucide-react";
import { airtableSync } from "@/api/functions";
import GenericAddPage from "../components/GenericAddPage";
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";

export default function AddTeam() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialFormData = {
    Name: "",
    Division: "",
    Season: "",
    Coach: ""
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load users for coach selection
      const usersResponse = await airtableSync({ action: 'fetch', tableName: 'Users' });
      if (usersResponse.data?.records) {
        setUsers(usersResponse.data.records);
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
        tableName: 'Teams',
        recordData: {
          TeamName: formData.Name,
          Division: formData.Division,
          Season: formData.Season,
          Coach: formData.Coach ? [formData.Coach] : undefined,
        }
      });

      if (response.data?.success) {
        return {
          success: true,
          message: `${formData.Name} has been created and is ready to start the season!`
        };
      } else {
        throw new Error(response.data?.error || "Failed to save team");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const isFormValid = (formData) => {
    return formData.Name?.trim() && 
           formData.Division?.trim() && 
           formData.Season?.trim();
  };

  const divisionOptions = [
    { value: "Senior Division", label: "Senior Division" },
    { value: "Middle Division", label: "Middle Division" },
    { value: "Youth Division", label: "Youth Division" }
  ];

  // Create coach options from loaded users
  const coachOptions = users
    .filter(user => user.Role === 'Coach')
    .map(user => ({
      value: user.UserID || user.id,
      label: user.FullName || user.Email
    }));

  return (
    <GenericAddPage
      entityName="Team"
      entityDisplayName="Team"
      description="Create a new team"
      icon={Trophy}
      titleIcon={Trophy}
      titleColor="text-brand-yellow"
      backUrl="Dashboard"
      initialFormData={initialFormData}
      onSubmit={handleSubmit}
      isFormValid={isFormValid}
      isLoading={isLoading}
    >
      <FormGrid columns={2}>
        <TextInputField
          id="Name"
          label="Team Name"
          placeholder="Enter team name"
          required={true}
          icon={Trophy}
          iconColor="text-brand-yellow"
        />

        <SelectField
          id="Division"
          label="Division"
          placeholder="Select division"
          required={true}
          options={divisionOptions}
          icon={Shield}
          iconColor="text-brand-blue"
        />

        <TextInputField
          id="Season"
          label="Season"
          placeholder="e.g., 2024-2025"
          required={true}
          icon={Calendar}
          iconColor="text-brand-green-400"
        />

        <SelectField
          id="Coach"
          label="Coach"
          placeholder="Select coach"
          options={coachOptions}
          icon={Users}
          iconColor="text-brand-purple-400"
        />
      </FormGrid>
    </GenericAddPage>
  );
}