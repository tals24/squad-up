
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  User as UserIcon,
  Save,
  Shield,
  Calendar,
  Hash,
  Users,
  Target
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Label,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/design-system-components";
import { airtableSync } from "@/api/functions";
import ConfirmationToast from "../components/ConfirmationToast";

export default function AddPlayer() {
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50/50 via-transparent to-secondary-50/50 p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
            <div className="h-96 bg-neutral-200 rounded-xl shadow-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/50 via-transparent to-secondary-50/50 p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to={createPageUrl("Players")}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Add New Player</h1>
            <p className="text-neutral-600">Create a new player profile for your squad</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-primary-600" />
              </div>
              Player Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-neutral-700">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter player's full name"
                  value={formData.FullName}
                  onChange={(e) => handleChange('FullName', e.target.value)}
                  className={errors.FullName ? "border-error-500 focus:ring-error-500" : ""}
                />
                {errors.FullName && (
                  <p className="text-sm text-error-500">{errors.FullName}</p>
                )}
              </div>

              {/* Kit Number */}
              <div className="space-y-2">
                <Label htmlFor="kitNumber" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Kit Number *
                </Label>
                <Input
                  id="kitNumber"
                  type="number"
                  placeholder="1-99"
                  min="1"
                  max="99"
                  value={formData.KitNumber}
                  onChange={(e) => handleChange('KitNumber', e.target.value)}
                  className={errors.KitNumber ? "border-error-500 focus:ring-error-500" : ""}
                />
                <p className="text-xs text-neutral-500">Number between 1 and 99</p>
                {errors.KitNumber && (
                  <p className="text-sm text-error-500">{errors.KitNumber}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth *
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.DateOfBirth}
                  onChange={(e) => handleChange('DateOfBirth', e.target.value)}
                  className={errors.DateOfBirth ? "border-error-500 focus:ring-error-500" : ""}
                />
                {errors.DateOfBirth && (
                  <p className="text-sm text-error-500">{errors.DateOfBirth}</p>
                )}
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Position *
                </Label>
                <Select value={formData.Position} onValueChange={(value) => handleChange('Position', value)}>
                  <SelectTrigger className={errors.Position ? "border-error-500 focus:ring-error-500" : ""}>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="Defender">Defender</SelectItem>
                    <SelectItem value="Midfielder">Midfielder</SelectItem>
                    <SelectItem value="Forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
                {errors.Position && (
                  <p className="text-sm text-error-500">{errors.Position}</p>
                )}
              </div>

              {/* Team */}
              <div className="space-y-2">
                <Label htmlFor="team" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team *
                </Label>
                <Select value={formData.Team} onValueChange={(value) => handleChange('Team', value)}>
                  <SelectTrigger className={errors.Team ? "border-error-500 focus:ring-error-500" : ""}>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.fields?.TeamName || team.fields?.Name || 'Unknown Team'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.Team && (
                  <p className="text-sm text-error-500">{errors.Team}</p>
                )}
              </div>

              {/* Profile Image URL */}
              <div className="space-y-2">
                <Label htmlFor="profileImage" className="text-sm font-medium text-neutral-700">
                  Profile Image URL
                </Label>
                <Input
                  id="profileImage"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.ProfileImageURL}
                  onChange={(e) => handleChange('ProfileImageURL', e.target.value)}
                />
                <p className="text-xs text-neutral-500">Optional: URL to player's profile image</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-neutral-200">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.history.back()}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary-500 hover:bg-primary-600"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding Player...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Add Player
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {showConfirmation && (
        <ConfirmationToast
          isVisible={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          config={confirmationConfig}
        />
      )}
    </div>
  );
}
