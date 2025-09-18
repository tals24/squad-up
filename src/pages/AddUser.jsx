import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import {
  User as UserIcon,
  Shield,
  Mail,
  Building
} from "lucide-react";
import { airtableSync } from "@/api/functions";
import GenericAddPage from "../components/GenericAddPage";
import { TextInputField, SelectField, FormGrid } from "../components/FormFields";

export default function AddUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const initialFormData = {
    FullName: "",
    Email: "",
    Role: "Coach",
    PhoneNumber: "",
    Department: ""
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await airtableSync({
        action: 'create',
        tableName: 'Users',
        recordData: {
          ...formData,
          PhoneNumber: formData.PhoneNumber || undefined,
          Department: formData.Department || undefined
        }
      });

      if (response.data?.success) {
        return {
          success: true,
          message: `${formData.FullName} has been added to the system and can now access SquadUp.`
        };
      } else {
        throw new Error(response.data?.error || "Failed to save user");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const isFormValid = (formData) => {
    return formData.FullName?.trim() && formData.Email?.trim();
  };

  const roleOptions = [
    { value: "Coach", label: "Coach" },
    { value: "Division Manager", label: "Division Manager" },
    { value: "Department Manager", label: "Department Manager" }
  ];

  const departmentOptions = [
    { value: "Senior Division", label: "Senior Division" },
    { value: "Middle Division", label: "Middle Division" },
    { value: "Youth Division", label: "Youth Division" }
  ];

  return (
    <GenericAddPage
      entityName="User"
      entityDisplayName="User"
      description="Create a new user account"
      icon={Shield}
      titleIcon={UserIcon}
      titleColor="text-brand-blue"
      backUrl="Dashboard"
      initialFormData={initialFormData}
      onSubmit={handleSubmit}
      isFormValid={isFormValid}
      isLoading={isLoading}
    >
      <FormGrid columns={2}>
        <TextInputField
          id="FullName"
          label="Full Name"
                      placeholder="Enter full name"
          required={true}
          icon={UserIcon}
          iconColor="text-brand-blue"
        />

        <TextInputField
          id="Email"
          label="Email"
                      type="email"
                      placeholder="Enter email address"
          required={true}
          icon={Mail}
          iconColor="text-brand-blue-400"
        />

        <SelectField
          id="Role"
          label="Role"
          placeholder="Select role"
          required={true}
          options={roleOptions}
          icon={Shield}
          iconColor="text-brand-purple-400"
        />

        <SelectField
          id="Department"
          label="Department"
          placeholder="Select department"
          options={departmentOptions}
          icon={Building}
          iconColor="text-brand-green-400"
        />
      </FormGrid>
    </GenericAddPage>
  );
}