import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Shirt, 
  Calendar, 
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Alert,
  Spinner,
  Container,
  Section,
  Heading,
  Text,
  Divider,
  Grid
} from '@/components/ui/design-system-components';
import ConfirmationToast from '@/components/ConfirmationToast';

const AddPlayerRefactored = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    FullName: '',
    KitNumber: '',
    Position: '',
    DateOfBirth: '',
    ProfileImageURL: '',
    Team: '',
    NationalID: ''
  });

  const positions = [
    'Goalkeeper',
    'Defender',
    'Midfielder',
    'Forward',
    'Wing-back',
    'Striker'
  ];

  const teams = [
    'U16',
    'U18',
    'U21',
    'Senior Team'
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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
      newErrors.FullName = 'Full name is required';
    }

    if (!formData.KitNumber) {
      newErrors.KitNumber = 'Kit number is required';
    } else if (isNaN(formData.KitNumber) || formData.KitNumber < 1 || formData.KitNumber > 99) {
      newErrors.KitNumber = 'Kit number must be between 1 and 99';
    }

    if (!formData.Position) {
      newErrors.Position = 'Position is required';
    }

    if (!formData.DateOfBirth) {
      newErrors.DateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.DateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 12 || age > 50) {
        newErrors.DateOfBirth = 'Age must be between 12 and 50 years';
      }
    }

    if (!formData.Team) {
      newErrors.Team = 'Team is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowToast(true);
      setTimeout(() => {
        navigate('/players');
      }, 2000);
    } catch (error) {
      console.error('Error saving player:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/players');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <Spinner size="xl" className="mx-auto" />
            <Text variant="body">Loading player form...</Text>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Container size="lg">
        <Section padding="lg">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Players
            </Button>
            <Divider orientation="vertical" className="h-6" />
            <div>
              <Heading level={1} className="text-neutral-900">
                Add New Player
              </Heading>
              <Text variant="body" className="text-neutral-600">
                Create a new player profile for your squad
              </Text>
            </div>
          </div>

          {/* Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Player Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <Section padding="none">
                  <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">
                    Basic Information
                  </Heading>
                  <Grid cols={2} gap="lg">
                    <div className="space-y-2">
                      <label htmlFor="FullName" className="block text-sm font-medium text-neutral-700">
                        Full Name *
                      </label>
                      <Input
                        id="FullName"
                        type="text"
                        value={formData.FullName}
                        onChange={(e) => handleChange('FullName', e.target.value)}
                        placeholder="Enter player's full name"
                        error={errors.FullName}
                        className="w-full"
                      />
                      {errors.FullName && (
                        <Text variant="small" className="text-error-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.FullName}
                        </Text>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="KitNumber" className="block text-sm font-medium text-neutral-700">
                        Kit Number *
                      </label>
                      <Input
                        id="KitNumber"
                        type="number"
                        value={formData.KitNumber}
                        onChange={(e) => handleChange('KitNumber', e.target.value)}
                        placeholder="1-99"
                        error={errors.KitNumber}
                        className="w-full"
                      />
                      {errors.KitNumber && (
                        <Text variant="small" className="text-error-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.KitNumber}
                        </Text>
                      )}
                      <Text variant="small" className="text-neutral-500">
                        Number between 1 and 99
                      </Text>
                    </div>
                  </Grid>
                </Section>

                <Divider />

                {/* Position & Team */}
                <Section padding="none">
                  <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">
                    Team Details
                  </Heading>
                  <Grid cols={2} gap="lg">
                    <div className="space-y-2">
                      <label htmlFor="Position" className="block text-sm font-medium text-neutral-700">
                        Position *
                      </label>
                      <Select value={formData.Position} onValueChange={(value) => handleChange('Position', value)}>
                        <SelectTrigger error={errors.Position} className="w-full">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map((position) => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.Position && (
                        <Text variant="small" className="text-error-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.Position}
                        </Text>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="Team" className="block text-sm font-medium text-neutral-700">
                        Team *
                      </label>
                      <Select value={formData.Team} onValueChange={(value) => handleChange('Team', value)}>
                        <SelectTrigger error={errors.Team} className="w-full">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team} value={team}>
                              {team}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.Team && (
                        <Text variant="small" className="text-error-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.Team}
                        </Text>
                      )}
                    </div>
                  </Grid>
                </Section>

                <Divider />

                {/* Personal Details */}
                <Section padding="none">
                  <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">
                    Personal Details
                  </Heading>
                  <Grid cols={2} gap="lg">
                    <div className="space-y-2">
                      <label htmlFor="DateOfBirth" className="block text-sm font-medium text-neutral-700">
                        Date of Birth *
                      </label>
                      <Input
                        id="DateOfBirth"
                        type="date"
                        value={formData.DateOfBirth}
                        onChange={(e) => handleChange('DateOfBirth', e.target.value)}
                        error={errors.DateOfBirth}
                        className="w-full"
                      />
                      {errors.DateOfBirth && (
                        <Text variant="small" className="text-error-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.DateOfBirth}
                        </Text>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="NationalID" className="block text-sm font-medium text-neutral-700">
                        National ID
                      </label>
                      <Input
                        id="NationalID"
                        type="text"
                        value={formData.NationalID}
                        onChange={(e) => handleChange('NationalID', e.target.value)}
                        placeholder="Optional"
                        className="w-full"
                      />
                    </div>
                  </Grid>
                </Section>

                <Divider />

                {/* Profile Image */}
                <Section padding="none">
                  <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">
                    Profile Image
                  </Heading>
                  <div className="space-y-2">
                    <label htmlFor="ProfileImageURL" className="block text-sm font-medium text-neutral-700">
                      Image URL
                    </label>
                    <Input
                      id="ProfileImageURL"
                      type="url"
                      value={formData.ProfileImageURL}
                      onChange={(e) => handleChange('ProfileImageURL', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full"
                    />
                    <Text variant="small" className="text-neutral-500">
                      Optional: URL to player's profile image
                    </Text>
                  </div>
                </Section>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaving}
                    className="min-w-[120px]"
                  >
                    {isSaving ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Add Player
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </Section>
      </Container>

      {/* Success Toast */}
      <ConfirmationToast
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        title="Player Added Successfully!"
        message="The new player has been added to your squad."
        type="success"
      />
    </>
  );
};

export default AddPlayerRefactored;
