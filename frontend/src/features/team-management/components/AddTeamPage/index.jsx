import React, { useState, useEffect } from 'react';
import { User } from '@/shared/api';
import { Trophy, Shield, Calendar, Users } from 'lucide-react';
import { createTeam } from '@/features/team-management/api';
import { getUsers } from '@/features/user-management/api';
import GenericAddPage from '@/shared/components/GenericAddPage';
import { TextInputField, SelectField, FormGrid } from '@/shared/components/FormFields';

export default function AddTeam() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialFormData = {
    Name: '',
    Division: '',
    Season: '',
    Coach: '',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load users for coach selection
      console.log('🔄 Loading users for coach selection...');
      const usersResponse = await getUsers();
      console.log('📊 Users response:', usersResponse);

      if (usersResponse?.success && usersResponse?.data) {
        setUsers(usersResponse.data);
        console.log('✅ Loaded users:', usersResponse.data.length);

        // Log specifically for coaches
        const coaches = usersResponse.data.filter((user) => user.role === 'Coach');
        console.log('👥 Found coaches:', coaches.length, coaches);
      } else {
        console.error('❌ Failed to load users:', usersResponse);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (formData) => {
    try {
      console.log('🔄 Creating team with data:', formData);

      const teamData = {
        teamName: formData.Name,
        division: formData.Division,
        season: formData.Season,
        coach: formData.Coach || null,
      };

      console.log('📤 Sending team data to API:', teamData);
      const response = await createTeam(teamData);
      console.log('📊 Create team response:', response);

      if (response?.success) {
        return {
          success: true,
          message: `${formData.Name} has been created and is ready to start the season!`,
        };
      } else {
        throw new Error(response?.error || 'Failed to save team');
      }
    } catch (error) {
      console.error('❌ Error creating team:', error);
      throw new Error(error.message);
    }
  };

  const isFormValid = (formData) => {
    return formData.Name?.trim() && formData.Division?.trim() && formData.Season?.trim();
  };

  const divisionOptions = [
    { value: 'Senior Division', label: 'Senior Division' },
    { value: 'Middle Division', label: 'Middle Division' },
    { value: 'Youth Division', label: 'Youth Division' },
  ];

  // Create coach options from loaded users
  const coachOptions = users
    .filter((user) => user.role === 'Coach')
    .map((user) => ({
      value: user._id,
      label: user.fullName || user.email,
    }));

  console.log('👥 Available coaches:', coachOptions);

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
