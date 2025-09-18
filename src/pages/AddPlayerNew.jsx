import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { 
  Users,
  Calendar,
  Trophy,
  User as UserIcon,
  Target,
  Shirt
} from "lucide-react";
import { FormContainer, FormField, FormGrid, FormSection } from "@/components/ui/Form";
import { airtableSync } from "@/api/functions";
import ConfirmationToast from "../components/ConfirmationToast";

export default function AddPlayerNew() {
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
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);

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
        setConfirmationConfig({
          type: 'success',
          title: 'Player Added Successfully! ⚽',
          message: `${formData.FullName} has been added to the squad and is now ready to start training!`
        });
        setShowConfirmation(true);
        setTimeout(() => {
          window.location.href = createPageUrl("Players");
        }, 2000);
      } else {
        setConfirmationConfig({
          type: 'error',
          title: 'Failed to Add Player',
          message: 'There was an issue adding the player. Please check your information and try again.'
        });
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error("Error adding player:", error);
      setConfirmationConfig({
        type: 'error',
        title: 'Failed to Add Player',
        message: `An error occurred: ${error.message}. Please try again.`
      });
      setShowConfirmation(true);
    }
    setIsSaving(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.FullName.trim()) {
      newErrors.FullName = "Full name is required";
    }
    
    if (!formData.KitNumber) {
      newErrors.KitNumber = "Kit number is required";
    } else if (isNaN(formData.KitNumber) || formData.KitNumber < 1 || formData.KitNumber > 99) {
      newErrors.KitNumber = "Kit number must be between 1 and 99";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <FormContainer
        title="Add New Player"
        subtitle="Create a new player profile for your squad"
        onSave={handleSubmit}
        onCancel={() => window.history.back()}
        isLoading={isLoading}
        isSaving={isSaving}
        saveText="Add Player"
        backUrl={createPageUrl("Players")}
      >
        <FormSection title="Player Information">
          <FormGrid columns={2}>
            <FormField
              label="Full Name"
              name="FullName"
              value={formData.FullName}
              onChange={(e) => handleChange('FullName', e.target.value)}
              placeholder="Enter player's full name"
              required
              error={errors.FullName}
            />
            
            <FormField
              label="Kit Number"
              name="KitNumber"
              type="number"
              value={formData.KitNumber}
              onChange={(e) => handleChange('KitNumber', e.target.value)}
              placeholder="1-99"
              required
              error={errors.KitNumber}
              helpText="Number between 1 and 99"
            />
            
            <FormField
              label="Date of Birth"
              name="DateOfBirth"
              type="date"
              value={formData.DateOfBirth}
              onChange={(e) => handleChange('DateOfBirth', e.target.value)}
              required
              error={errors.DateOfBirth}
            />
            
            <FormField
              label="Position"
              name="Position"
              type="select"
              value={formData.Position}
              onChange={(e) => handleChange('Position', e.target.value)}
              required
              error={errors.Position}
            >
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Forward">Forward</option>
            </FormField>
            
            <FormField
              label="Team"
              name="Team"
              type="select"
              value={formData.Team}
              onChange={(e) => handleChange('Team', e.target.value)}
              required
              error={errors.Team}
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.fields?.TeamName || team.fields?.Name || 'Unknown Team'}
                </option>
              ))}
            </FormField>
            
            <FormField
              label="Profile Image URL"
              name="ProfileImageURL"
              value={formData.ProfileImageURL}
              onChange={(e) => handleChange('ProfileImageURL', e.target.value)}
              placeholder="https://example.com/image.jpg"
              helpText="Optional: URL to player's profile image"
            />
          </FormGrid>
        </FormSection>
      </FormContainer>

      {showConfirmation && (
        <ConfirmationToast
          isVisible={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          config={confirmationConfig}
        />
      )}
    </>
  );
}
