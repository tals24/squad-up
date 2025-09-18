/* ===================================================================
   UNIFIED COMPONENTS SHOWCASE
   Demonstrates all unified components with consistent design
   =================================================================== */

import React, { useState } from 'react';
import { 
  Button, 
  IconButton,
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  FormContainer,
  FormSection,
  FormGrid,
  FormField,
  Input,
  Textarea,
  Select,
  FormAlert
} from './ui/unified-components';
import { 
  Plus, 
  Edit, 
  Trash, 
  Download, 
  Upload, 
  Heart, 
  Star,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react';

export default function UnifiedComponentsShowcase() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    category: '',
    date: ''
  });
  const [showAlert, setShowAlert] = useState(true);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-neutral-900">
            Unified Component System
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Consistent, beautiful, and accessible components with unified design language
          </p>
        </div>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>
              Consistent buttons with hover animations, focus states, and loading indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* Button Variants */}
            <div>
              <h4 className="text-lg font-semibold text-neutral-900 mb-4">Variants</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h4 className="text-lg font-semibold text-neutral-900 mb-4">Sizes</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="xs">Extra Small</Button>
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" size="xl">Extra Large</Button>
              </div>
            </div>

            {/* Button States */}
            <div>
              <h4 className="text-lg font-semibold text-neutral-900 mb-4">States</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Normal</Button>
                <Button variant="primary" disabled>Disabled</Button>
                <Button variant="primary" loading>Loading</Button>
                <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                  With Icon
                </Button>
                <Button variant="outline" icon={<Download className="w-4 h-4" />} iconPosition="right">
                  Icon Right
                </Button>
              </div>
            </div>

            {/* Icon Buttons */}
            <div>
              <h4 className="text-lg font-semibold text-neutral-900 mb-4">Icon Buttons</h4>
              <div className="flex flex-wrap gap-3">
                <IconButton variant="primary" size="sm">
                  <Edit className="w-4 h-4" />
                </IconButton>
                <IconButton variant="outline" size="md">
                  <Trash className="w-4 h-4" />
                </IconButton>
                <IconButton variant="ghost" size="lg">
                  <Heart className="w-5 h-5" />
                </IconButton>
                <IconButton variant="success">
                  <Star className="w-4 h-4" />
                </IconButton>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Cards Section */}
        <Card>
          <CardHeader>
            <CardTitle>Card Components</CardTitle>
            <CardDescription>
              Consistent card layouts with proper shadows, spacing, and hover effects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormGrid columns={3} gap="lg">
              
              {/* Default Card */}
              <Card variant="default">
                <CardHeader>
                  <CardTitle level={4}>Default Card</CardTitle>
                  <CardDescription>
                    Standard card with subtle shadow and hover effects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    This is the default card variant with consistent spacing and typography.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline">Action</Button>
                </CardFooter>
              </Card>

              {/* Elevated Card */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle level={4}>Elevated Card</CardTitle>
                  <CardDescription>
                    Card with enhanced shadow for emphasis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    This elevated variant stands out more with increased shadow depth.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="primary">Primary</Button>
                </CardFooter>
              </Card>

              {/* Outlined Card */}
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle level={4}>Outlined Card</CardTitle>
                  <CardDescription>
                    Bordered card without shadow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    This variant uses borders instead of shadows for definition.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="secondary">Secondary</Button>
                </CardFooter>
              </Card>

            </FormGrid>
          </CardContent>
        </Card>

        {/* Forms Section */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>
              Consistent form layouts with proper spacing, validation, and accessibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            <FormContainer>
              <form className="space-y-6">
                
                {/* Alert Example */}
                {showAlert && (
                  <FormAlert 
                    variant="info" 
                    title="Form Guidelines"
                    onClose={() => setShowAlert(false)}
                  >
                    Fill out all required fields marked with an asterisk (*). 
                    Your information will be kept secure and private.
                  </FormAlert>
                )}

                {/* Basic Information Section */}
                <FormSection 
                  title="Personal Information"
                  description="Please provide your basic contact details"
                >
                  <FormGrid columns={2} gap="md">
                    <FormField 
                      label="Full Name" 
                      required
                      error={!formData.name && formData.name !== '' ? 'Name is required' : ''}
                    >
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        error={!formData.name && formData.name !== ''}
                      />
                    </FormField>

                    <FormField 
                      label="Email Address" 
                      required
                      description="We'll use this to contact you"
                    >
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </FormField>

                    <FormField label="Phone Number">
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </FormField>

                    <FormField label="Date of Birth">
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                      />
                    </FormField>
                  </FormGrid>
                </FormSection>

                {/* Additional Information Section */}
                <FormSection 
                  title="Additional Details"
                  description="Optional information to help us serve you better"
                >
                  <FormGrid columns={1}>
                    <FormField label="Category">
                      <Select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        placeholder="Select a category"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="sales">Sales Question</option>
                        <option value="feedback">Feedback</option>
                      </Select>
                    </FormField>

                    <FormField 
                      label="Message"
                      description="Tell us more about your inquiry"
                    >
                      <Textarea
                        placeholder="Enter your message here..."
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        rows={5}
                      />
                    </FormField>
                  </FormGrid>
                </FormSection>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-neutral-200">
                  <Button variant="ghost" type="button">
                    Cancel
                  </Button>
                  <Button variant="outline" type="button">
                    Save Draft
                  </Button>
                  <Button variant="primary" type="submit">
                    Submit Form
                  </Button>
                </div>

              </form>
            </FormContainer>

          </CardContent>
        </Card>

        {/* Input Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Input Variations</CardTitle>
            <CardDescription>
              Different input states and sizes for various use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormGrid columns={2} gap="lg">
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-neutral-900">Input Sizes</h4>
                <FormField label="Small Input">
                  <Input size="sm" placeholder="Small input field" />
                </FormField>
                <FormField label="Medium Input">
                  <Input size="md" placeholder="Medium input field" />
                </FormField>
                <FormField label="Large Input">
                  <Input size="lg" placeholder="Large input field" />
                </FormField>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-neutral-900">Input States</h4>
                <FormField label="Normal State">
                  <Input placeholder="Normal input" />
                </FormField>
                <FormField label="Error State" error="This field has an error">
                  <Input placeholder="Input with error" error />
                </FormField>
                <FormField label="Disabled State">
                  <Input placeholder="Disabled input" disabled />
                </FormField>
              </div>

            </FormGrid>
          </CardContent>
        </Card>

        {/* Alert Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Components</CardTitle>
            <CardDescription>
              Contextual alerts for different message types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormAlert variant="info" title="Information">
              This is an informational message with helpful context.
            </FormAlert>
            <FormAlert variant="success" title="Success">
              Your action was completed successfully!
            </FormAlert>
            <FormAlert variant="warning" title="Warning">
              Please review this information before proceeding.
            </FormAlert>
            <FormAlert variant="error" title="Error">
              There was an error processing your request.
            </FormAlert>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
