import React, { useState, useEffect } from 'react';
import { User } from '@/shared/api';
import { User as UserIcon, Shield, Calendar, Hash, Trophy, Target } from 'lucide-react';
import { getTeams } from '@/features/team-management/api';
import { createPlayer } from '@/features/player-management/api';
import GenericAddPage from '@/shared/components/GenericAddPage';
import { TextInputField, SelectField, FormGrid } from '@/shared/components/FormFields';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';

export default function AddPlayer() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialFormData = {
    FullName: '',
    KitNumber: '',
    DateOfBirth: '',
    Position: '',
    Team: '',
    ProfileImageURL: '',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load teams for team selection
      const teamsResponse = await getTeams();
      if (teamsResponse?.success && teamsResponse?.data) {
        setTeams(teamsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (formData) => {
    try {
      const playerData = {
        fullName: formData.Name,
        team: formData.Team || null,
        position: formData.Position,
        jerseyNumber: formData.JerseyNumber ? parseInt(formData.JerseyNumber) : null,
        dateOfBirth: formData.DateOfBirth || null,
        height: formData.Height ? parseFloat(formData.Height) : null,
        weight: formData.Weight ? parseFloat(formData.Weight) : null,
        preferredFoot: formData.PreferredFoot || null,
        nationality: formData.Nationality || null,
        phoneNumber: formData.PhoneNumber || null,
        email: formData.Email || null,
        emergencyContact: formData.EmergencyContact || null,
        emergencyPhone: formData.EmergencyPhone || null,
        medicalConditions: formData.MedicalConditions || null,
        notes: formData.Notes || null,
      };

      const response = await createPlayer(playerData);

      if (response?.success) {
        return {
          success: true,
          message: `${formData.Name} has been added to the squad and is now ready to start training!`,
        };
      } else {
        throw new Error(response?.error || 'Failed to save player');
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const isFormValid = (formData) => {
    return formData.FullName?.trim() && formData.Position?.trim() && formData.KitNumber?.trim();
  };

  const positionOptions = [
    { value: 'Goalkeeper', label: 'Goalkeeper' },
    { value: 'Defender', label: 'Defender' },
    { value: 'Midfielder', label: 'Midfielder' },
    { value: 'Forward', label: 'Forward' },
  ];

  // Create team options from loaded teams
  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.TeamName || team.Name,
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

        <div className="space-y-2 w-48">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-green-400" />
            Date of Birth *
          </Label>
          <div className="relative">
            <Input
              id="DateOfBirth"
              type="date"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 hover:bg-accent/50 transition-colors text-left"
              style={{ paddingLeft: '20px', paddingRight: '12px' }}
              required={true}
            />
            <button
              type="button"
              className="absolute left-1 top-1/2 transform -translate-y-1/2 p-0 hover:bg-accent/20 rounded transition-colors"
              onClick={() => document.getElementById('DateOfBirth').showPicker?.()}
            >
              <Calendar className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

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
