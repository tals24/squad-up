import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Input,
  Textarea,
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
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  Star,
  Heart,
  ThumbsUp
} from 'lucide-react';

const DesignSystemShowcase = () => {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  return (
    <Container size="xl">
      <Section padding="lg">
        {/* Header */}
        <div className="text-center mb-12">
          <Heading level={1} className="text-4xl font-bold text-primary-700 mb-4">
            SquadUp Design System
          </Heading>
          <Text variant="body" className="text-lg text-neutral-600 max-w-2xl mx-auto">
            A comprehensive design system built with TailwindCSS and custom CSS variables 
            for consistent, scalable, and maintainable UI components.
          </Text>
        </div>

        {/* Color Palette */}
        <Section padding="lg">
          <Heading level={2} className="text-2xl font-semibold text-neutral-900 mb-6">
            Color Palette
          </Heading>
          <Grid cols={3} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary-700">Primary Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-lg"></div>
                  <Text variant="small">Primary 500</Text>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg"></div>
                  <Text variant="small">Primary 600</Text>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-700 rounded-lg"></div>
                  <Text variant="small">Primary 700</Text>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-secondary-700">Secondary Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary-500 rounded-lg"></div>
                  <Text variant="small">Secondary 500</Text>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary-600 rounded-lg"></div>
                  <Text variant="small">Secondary 600</Text>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary-700 rounded-lg"></div>
                  <Text variant="small">Secondary 700</Text>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-neutral-700">Semantic Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success-500 rounded-lg"></div>
                  <Text variant="small">Success</Text>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-warning-500 rounded-lg"></div>
                  <Text variant="small">Warning</Text>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-error-500 rounded-lg"></div>
                  <Text variant="small">Error</Text>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Section>

        <Divider />

        {/* Typography */}
        <Section padding="lg">
          <Heading level={2} className="text-2xl font-semibold text-neutral-900 mb-6">
            Typography
          </Heading>
          <Card>
            <CardContent className="space-y-6">
              <div>
                <Heading level={1} className="text-4xl font-bold text-neutral-900">
                  Heading 1 - Display Text
                </Heading>
                <Text variant="caption" className="text-neutral-500">text-4xl font-bold</Text>
              </div>
              <div>
                <Heading level={2} className="text-3xl font-semibold text-neutral-900">
                  Heading 2 - Section Title
                </Heading>
                <Text variant="caption" className="text-neutral-500">text-3xl font-semibold</Text>
              </div>
              <div>
                <Heading level={3} className="text-2xl font-semibold text-neutral-900">
                  Heading 3 - Subsection Title
                </Heading>
                <Text variant="caption" className="text-neutral-500">text-2xl font-semibold</Text>
              </div>
              <div>
                <Text variant="body" className="text-lg text-neutral-700">
                  Body text - This is the main body text used throughout the application. 
                  It should be readable and comfortable to read.
                </Text>
                <Text variant="caption" className="text-neutral-500">text-lg</Text>
              </div>
              <div>
                <Text variant="small" className="text-sm text-neutral-600">
                  Small text - Used for captions, labels, and secondary information.
                </Text>
                <Text variant="caption" className="text-neutral-500">text-sm</Text>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Divider />

        {/* Buttons */}
        <Section padding="lg">
          <Heading level={2} className="text-2xl font-semibold text-neutral-900 mb-6">
            Buttons
          </Heading>
          <Card>
            <CardContent className="space-y-8">
              <div>
                <Text variant="body" className="font-medium text-neutral-700 mb-4">Button Variants</Text>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="warning">Warning</Button>
                </div>
              </div>
              
              <div>
                <Text variant="body" className="font-medium text-neutral-700 mb-4">Button Sizes</Text>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" size="xl">Extra Large</Button>
                </div>
              </div>

              <div>
                <Text variant="body" className="font-medium text-neutral-700 mb-4">Button States</Text>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Normal</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                  <Button variant="primary" className="animate-glow">Glowing</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Divider />

        {/* Form Elements */}
        <Section padding="lg">
          <Heading level={2} className="text-2xl font-semibold text-neutral-900 mb-6">
            Form Elements
          </Heading>
          <Card>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Text Input
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Input with Error
                    </label>
                    <Input
                      type="text"
                      placeholder="This has an error"
                      error="This field is required"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Textarea
                  </label>
                  <Textarea
                    placeholder="Enter description"
                    value={textareaValue}
                    onChange={(e) => setTextareaValue(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Input Sizes
                    </label>
                    <div className="space-y-3">
                      <Input size="sm" placeholder="Small input" />
                      <Input size="md" placeholder="Medium input" />
                      <Input size="lg" placeholder="Large input" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Disabled Input
                    </label>
                    <Input
                      type="text"
                      placeholder="Disabled input"
                      disabled
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </Section>

        <Divider />

        {/* Badges */}
        <Section padding="lg">
          <Heading level={2} className="text-2xl font-semibold text-neutral-900 mb-6">
            Badges
          </Heading>
          <Card>
            <CardContent className="space-y-6">
              <div>
                <Text variant="body" className="font-medium text-neutral-700 mb-4">Badge Variants</Text>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
              
              <div>
                <Text variant="body" className="font-medium text-neutral-700 mb-4">Badge Sizes</Text>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="primary" size="sm">Small</Badge>
                  <Badge variant="primary" size="md">Medium</Badge>
                  <Badge variant="primary" size="lg">Large</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Divider />

        {/* Alerts */}
        <Section padding="lg">
          <Heading level={2} className="text-2xl font-semibold text-neutral-900 mb-6">
            Alerts
          </Heading>
          <Card>
            <CardContent className="space-y-4">
              <Alert variant="success">
                <CheckCircle className="w-4 h-4" />
                <Text>Success! Your action was completed successfully.</Text>
              </Alert>
              
              <Alert variant="warning">
                <AlertTriangle className="w-4 h-4" />
                <Text>Warning! Please review your input before proceeding.</Text>
              </Alert>
              
              <Alert variant="error">
                <AlertCircle className="w-4 h-4" />
                <Text>Error! Something went wrong. Please try again.</Text>
              </Alert>
              
              <Alert variant="info">
                <Info className="w-4 h-4" />
                <Text>Info! Here's some helpful information for you.</Text>
              </Alert>
            </CardContent>
          </Card>
        </Section>

        <Divider />

        {/* Loading States */}
        <Section padding="lg">
          <Heading level={2} className="text-2xl font-semibold text-neutral-900 mb-6">
            Loading States
          </Heading>
          <Card>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <Spinner size="sm" className="mx-auto mb-2" />
                  <Text variant="small">Small</Text>
                </div>
                <div className="text-center">
                  <Spinner size="md" className="mx-auto mb-2" />
                  <Text variant="small">Medium</Text>
                </div>
                <div className="text-center">
                  <Spinner size="lg" className="mx-auto mb-2" />
                  <Text variant="small">Large</Text>
                </div>
                <div className="text-center">
                  <Spinner size="xl" className="mx-auto mb-2" />
                  <Text variant="small">Extra Large</Text>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Divider />

        {/* Cards */}
        <Section padding="lg">
          <Heading level={2} className="text-2xl font-semibold text-neutral-900 mb-6">
            Cards
          </Heading>
          <Grid cols={3} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
              </CardHeader>
              <CardContent>
                <Text>This is a simple card with basic content.</Text>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary-700">Featured Card</CardTitle>
              </CardHeader>
              <CardContent>
                <Text>This card has enhanced shadow and colored title.</Text>
                <div className="mt-4">
                  <Badge variant="primary">Featured</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary-200 bg-primary-50">
              <CardHeader>
                <CardTitle className="text-primary-800">Highlighted Card</CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="text-primary-700">
                  This card has a colored background and border.
                </Text>
              </CardContent>
            </Card>
          </Grid>
        </Section>

        <Divider />

        {/* Responsive Grid */}
        <Section padding="lg">
          <Heading level={2} className="text-2xl font-semibold text-neutral-900 mb-6">
            Responsive Grid
          </Heading>
          <Card>
            <CardContent>
              <Text variant="body" className="mb-4">
                This grid adapts to different screen sizes:
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <div
                    key={item}
                    className="bg-primary-100 text-primary-800 p-4 rounded-lg text-center font-medium"
                  >
                    Item {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Footer */}
        <Section padding="lg">
          <div className="text-center py-8">
            <Text variant="body" className="text-neutral-500">
              SquadUp Design System - Built with TailwindCSS and React
            </Text>
          </div>
        </Section>
      </Section>
    </Container>
  );
};

export default DesignSystemShowcase;
