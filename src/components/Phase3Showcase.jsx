/**
 * Phase 3 UX Enhancements Showcase
 * 
 * Demonstrates all the new features added in Phase 3:
 * - Animations and micro-interactions
 * - Accessibility enhancements
 * - Dark mode support
 * - Advanced responsive design
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Zap, 
  Heart, 
  Star, 
  Sun, 
  Moon, 
  Accessibility,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

import {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  AnimatedAlert,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  LoadingSpinner,
} from '@/components/ui/animated-components';

import {
  Container,
  Section,
  Heading,
  Text,
  Grid,
  Badge,
  FormField,
} from '@/components/ui/design-system-components';

import { ThemeToggle, useTheme } from '@/contexts/ThemeContext';
import { useDeviceType, useBreakpoint } from '@/lib/responsive';
import { createAriaProps } from '@/lib/accessibility';

export default function Phase3Showcase() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  
  const { resolvedTheme } = useTheme();
  const deviceType = useDeviceType();
  const isLargeScreen = useBreakpoint('lg');

  const features = [
    {
      id: 'animations',
      title: 'Smooth Animations',
      description: 'Framer Motion powered micro-interactions',
      icon: Zap,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      id: 'accessibility',
      title: 'WCAG 2.1 AA Compliant',
      description: 'Full keyboard navigation and screen reader support',
      icon: Accessibility,
      color: 'text-success-500',
      bgColor: 'bg-success-50 dark:bg-success-900/20',
    },
    {
      id: 'responsive',
      title: 'Advanced Responsive',
      description: 'Container queries and device-aware design',
      icon: deviceType === 'mobile' ? Smartphone : deviceType === 'tablet' ? Tablet : Monitor,
      color: 'text-secondary-500',
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
    },
    {
      id: 'darkmode',
      title: 'Dark Mode Support',
      description: 'System preference aware theme switching',
      icon: resolvedTheme === 'dark' ? Moon : Sun,
      color: 'text-warning-500',
      bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    },
  ];

  const demoCards = [
    { id: 1, title: 'Interactive Card 1', subtitle: 'Hover me!' },
    { id: 2, title: 'Interactive Card 2', subtitle: 'Click me!' },
    { id: 3, title: 'Interactive Card 3', subtitle: 'Focus me!' },
    { id: 4, title: 'Interactive Card 4', subtitle: 'Touch me!' },
  ];

  return (
    <PageTransition>
      <Section padding="lg" className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <Container size="xl" className="space-y-12">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Heading level={1} className="mb-4">
              Phase 3: UX Enhancements
            </Heading>
            <Text variant="large" className="text-neutral-600 dark:text-neutral-400 mb-6">
              Animations • Accessibility • Responsiveness • Dark Mode
            </Text>
            
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge variant="secondary">
                Device: {deviceType}
              </Badge>
              <Badge variant="secondary">
                Theme: {resolvedTheme}
              </Badge>
              <Badge variant="secondary">
                Viewport: {isLargeScreen ? 'Large' : 'Small'}
              </Badge>
              <ThemeToggle showLabel />
            </div>
          </motion.div>

          {/* Features Grid */}
          <StaggerContainer>
            <Grid cols={{ xs: 1, md: 2, lg: 4 }} gap="md">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <StaggerItem key={feature.id}>
                    <AnimatedCard
                      interactive
                      className="h-full text-center"
                      onClick={() => setSelectedCard(feature.id)}
                      {...createAriaProps({
                        label: `${feature.title}: ${feature.description}`,
                        role: 'button'
                      })}
                    >
                      <div className="p-6 space-y-4">
                        <div className={`mx-auto w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-6 w-6 ${feature.color}`} />
                        </div>
                        <div>
                          <Heading level={4} className="mb-2">
                            {feature.title}
                          </Heading>
                          <Text variant="body" className="text-neutral-600 dark:text-neutral-400">
                            {feature.description}
                          </Text>
                        </div>
                        {selectedCard === feature.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex justify-center"
                          >
                            <Badge variant="primary">Selected!</Badge>
                          </motion.div>
                        )}
                      </div>
                    </AnimatedCard>
                  </StaggerItem>
                );
              })}
            </Grid>
          </StaggerContainer>

          {/* Interactive Demo Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-8"
          >
            <Heading level={2} className="text-center">
              Interactive Components Demo
            </Heading>

            {/* Button Animations */}
            <div className="space-y-4">
              <Heading level={3}>Animated Buttons</Heading>
              <div className="flex flex-wrap gap-4">
                <AnimatedButton
                  variant="primary"
                  loading={isAnimating}
                  onClick={() => {
                    setIsAnimating(true);
                    setTimeout(() => setIsAnimating(false), 2000);
                  }}
                >
                  {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isAnimating ? 'Loading...' : 'Start Animation'}
                </AnimatedButton>
                
                <AnimatedButton variant="secondary">
                  <Heart className="w-4 h-4 mr-2" />
                  Like
                </AnimatedButton>
                
                <AnimatedButton variant="outline">
                  <Star className="w-4 h-4 mr-2" />
                  Favorite
                </AnimatedButton>
              </div>
            </div>

            {/* Form Demo */}
            <div className="space-y-4">
              <Heading level={3}>Enhanced Form Elements</Heading>
              <Grid cols={{ xs: 1, md: 2 }} gap="md">
                <FormField label="Animated Input">
                  <AnimatedInput
                    placeholder="Type something..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    {...createAriaProps({
                      label: 'Demo input field',
                      describedBy: 'input-help'
                    })}
                  />
                  <Text id="input-help" variant="caption" className="mt-1 text-neutral-500">
                    This input has smooth focus animations
                  </Text>
                </FormField>
                
                <div className="space-y-4">
                  <AnimatedButton
                    variant="outline"
                    onClick={() => setShowAlert(!showAlert)}
                    className="w-full"
                  >
                    {showAlert ? 'Hide' : 'Show'} Alert Demo
                  </AnimatedButton>
                  
                  {showAlert && (
                    <AnimatedAlert variant="success" title="Success!">
                      This alert animates in smoothly and supports all accessibility features.
                    </AnimatedAlert>
                  )}
                </div>
              </Grid>
            </div>

            {/* Loading States */}
            <div className="space-y-4">
              <Heading level={3}>Loading States</Heading>
              <Grid cols={{ xs: 2, md: 4 }} gap="md">
                <div className="text-center space-y-2">
                  <LoadingSpinner size="sm" />
                  <Text variant="caption">Small</Text>
                </div>
                <div className="text-center space-y-2">
                  <LoadingSpinner size="md" />
                  <Text variant="caption">Medium</Text>
                </div>
                <div className="text-center space-y-2">
                  <LoadingSpinner size="lg" />
                  <Text variant="caption">Large</Text>
                </div>
                <div className="text-center space-y-2">
                  <LoadingSpinner size="xl" />
                  <Text variant="caption">Extra Large</Text>
                </div>
              </Grid>
            </div>

            {/* Interactive Cards */}
            <div className="space-y-4">
              <Heading level={3}>Interactive Cards</Heading>
              <StaggerContainer>
                <Grid cols={{ xs: 1, sm: 2, lg: 4 }} gap="md">
                  {demoCards.map((card) => (
                    <StaggerItem key={card.id}>
                      <AnimatedCard 
                        interactive
                        className="p-6 text-center"
                        onClick={() => console.log(`Clicked card ${card.id}`)}
                        {...createAriaProps({
                          label: `${card.title} - ${card.subtitle}`,
                          role: 'button'
                        })}
                      >
                        <Heading level={4} className="mb-2">
                          {card.title}
                        </Heading>
                        <Text variant="body" className="text-neutral-600 dark:text-neutral-400">
                          {card.subtitle}
                        </Text>
                      </AnimatedCard>
                    </StaggerItem>
                  ))}
                </Grid>
              </StaggerContainer>
            </div>
          </motion.div>

          {/* Accessibility Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center p-6 bg-neutral-50 dark:bg-neutral-800 rounded-xl"
          >
            <Accessibility className="h-8 w-8 mx-auto mb-3 text-success-500" />
            <Text variant="body" className="text-neutral-600 dark:text-neutral-400">
              <strong>Accessibility First:</strong> All components are keyboard navigable, 
              screen reader friendly, and follow WCAG 2.1 AA guidelines. 
              Try navigating with your keyboard or enabling your screen reader!
            </Text>
          </motion.div>

        </Container>
      </Section>
    </PageTransition>
  );
}
