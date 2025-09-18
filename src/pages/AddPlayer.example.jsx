import React from "react";
import {
  User as UserIcon,
  Shield,
  Calendar,
  Hash,
  Trophy
} from "lucide-react";
import { airtableSync } from "@/api/functions";
import GenericAddPage from "../components/GenericAddPage";
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";

/**
 * Example: AddPlayer page using the GenericAddPage template
 * This demonstrates how easy it is to create new "Add" pages
 */
export default function AddPlayer() {
  const initialFormData = {
    FullName: "",
    Position: "",
    KitNumber: "",
    DateOfBirth: "",
    Team: ""
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await airtableSync({
        action: 'create',
        tableName: 'Players',
        recordData: formData
      });

      if (response.data?.success) {
        return {
          success: true,
          message: `${formData.FullName} has been added to the squad successfully!`
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

  const teamOptions = [
    { value: "team1", label: "Senior Team" },
    { value: "team2", label: "Youth Team" },
    { value: "team3", label: "Academy Team" }
  ];

  return (
    <GenericAddPage
      entityName="Player"
      entityDisplayName="Player"
      description="Add a new player to the squad"
      icon={Trophy}
      titleIcon={UserIcon}
      titleColor="text-brand-green"
      backUrl="Players"
      initialFormData={initialFormData}
      onSubmit={handleSubmit}
      isFormValid={isFormValid}
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
          required={false}
          icon={Calendar}
          iconColor="text-brand-green-400"
        />

        <FormGrid columns={1}>
          <SelectField
            id="Team"
            label="Team"
            placeholder="Select team"
            options={teamOptions}
            icon={Trophy}
            iconColor="text-brand-red-400"
          />
        </FormGrid>
      </FormGrid>
    </GenericAddPage>
  );
}
