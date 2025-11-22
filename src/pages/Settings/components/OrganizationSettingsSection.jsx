import React, { useState, useEffect } from "react";
import { 
  Settings,
  Save,
  Loader2,
  Target,
  BarChart3,
  Shield,
  Zap,
  CheckCircle,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Badge } from "@/shared/ui/primitives/badge";
import { Switch } from "@/shared/ui/primitives/switch";
import { Label } from "@/shared/ui/primitives/label";
import { Checkbox } from "@/shared/ui/primitives/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/primitives/collapsible";
import { useData } from "@/app/providers/DataProvider";
import { useUserRole } from "@/shared/hooks/useUserRole";
import { User } from "@/api/entities";
import { DataCard, StandardButton } from "@/shared/ui/primitives/design-system-components";

const AGE_GROUPS = ['U6-U8', 'U8-U10', 'U10-U12', 'U12-U14', 'U14-U16', 'U16+'];

export default function OrganizationSettingsSection() {
  const { organizationConfig, isLoadingConfig, refreshConfig, users, teams } = useData();
  const [currentUser, setCurrentUser] = useState(null);
  const [localConfig, setLocalConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Fetch current user from Firebase
  useEffect(() => {
    User.me().then(setCurrentUser).catch(console.error);
  }, []);

  // Get user role
  const { isAdmin } = useUserRole({
    currentUser,
    users,
    teams
  });

  // Initialize local config from fetched config
  useEffect(() => {
    if (organizationConfig) {
      // Deep clone and ensure all override values are preserved (including false)
      const overrides = (organizationConfig.ageGroupOverrides || []).map(override => {
        const cleanedOverride = { ageGroup: override.ageGroup };
        // Explicitly copy all feature override fields, preserving false values
        // Use 'in' operator to check if property exists, even if value is false
        ['shotTrackingEnabled', 'positionSpecificMetricsEnabled', 'detailedDisciplinaryEnabled', 'goalInvolvementEnabled'].forEach(feature => {
          if (feature in override) {
            cleanedOverride[feature] = override[feature];
          }
        });
        return cleanedOverride;
      });
      
      setLocalConfig({
        features: { ...organizationConfig.features },
        ageGroupOverrides: overrides
      });
    }
  }, [organizationConfig]);

  // Handle global feature toggle
  const handleGlobalFeatureToggle = (featureName, enabled) => {
    setLocalConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureName]: enabled
      }
    }));
  };

  // Handle age group override toggle
  const handleAgeGroupOverrideToggle = (ageGroup, featureName, enabled) => {
    setLocalConfig(prev => {
      const overrides = [...(prev.ageGroupOverrides || [])];
      const existingIndex = overrides.findIndex(o => o.ageGroup === ageGroup);
      
      if (existingIndex >= 0) {
        // Update existing override
        overrides[existingIndex] = {
          ...overrides[existingIndex],
          [featureName]: enabled
        };
      } else {
        // Create new override
        overrides.push({
          ageGroup,
          [featureName]: enabled
        });
      }
      
      return {
        ...prev,
        ageGroupOverrides: overrides
      };
    });
  };

  // Get age group override value (or null if not set)
  const getAgeGroupOverride = (ageGroup, featureName) => {
    const override = localConfig?.ageGroupOverrides?.find(
      o => o.ageGroup === ageGroup
    );
    return override?.[featureName] ?? null;
  };

  // Reset age group override to use global setting
  const handleResetOverride = (ageGroup, featureName) => {
    setLocalConfig(prev => {
      const overrides = [...(prev.ageGroupOverrides || [])];
      const existingIndex = overrides.findIndex(o => o.ageGroup === ageGroup);
      
      if (existingIndex >= 0) {
        // Remove the specific feature override
        delete overrides[existingIndex][featureName];
        
        // If no features left in this override, remove the entire override
        const remainingFeatures = Object.keys(overrides[existingIndex]).filter(
          key => key !== 'ageGroup' && overrides[existingIndex][key] !== null && overrides[existingIndex][key] !== undefined
        );
        if (remainingFeatures.length === 0) {
          overrides.splice(existingIndex, 1);
        }
      }
      
      return {
        ...prev,
        ageGroupOverrides: overrides
      };
    });
  };

  // Get age groups that have overrides for a specific feature
  const getAgeGroupsWithOverride = (featureName) => {
    if (!localConfig?.ageGroupOverrides) return [];
    
    return localConfig.ageGroupOverrides
      .filter(override => {
        // Check if the feature override exists and is explicitly set
        // Both true and false are valid override values (null/undefined means no override)
        const value = override[featureName];
        return value !== null && value !== undefined && typeof value === 'boolean';
      })
      .map(override => override.ageGroup);
  };

  // Handle age group override selection (add/remove from override list)
  const handleAgeGroupOverrideSelect = (featureName, ageGroup, selected) => {
    setLocalConfig(prev => {
      const overrides = [...(prev.ageGroupOverrides || [])];
      const existingIndex = overrides.findIndex(o => o.ageGroup === ageGroup);
      
      if (selected) {
        // Add override - initialize with current global value
        const initialValue = prev.features[featureName];
        if (existingIndex >= 0) {
          // Update existing override
          overrides[existingIndex] = {
            ...overrides[existingIndex],
            [featureName]: initialValue
          };
        } else {
          // Create new override
          overrides.push({
            ageGroup,
            [featureName]: initialValue
          });
        }
      } else {
        // Remove override
        if (existingIndex >= 0) {
          delete overrides[existingIndex][featureName];
          
          // If no features left in this override, remove the entire override
          const remainingFeatures = Object.keys(overrides[existingIndex]).filter(
            key => key !== 'ageGroup' && overrides[existingIndex][key] !== null && overrides[existingIndex][key] !== undefined
          );
          if (remainingFeatures.length === 0) {
            overrides.splice(existingIndex, 1);
          }
        }
      }
      
      return {
        ...prev,
        ageGroupOverrides: overrides
      };
    });
  };

  // Save configuration
  const handleSave = async () => {
    if (!isAdmin) return;
    
    // Validate: Check if any changes were made
    if (organizationConfig && JSON.stringify(localConfig) === JSON.stringify({
      features: organizationConfig.features,
      ageGroupOverrides: organizationConfig.ageGroupOverrides
    })) {
      setSaveMessage({ type: 'info', text: 'No changes to save' });
      setTimeout(() => setSaveMessage(null), 2000);
      return;
    }
    
    // Optional: Warn if all features are disabled
    const hasAnyFeatureEnabled = Object.values(localConfig.features).some(v => v === true);
    if (!hasAnyFeatureEnabled) {
      if (!window.confirm('All features are disabled. Are you sure you want to continue?')) {
        return;
      }
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Ensure all override values are explicitly included (even false)
      const overridesToSave = localConfig.ageGroupOverrides.map(override => {
        const cleanedOverride = { ageGroup: override.ageGroup };
        // Explicitly include all feature fields that are set (including false)
        ['shotTrackingEnabled', 'positionSpecificMetricsEnabled', 'detailedDisciplinaryEnabled', 'goalInvolvementEnabled'].forEach(feature => {
          if (override.hasOwnProperty(feature) && override[feature] !== null && override[feature] !== undefined) {
            cleanedOverride[feature] = override[feature];
          }
        });
        return cleanedOverride;
      });
      
      const response = await fetch('http://localhost:3001/api/organizations/default/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          features: localConfig.features,
          ageGroupOverrides: overridesToSave
        })
      });
      
      if (!response.ok) throw new Error('Failed to save configuration');
      
      const result = await response.json();
      setSaveMessage({ type: 'success', text: 'Configuration saved successfully' });
      await refreshConfig(); // Refresh from server
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Save config error:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center p-8 rounded-xl bg-bg-secondary/70 border border-border-custom">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <p className="text-text-primary font-semibold">
            Only administrators can modify organization settings.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingConfig || !localConfig) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
        <span className="ml-2 text-text-primary">Loading configuration...</span>
      </div>
    );
  }

  const getFeatureIcon = (featureName) => {
    const icons = {
      shotTrackingEnabled: Target,
      positionSpecificMetricsEnabled: BarChart3,
      detailedDisciplinaryEnabled: Shield,
      goalInvolvementEnabled: Zap
    };
    return icons[featureName] || Settings;
  };

  const getFeatureColor = (featureName) => {
    const colors = {
      shotTrackingEnabled: 'from-orange-500 to-red-500',
      positionSpecificMetricsEnabled: 'from-blue-500 to-cyan-500',
      detailedDisciplinaryEnabled: 'from-purple-500 to-pink-500',
      goalInvolvementEnabled: 'from-green-500 to-emerald-500'
    };
    return colors[featureName] || 'from-slate-500 to-slate-600';
  };

  const getFeatureBorderColor = (featureName) => {
    const borderColors = {
      shotTrackingEnabled: 'border-orange-500/50 hover:border-orange-500/70',
      positionSpecificMetricsEnabled: 'border-blue-500/50 hover:border-blue-500/70',
      detailedDisciplinaryEnabled: 'border-purple-500/50 hover:border-purple-500/70',
      goalInvolvementEnabled: 'border-green-500/50 hover:border-green-500/70'
    };
    return borderColors[featureName] || 'border-border-custom';
  };

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {saveMessage && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          saveMessage.type === 'success' 
            ? 'bg-success/10 border-green-500/30 text-success' 
            : saveMessage.type === 'info'
            ? 'bg-accent-primary/10 border-blue-500/30 text-accent-primary'
            : 'bg-error/10 border-red-500/30 text-error'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : saveMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <Settings className="w-5 h-5" />
          )}
          <p className="font-semibold">{saveMessage.text}</p>
        </div>
      )}

      {/* Global Features Section */}
      <DataCard
        title="Global Feature Settings"
        titleIcon={<Settings className="w-6 h-6 text-accent-primary" />}
        headerClassName="flex items-center justify-between"
      >
        <div className="space-y-4">
          {/* Shot Tracking */}
          <div className={`p-4 rounded-xl bg-bg-primary/50 border ${getFeatureBorderColor('shotTrackingEnabled')} hover:shadow-md transition-all duration-200`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 bg-gradient-to-r ${getFeatureColor('shotTrackingEnabled')} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Target className="w-6 h-6 text-text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="font-bold text-lg text-text-primary">Shot Tracking</Label>
                  <p className="text-sm text-text-secondary mt-1">
                    Enable shot tracking for all teams (can be overridden per age group)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`${
                    localConfig.features.shotTrackingEnabled 
                      ? 'bg-success/10 text-success border-green-500/30' 
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}
                >
                  {localConfig.features.shotTrackingEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Switch
                  checked={localConfig.features.shotTrackingEnabled}
                  onCheckedChange={(checked) => handleGlobalFeatureToggle('shotTrackingEnabled', checked)}
                />
              </div>
            </div>
            
            {/* Age Group Overrides */}
            <Collapsible>
              <CollapsibleTrigger className="group flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors w-full">
                <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                <span>Override for specific age groups</span>
                {getAgeGroupsWithOverride('shotTrackingEnabled').length > 0 && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {getAgeGroupsWithOverride('shotTrackingEnabled').length} override{getAgeGroupsWithOverride('shotTrackingEnabled').length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {/* Age Group Checkboxes */}
                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <Label className="text-sm font-semibold text-text-primary mb-3 block">
                    Select age groups to override:
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {AGE_GROUPS.map(ageGroup => {
                      const hasOverride = getAgeGroupsWithOverride('shotTrackingEnabled').includes(ageGroup);
                      return (
                        <div key={ageGroup} className="flex items-center gap-2">
                          <Checkbox
                            id={`shotTracking-${ageGroup}`}
                            checked={hasOverride}
                            onCheckedChange={(checked) => handleAgeGroupOverrideSelect('shotTrackingEnabled', ageGroup, checked)}
                            className="border-slate-600 data-[state=checked]:bg-accent-primary data-[state=checked]:border-accent-primary"
                          />
                          <Label 
                            htmlFor={`shotTracking-${ageGroup}`} 
                            className="text-sm text-text-primary cursor-pointer font-normal"
                          >
                            {ageGroup}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Override Controls for Selected Age Groups */}
                {getAgeGroupsWithOverride('shotTrackingEnabled').length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-text-primary block">
                      Override settings:
                    </Label>
                    {getAgeGroupsWithOverride('shotTrackingEnabled').map(ageGroup => (
                      <div key={ageGroup} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                        <Label className="text-text-primary font-semibold">{ageGroup}</Label>
                        <div className="flex items-center gap-2">
                          <StandardButton 
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetOverride(ageGroup, 'shotTrackingEnabled')}
                            className="text-xs h-7 px-2"
                          >
                            Reset
                          </StandardButton>
                          <span className="text-xs text-text-secondary min-w-[80px] text-right">
                            {getAgeGroupOverride(ageGroup, 'shotTrackingEnabled') ? 'On' : 'Off'}
                          </span>
                          <Switch
                            checked={getAgeGroupOverride(ageGroup, 'shotTrackingEnabled') ?? false}
                            onCheckedChange={(checked) => handleAgeGroupOverrideToggle(ageGroup, 'shotTrackingEnabled', checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Position-Specific Metrics */}
          <div className={`p-4 rounded-xl bg-bg-primary/50 border ${getFeatureBorderColor('positionSpecificMetricsEnabled')} hover:shadow-md transition-all duration-200`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 bg-gradient-to-r ${getFeatureColor('positionSpecificMetricsEnabled')} rounded-xl flex items-center justify-center shadow-lg`}>
                  <BarChart3 className="w-6 h-6 text-text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="font-bold text-lg text-text-primary">Position-Specific Metrics</Label>
                  <p className="text-sm text-text-secondary mt-1">
                    Enable position-specific metrics for all teams (can be overridden per age group)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`${
                    localConfig.features.positionSpecificMetricsEnabled 
                      ? 'bg-success/10 text-success border-green-500/30' 
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}
                >
                  {localConfig.features.positionSpecificMetricsEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Switch
                  checked={localConfig.features.positionSpecificMetricsEnabled}
                  onCheckedChange={(checked) => handleGlobalFeatureToggle('positionSpecificMetricsEnabled', checked)}
                />
              </div>
            </div>
            
            {/* Age Group Overrides */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors w-full">
                <ChevronDown className="w-4 h-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                <span>Override for specific age groups</span>
                {getAgeGroupsWithOverride('positionSpecificMetricsEnabled').length > 0 && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {getAgeGroupsWithOverride('positionSpecificMetricsEnabled').length} override{getAgeGroupsWithOverride('positionSpecificMetricsEnabled').length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {/* Age Group Checkboxes */}
                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <Label className="text-sm font-semibold text-text-primary mb-3 block">
                    Select age groups to override:
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {AGE_GROUPS.map(ageGroup => {
                      const hasOverride = getAgeGroupsWithOverride('positionSpecificMetricsEnabled').includes(ageGroup);
                      return (
                        <div key={ageGroup} className="flex items-center gap-2">
                          <Checkbox
                            id={`positionMetrics-${ageGroup}`}
                            checked={hasOverride}
                            onCheckedChange={(checked) => handleAgeGroupOverrideSelect('positionSpecificMetricsEnabled', ageGroup, checked)}
                            className="border-slate-600 data-[state=checked]:bg-accent-primary data-[state=checked]:border-accent-primary"
                          />
                          <Label 
                            htmlFor={`positionMetrics-${ageGroup}`} 
                            className="text-sm text-text-primary cursor-pointer font-normal"
                          >
                            {ageGroup}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Override Controls for Selected Age Groups */}
                {getAgeGroupsWithOverride('positionSpecificMetricsEnabled').length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-text-primary block">
                      Override settings:
                    </Label>
                    {getAgeGroupsWithOverride('positionSpecificMetricsEnabled').map(ageGroup => (
                      <div key={ageGroup} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                        <Label className="text-text-primary font-semibold">{ageGroup}</Label>
                        <div className="flex items-center gap-2">
                          <StandardButton 
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetOverride(ageGroup, 'positionSpecificMetricsEnabled')}
                            className="text-xs h-7 px-2"
                          >
                            Reset
                          </StandardButton>
                          <span className="text-xs text-text-secondary min-w-[80px] text-right">
                            {getAgeGroupOverride(ageGroup, 'positionSpecificMetricsEnabled') ? 'On' : 'Off'}
                          </span>
                          <Switch
                            checked={getAgeGroupOverride(ageGroup, 'positionSpecificMetricsEnabled') ?? false}
                            onCheckedChange={(checked) => handleAgeGroupOverrideToggle(ageGroup, 'positionSpecificMetricsEnabled', checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Detailed Disciplinary Tracking */}
          <div className={`p-4 rounded-xl bg-bg-primary/50 border ${getFeatureBorderColor('detailedDisciplinaryEnabled')} hover:shadow-md transition-all duration-200`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 bg-gradient-to-r ${getFeatureColor('detailedDisciplinaryEnabled')} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Shield className="w-6 h-6 text-text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="font-bold text-lg text-text-primary">Detailed Disciplinary Tracking</Label>
                  <p className="text-sm text-text-secondary mt-1">
                    Track fouls committed/received in addition to cards
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`${
                    localConfig.features.detailedDisciplinaryEnabled 
                      ? 'bg-success/10 text-success border-green-500/30' 
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}
                >
                  {localConfig.features.detailedDisciplinaryEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Switch
                  checked={localConfig.features.detailedDisciplinaryEnabled}
                  onCheckedChange={(checked) => handleGlobalFeatureToggle('detailedDisciplinaryEnabled', checked)}
                />
              </div>
            </div>
            
            {/* Age Group Overrides */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors w-full">
                <ChevronDown className="w-4 h-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                <span>Override for specific age groups</span>
                {getAgeGroupsWithOverride('detailedDisciplinaryEnabled').length > 0 && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {getAgeGroupsWithOverride('detailedDisciplinaryEnabled').length} override{getAgeGroupsWithOverride('detailedDisciplinaryEnabled').length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {/* Age Group Checkboxes */}
                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <Label className="text-sm font-semibold text-text-primary mb-3 block">
                    Select age groups to override:
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {AGE_GROUPS.map(ageGroup => {
                      const hasOverride = getAgeGroupsWithOverride('detailedDisciplinaryEnabled').includes(ageGroup);
                      return (
                        <div key={ageGroup} className="flex items-center gap-2">
                          <Checkbox
                            id={`disciplinary-${ageGroup}`}
                            checked={hasOverride}
                            onCheckedChange={(checked) => handleAgeGroupOverrideSelect('detailedDisciplinaryEnabled', ageGroup, checked)}
                            className="border-slate-600 data-[state=checked]:bg-accent-primary data-[state=checked]:border-accent-primary"
                          />
                          <Label 
                            htmlFor={`disciplinary-${ageGroup}`} 
                            className="text-sm text-text-primary cursor-pointer font-normal"
                          >
                            {ageGroup}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Override Controls for Selected Age Groups */}
                {getAgeGroupsWithOverride('detailedDisciplinaryEnabled').length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-text-primary block">
                      Override settings:
                    </Label>
                    {getAgeGroupsWithOverride('detailedDisciplinaryEnabled').map(ageGroup => (
                      <div key={ageGroup} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                        <Label className="text-text-primary font-semibold">{ageGroup}</Label>
                        <div className="flex items-center gap-2">
                          <StandardButton 
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetOverride(ageGroup, 'detailedDisciplinaryEnabled')}
                            className="text-xs h-7 px-2"
                          >
                            Reset
                          </StandardButton>
                          <span className="text-xs text-text-secondary min-w-[80px] text-right">
                            {getAgeGroupOverride(ageGroup, 'detailedDisciplinaryEnabled') ? 'On' : 'Off'}
                          </span>
                          <Switch
                            checked={getAgeGroupOverride(ageGroup, 'detailedDisciplinaryEnabled') ?? false}
                            onCheckedChange={(checked) => handleAgeGroupOverrideToggle(ageGroup, 'detailedDisciplinaryEnabled', checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Goal Involvement Tracking */}
          <div className={`p-4 rounded-xl bg-bg-primary/50 border ${getFeatureBorderColor('goalInvolvementEnabled')} hover:shadow-md transition-all duration-200`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 bg-gradient-to-r ${getFeatureColor('goalInvolvementEnabled')} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Zap className="w-6 h-6 text-text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="font-bold text-lg text-text-primary">Goal Involvement Tracking</Label>
                  <p className="text-sm text-text-secondary mt-1">
                    Track indirect goal contributors (pre-assists, etc.)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`${
                    localConfig.features.goalInvolvementEnabled 
                      ? 'bg-success/10 text-success border-green-500/30' 
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}
                >
                  {localConfig.features.goalInvolvementEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Switch
                  checked={localConfig.features.goalInvolvementEnabled}
                  onCheckedChange={(checked) => handleGlobalFeatureToggle('goalInvolvementEnabled', checked)}
                />
              </div>
            </div>
            
            {/* Age Group Overrides */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors w-full">
                <ChevronDown className="w-4 h-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                <span>Override for specific age groups</span>
                {getAgeGroupsWithOverride('goalInvolvementEnabled').length > 0 && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {getAgeGroupsWithOverride('goalInvolvementEnabled').length} override{getAgeGroupsWithOverride('goalInvolvementEnabled').length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {/* Age Group Checkboxes */}
                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <Label className="text-sm font-semibold text-text-primary mb-3 block">
                    Select age groups to override:
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {AGE_GROUPS.map(ageGroup => {
                      const hasOverride = getAgeGroupsWithOverride('goalInvolvementEnabled').includes(ageGroup);
                      return (
                        <div key={ageGroup} className="flex items-center gap-2">
                          <Checkbox
                            id={`goalInvolvement-${ageGroup}`}
                            checked={hasOverride}
                            onCheckedChange={(checked) => handleAgeGroupOverrideSelect('goalInvolvementEnabled', ageGroup, checked)}
                            className="border-slate-600 data-[state=checked]:bg-accent-primary data-[state=checked]:border-accent-primary"
                          />
                          <Label 
                            htmlFor={`goalInvolvement-${ageGroup}`} 
                            className="text-sm text-text-primary cursor-pointer font-normal"
                          >
                            {ageGroup}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Override Controls for Selected Age Groups */}
                {getAgeGroupsWithOverride('goalInvolvementEnabled').length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-text-primary block">
                      Override settings:
                    </Label>
                    {getAgeGroupsWithOverride('goalInvolvementEnabled').map(ageGroup => (
                      <div key={ageGroup} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                        <Label className="text-text-primary font-semibold">{ageGroup}</Label>
                        <div className="flex items-center gap-2">
                          <StandardButton 
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetOverride(ageGroup, 'goalInvolvementEnabled')}
                            className="text-xs h-7 px-2"
                          >
                            Reset
                          </StandardButton>
                          <span className="text-xs text-text-secondary min-w-[80px] text-right">
                            {getAgeGroupOverride(ageGroup, 'goalInvolvementEnabled') ? 'On' : 'Off'}
                          </span>
                          <Switch
                            checked={getAgeGroupOverride(ageGroup, 'goalInvolvementEnabled') ?? false}
                            onCheckedChange={(checked) => handleAgeGroupOverrideToggle(ageGroup, 'goalInvolvementEnabled', checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </DataCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <StandardButton 
          onClick={handleSave} 
          disabled={isSaving}
          icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </StandardButton>
      </div>
    </div>
  );
}
