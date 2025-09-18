import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import {
  User as UserIcon,
  Shield,
  Mail,
  Building,
  Phone,
  Lock
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
    Department: "",
    Password: "",
    ConfirmPassword: ""
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
      // Remove ConfirmPassword from submission data
      const { ConfirmPassword, ...submitData } = formData;
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          message: data.message || `${formData.FullName} has been added to the system and can now access SquadUp.`
        };
      } else {
        throw new Error(data.error || "Failed to save user");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const isFormValid = (formData) => {
    // All fields are required except Department when Role is "Department Manager"
    const requiredFields = {
      FullName: formData.FullName?.trim(),
      Email: formData.Email?.trim(),
      Role: formData.Role?.trim(),
      PhoneNumber: formData.PhoneNumber?.trim(),
      Password: formData.Password?.trim(),
      ConfirmPassword: formData.ConfirmPassword?.trim()
    };

    // Check if all required fields are filled
    const allRequiredFieldsFilled = Object.values(requiredFields).every(Boolean);

    // Department is required unless the role is "Department Manager"
    const isDepartmentRequired = formData.Role !== "Department Manager";
    const isDepartmentValid = !isDepartmentRequired || formData.Department?.trim();

    // Password validation
    const isPasswordValid = formData.Password && formData.Password.length >= 6;
    const doPasswordsMatch = formData.Password === formData.ConfirmPassword;

    return allRequiredFieldsFilled && isDepartmentValid && isPasswordValid && doPasswordsMatch;
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
      <FormGrid columns={1}>
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

        <TextInputField
          id="PhoneNumber"
          label="Phone Number"
          type="tel"
          placeholder="Enter phone number"
          required={true}
          icon={Phone}
          iconColor="text-brand-green-400"
        />

        <TextInputField
          id="Password"
          label="Password"
          type="password"
          placeholder="Enter password (min 6 characters)"
          required={true}
          icon={Lock}
          iconColor="text-brand-red-400"
        />

        <TextInputField
          id="ConfirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm password"
          required={true}
          icon={Lock}
          iconColor="text-brand-red-400"
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
          required={(formData) => formData?.Role !== "Department Manager"}
          options={departmentOptions}
          icon={Building}
          iconColor="text-brand-green-400"
        />
      </FormGrid>
    </GenericAddPage>
  );
}