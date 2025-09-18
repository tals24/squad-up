import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FormContainer,
  FormSection,
  FormGrid,
  FormField,
  Input,
  Select,
  FormAlert
} from "@/components/ui/design-system-components";
import { airtableSync } from "@/api/functions";
import ConfirmationToast from "../components/ConfirmationToast";
import { User as UserIcon, Calendar, Hash, Users, Camera, AlertCircle, CheckCircle } from "lucide-react";

export default function AddPlayerUnified() {
  const [currentUser, setCurrentUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    FullName: "",
    KitNumber: "",
    DateOfBirth: "",
    Position: "",
    Team: "",
    ProfileImageURL: ""
  });
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const teamsResponse = await airtableSync({ action: 'fetch', tableName: 'Teams' });
      if (teamsResponse.data?.records) {
        setTeams(teamsResponse.data.records);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setSubmitStatus('error');
    }
    setIsLoading(false);
  };

  const positions = [
    'Goalkeeper',
    'Centre-back',
    'Left-back',
    'Right-back',
    'Defensive midfielder',
    'Central midfielder',
    'Attacking midfielder',
    'Left winger',
    'Right winger',
    'Centre-forward',
    'Striker'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.FullName.trim()) {
      newErrors.FullName = "Full name is required";
    }
    
    if (!formData.KitNumber) {
      newErrors.KitNumber = "Kit number is required";
    } else if (isNaN(formData.KitNumber) || parseInt(formData.KitNumber) < 1 || parseInt(formData.KitNumber) > 999) {
      newErrors.KitNumber = "Kit number must be between 1-999";
    }
    
    if (!formData.DateOfBirth) {
      newErrors.DateOfBirth = "Date of birth is required";
    }
    
    if (!formData.Position) {
      newErrors.Position = "Position is required";
    }
    
    if (!formData.Team) {
      newErrors.Team = "Team is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }

    setIsSaving(true);
    setSubmitStatus(null);
    
    try {
      const playerData = {
        ...formData,
        KitNumber: parseInt(formData.KitNumber)
      };

      const response = await airtableSync({ 
        action: 'create', 
        tableName: 'Players',
        data: playerData
      });

      if (response.success) {
        setSubmitStatus('success');
        setConfirmationConfig({
          message: `Player "${formData.FullName}" has been successfully added!`,
          type: 'success',
          redirectUrl: createPageUrl('Players'),
          redirectText: 'Go to Players'
        });
        setShowConfirmation(true);
        
        // Reset form
        setFormData({
          FullName: "",
          KitNumber: "",
          DateOfBirth: "",
          Position: "",
          Team: "",
          ProfileImageURL: ""
        });
        setErrors({});
      } else {
        throw new Error(response.error || 'Failed to save player');
      }
    } catch (error) {
      console.error("Error saving player:", error);
      setSubmitStatus('error');
      setConfirmationConfig({
        message: `Error adding player: ${error.message}`,
        type: 'error'
      });
      setShowConfirmation(true);
    }
    
    setIsSaving(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCancel = () => {
    window.location.href = createPageUrl('Players');
  };

  if (isLoading) {
    return (
      <FormContainer title="Add New Player" description="Please wait while we load the form...">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </FormContainer>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <FormContainer 
        title="Add New Player" 
        description="Enter the player's information to add them to your team"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Status Alerts */}
          {submitStatus === 'success' && (
            <FormAlert variant="success" title="Player Added Successfully!">
              The player has been successfully added to your team.
            </FormAlert>
          )}
          
          {submitStatus === 'error' && Object.keys(errors).length > 0 && (
            <FormAlert variant="error" title="Please fix the following errors:">
              <ul className="mt-2 list-disc list-inside space-y-1">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </FormAlert>
          )}

          {/* Basic Information Section */}
          <FormSection 
            title="Personal Information"
            description="Basic details about the player"
          >
            <FormGrid columns={2} gap="md">
              <FormField 
                label="Full Name" 
                required
                error={errors.FullName}
              >
                <Input
                  type="text"
                  placeholder="Enter player's full name"
                  value={formData.FullName}
                  onChange={(e) => handleChange('FullName', e.target.value)}
                  error={errors.FullName}
                />
              </FormField>

              <FormField 
                label="Date of Birth" 
                required
                error={errors.DateOfBirth}
              >
                <Input
                  type="date"
                  value={formData.DateOfBirth}
                  onChange={(e) => handleChange('DateOfBirth', e.target.value)}
                  error={errors.DateOfBirth}
                />
              </FormField>
            </FormGrid>
          </FormSection>

          {/* Team Information Section */}
          <FormSection 
            title="Team Information"
            description="Player's team assignment and position details"
          >
            <FormGrid columns={2} gap="md">
              <FormField 
                label="Team" 
                required
                error={errors.Team}
              >
                <Select
                  value={formData.Team}
                  onChange={(e) => handleChange('Team', e.target.value)}
                  placeholder="Select a team"
                  error={errors.Team}
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.fields.TeamID}>
                      {team.fields.TeamName} ({team.fields.Season})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField 
                label="Position" 
                required
                error={errors.Position}
              >
                <Select
                  value={formData.Position}
                  onChange={(e) => handleChange('Position', e.target.value)}
                  placeholder="Select position"
                  error={errors.Position}
                >
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField 
                label="Kit Number" 
                required
                error={errors.KitNumber}
                description="Player's jersey number (1-999)"
              >
                <Input
                  type="number"
                  min="1"
                  max="999"
                  placeholder="Enter kit number"
                  value={formData.KitNumber}
                  onChange={(e) => handleChange('KitNumber', e.target.value)}
                  error={errors.KitNumber}
                />
              </FormField>

              <FormField 
                label="Profile Image URL"
                description="Optional player photo URL"
              >
                <Input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.ProfileImageURL}
                  onChange={(e) => handleChange('ProfileImageURL', e.target.value)}
                />
              </FormField>
            </FormGrid>
          </FormSection>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              loading={isSaving}
              disabled={isSaving}
              icon={isSaving ? null : <UserIcon className="w-4 h-4" />}
            >
              {isSaving ? 'Adding Player...' : 'Add Player'}
            </Button>
          </div>

        </form>
      </FormContainer>

      {/* Confirmation Toast */}
      {showConfirmation && (
        <ConfirmationToast
          message={confirmationConfig.message}
          type={confirmationConfig.type}
          onClose={() => setShowConfirmation(false)}
          redirectUrl={confirmationConfig.redirectUrl}
          redirectText={confirmationConfig.redirectText}
        />
      )}
    </div>
  );
}
