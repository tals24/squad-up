/**
 * SquadUp Theme Editor
 * 
 * Advanced theme editor interface for creating custom themes,
 * with real-time preview and accessibility validation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Save, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  Trash2, 
  Copy, 
  Check,
  AlertTriangle,
  Lightbulb,
  Clock
} from 'lucide-react';
import { cn } from "@/shared/lib/utils";
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
  SelectValue,
  Textarea,
  Badge,
  Heading,
  Text,
  Container,
  Section,
} from '@/shared/ui/primitives/design-system-components';
import { 
  AdvancedCard,
  ChoreographedList,
  ScrollReveal,
} from '@/shared/ui/primitives/advanced-animated-components';
import { ThemeManager, ThemeValidator, CustomTheme, ThemeSchedule } from '@/lib/advanced-theming';

// ===========================================
// COLOR PICKER COMPONENT
// ===========================================

const ColorPicker = ({ 
  label, 
  value, 
  onChange, 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleChange = (newValue) => {
    setTempValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center space-x-2">
        <div 
          className="w-8 h-8 rounded border-2 border-neutral-300 cursor-pointer hover:border-neutral-400 transition-colors"
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
        <input
          type="color"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="w-8 h-8 rounded border-0 cursor-pointer"
          style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
};

// ===========================================
// COLOR PALETTE EDITOR
// ===========================================

const ColorPaletteEditor = ({ 
  colors, 
  onChange, 
  groupName 
}) => {
  const handleColorChange = (shade, newColor) => {
    onChange({
      ...colors,
      [shade]: newColor,
    });
  };

  const shades = Object.keys(colors);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <Heading level={4} className="capitalize">{groupName} Colors</Heading>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shades.map((shade) => (
          <ColorPicker
            key={shade}
            label={shade}
            value={colors[shade]}
            onChange={(newColor) => handleColorChange(shade, newColor)}
          />
        ))}
      </div>
    </motion.div>
  );
};

// ===========================================
// THEME PREVIEW
// ===========================================

const ThemePreview = ({ theme, isVisible }) => {
  if (!isVisible || !theme) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-4 bg-white rounded-lg shadow-2xl z-50 overflow-hidden"
        style={{
          '--color-primary-500': theme.colors.primary['500'],
          '--color-secondary-500': theme.colors.secondary['500'],
          '--color-neutral-900': theme.colors.neutral['900'],
          '--color-background-primary': theme.colors.background.primary,
          '--color-text-primary': theme.colors.text.primary,
        }}
      >
        <div className="h-full flex flex-col">
          {/* Preview Header */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{theme.name}</h2>
                <p className="text-primary-100">Theme Preview</p>
              </div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                Close Preview
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-6 overflow-auto" style={{ backgroundColor: theme.colors.background.primary }}>
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Sample Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="p-4 rounded-lg border shadow-sm bg-white"
                    style={{ borderColor: theme.colors.border.default }}
                  >
                    <h3 
                      className="font-semibold mb-2"
                      style={{ color: theme.colors.text.primary }}
                    >
                      Sample Card {i}
                    </h3>
                    <p style={{ color: theme.colors.text.secondary }}>
                      This is how your theme looks in practice.
                    </p>
                    <button 
                      className="mt-3 px-4 py-2 rounded text-white text-sm font-medium"
                      style={{ backgroundColor: theme.colors.primary['500'] }}
                    >
                      Action Button
                    </button>
                  </div>
                ))}
              </div>

              {/* Sample Text Styles */}
              <div className="space-y-4">
                <h1 style={{ color: theme.colors.text.primary }} className="text-3xl font-bold">
                  Heading 1 Style
                </h1>
                <h2 style={{ color: theme.colors.text.primary }} className="text-2xl font-semibold">
                  Heading 2 Style
                </h2>
                <p style={{ color: theme.colors.text.secondary }} className="text-base">
                  Body text appears in this color and demonstrates readability with your chosen palette.
                </p>
                <p style={{ color: theme.colors.text.tertiary }} className="text-sm">
                  Secondary text uses a more muted color for less important information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ===========================================
// MAIN THEME EDITOR
// ===========================================

export const ThemeEditor = () => {
  const [themeManager] = useState(() => ThemeManager.getInstance());
  const [currentTheme, setCurrentTheme] = useState(null);
  const [editingTheme, setEditingTheme] = useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [activeColorGroup, setActiveColorGroup] = useState('primary');
  const [themes, setThemes] = useState([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Load themes on component mount
  useEffect(() => {
    setThemes(themeManager.getAllThemes());
    setCurrentTheme(themeManager.getActiveTheme());
  }, [themeManager]);

  // Validate theme when it changes
  useEffect(() => {
    if (editingTheme) {
      const errors = ThemeValidator.validateColorPalette(editingTheme.colors);
      const warnings = ThemeValidator.validateAccessibility(editingTheme.colors);
      setValidationErrors(errors);
      setValidationWarnings(warnings);
    }
  }, [editingTheme]);

  const startEditing = (theme) => {
    setEditingTheme({ ...theme });
    setIsCreatingNew(false);
  };

  const startCreatingNew = () => {
    const newTheme = themeManager.createDefaultTheme();
    newTheme.id = `custom-${Date.now()}`;
    newTheme.name = 'New Custom Theme';
    setEditingTheme(newTheme);
    setIsCreatingNew(true);
  };

  const handleSave = () => {
    if (!editingTheme) return;

    try {
      if (validationErrors.length > 0) {
        alert('Please fix validation errors before saving.');
        return;
      }

      themeManager.addTheme(editingTheme);
      setThemes(themeManager.getAllThemes());
      setEditingTheme(null);
      setIsCreatingNew(false);
    } catch (error) {
      alert(`Failed to save theme: ${error.message}`);
    }
  };

  const handleColorGroupChange = (groupName, newColors) => {
    if (!editingTheme) return;

    setEditingTheme({
      ...editingTheme,
      colors: {
        ...editingTheme.colors,
        [groupName]: newColors,
      },
      metadata: {
        ...editingTheme.metadata,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleThemeNameChange = (newName) => {
    if (!editingTheme) return;
    
    setEditingTheme({
      ...editingTheme,
      name: newName,
    });
  };

  const handleApplyTheme = (themeId) => {
    themeManager.setActiveTheme(themeId);
    setCurrentTheme(themeManager.getActiveTheme());
  };

  const handleDeleteTheme = (themeId) => {
    if (confirm('Are you sure you want to delete this theme?')) {
      themeManager.deleteTheme(themeId);
      setThemes(themeManager.getAllThemes());
      if (editingTheme?.id === themeId) {
        setEditingTheme(null);
      }
    }
  };

  const colorGroups = ['primary', 'secondary', 'neutral', 'success', 'warning', 'error', 'info'];

  return (
    <Container size="xl" className="py-8">
      <Section>
        <div className="space-y-8">
          {/* Header */}
          <ScrollReveal>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <Heading level={1} className="mb-2">Theme Editor</Heading>
              <Text variant="large" className="text-neutral-600">
                Create and customize themes for your SquadUp application
              </Text>
            </div>
          </ScrollReveal>

          {/* Theme List */}
          <ScrollReveal delay={0.1}>
            <AdvancedCard>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Available Themes</CardTitle>
                  <Button onClick={startCreatingNew} variant="primary">
                    <Palette className="w-4 h-4 mr-2" />
                    Create New Theme
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ChoreographedList layout="grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <AdvancedCard
                      key={theme.id}
                      interactive
                      size="sm"
                      className={cn(
                        'relative',
                        currentTheme?.id === theme.id && 'ring-2 ring-primary-500'
                      )}
                    >
                      <div className="space-y-3">
                        {/* Color Preview */}
                        <div className="flex space-x-1">
                          {['primary', 'secondary', 'success', 'warning', 'error'].map((color) => (
                            <div
                              key={color}
                              className="w-6 h-6 rounded flex-1"
                              style={{ backgroundColor: theme.colors[color]?.['500'] || '#ccc' }}
                            />
                          ))}
                        </div>

                        {/* Theme Info */}
                        <div>
                          <h3 className="font-semibold text-sm">{theme.name}</h3>
                          <p className="text-xs text-neutral-600 mt-1">
                            {theme.metadata.author || 'Custom Theme'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => startEditing(theme)}
                            className="flex-1"
                          >
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            variant={currentTheme?.id === theme.id ? "secondary" : "primary"}
                            onClick={() => handleApplyTheme(theme.id)}
                            className="flex-1"
                          >
                            {currentTheme?.id === theme.id ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              'Apply'
                            )}
                          </Button>
                          {theme.id !== 'default' && (
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => handleDeleteTheme(theme.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </AdvancedCard>
                  ))}
                </ChoreographedList>
              </CardContent>
            </AdvancedCard>
          </ScrollReveal>

          {/* Theme Editor */}
          <AnimatePresence>
            {editingTheme && (
              <ScrollReveal delay={0.2}>
                <AdvancedCard>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {isCreatingNew ? 'Create New Theme' : `Editing: ${editingTheme.name}`}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                        >
                          {isPreviewVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {isPreviewVisible ? 'Hide' : 'Preview'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingTheme(null)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSave}
                          disabled={validationErrors.length > 0}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Theme
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Theme Name */}
                    <div className="space-y-2">
                      <Label>Theme Name</Label>
                      <Input
                        value={editingTheme.name}
                        onChange={(e) => handleThemeNameChange(e.target.value)}
                        placeholder="Enter theme name"
                      />
                    </div>

                    {/* Validation Messages */}
                    {(validationErrors.length > 0 || validationWarnings.length > 0) && (
                      <div className="space-y-3">
                        {validationErrors.length > 0 && (
                          <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-error-600" />
                              <Text variant="sm" className="font-medium text-error-900">
                                Validation Errors
                              </Text>
                            </div>
                            {validationErrors.map((error, index) => (
                              <Text key={index} variant="sm" className="text-error-700">
                                • {error}
                              </Text>
                            ))}
                          </div>
                        )}

                        {validationWarnings.length > 0 && (
                          <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-warning-600" />
                              <Text variant="sm" className="font-medium text-warning-900">
                                Accessibility Warnings
                              </Text>
                            </div>
                            {validationWarnings.map((warning, index) => (
                              <Text key={index} variant="sm" className="text-warning-700">
                                • {warning}
                              </Text>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Color Group Selector */}
                    <div className="space-y-2">
                      <Label>Color Group</Label>
                      <Select value={activeColorGroup} onValueChange={setActiveColorGroup}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorGroups.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group.charAt(0).toUpperCase() + group.slice(1)} Colors
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Color Palette Editor */}
                    {editingTheme.colors[activeColorGroup] && (
                      <ColorPaletteEditor
                        colors={editingTheme.colors[activeColorGroup]}
                        onChange={(newColors) => handleColorGroupChange(activeColorGroup, newColors)}
                        groupName={activeColorGroup}
                      />
                    )}
                  </CardContent>
                </AdvancedCard>
              </ScrollReveal>
            )}
          </AnimatePresence>
        </div>
      </Section>

      {/* Theme Preview Modal */}
      <ThemePreview theme={editingTheme} isVisible={isPreviewVisible} />
    </Container>
  );
};

export default ThemeEditor;
