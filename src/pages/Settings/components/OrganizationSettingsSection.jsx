import React, { useState, useEffect } from "react";
import { 
  Settings,
  Save,
  Loader2,
  Users,
  Target,
  BarChart3,
  Shield,
  Zap,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Badge } from "@/shared/ui/primitives/badge";
import { Switch } from "@/shared/ui/primitives/switch";
import { Label } from "@/shared/ui/primitives/label";
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
      setLocalConfig({
        features: { ...organizationConfig.features },
        ageGroupOverrides: [...(organizationConfig.ageGroupOverrides || [])]
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
          key => key !== 'ageGroup' && overrides[existingIndex][key] !== null
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
      const response = await fetch('http://localhost:3001/api/organizations/default/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          features: localConfig.features,
          ageGroupOverrides: localConfig.ageGroupOverrides
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-bg-primary/50 border border-border-custom hover:shadow-md transition-all duration-200">
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

          {/* Position-Specific Metrics */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-bg-primary/50 border border-border-custom hover:shadow-md transition-all duration-200">
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

          {/* Detailed Disciplinary Tracking */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-bg-primary/50 border border-border-custom hover:shadow-md transition-all duration-200">
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

          {/* Goal Involvement Tracking */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-bg-primary/50 border border-border-custom hover:shadow-md transition-all duration-200">
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
        </div>
      </DataCard>

      {/* Age Group Overrides Section */}
      <Card className="bg-bg-secondary/70 border-border-custom shadow-xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
            <Users className="w-6 h-6 text-accent-primary" />
            Age Group Overrides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary mb-6">
            Override global settings for specific age groups. Click "Reset" to use the global setting for that age group.
          </p>
          
          <div className="space-y-4">
            {AGE_GROUPS.map(ageGroup => (
              <div key={ageGroup} className="p-4 rounded-xl bg-bg-primary/50 border border-border-custom hover:shadow-md transition-all duration-200">
                <h4 className="font-bold text-lg text-text-primary mb-4">{ageGroup}</h4>
                
                <div className="space-y-3">
                  {/* Shot Tracking Override */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <Label className="text-text-primary font-semibold">Shot Tracking</Label>
                    <div className="flex items-center gap-2">
                      {getAgeGroupOverride(ageGroup, 'shotTrackingEnabled') !== null && (
                        <StandardButton 
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetOverride(ageGroup, 'shotTrackingEnabled')}
                          className="text-xs h-7 px-2"
                        >
                          Reset
                        </StandardButton>
                      )}
                      <span className="text-xs text-text-secondary min-w-[100px] text-right">
                        {getAgeGroupOverride(ageGroup, 'shotTrackingEnabled') === null 
                          ? `Global (${localConfig.features.shotTrackingEnabled ? 'On' : 'Off'})` 
                          : getAgeGroupOverride(ageGroup, 'shotTrackingEnabled') 
                            ? 'Override: On' 
                            : 'Override: Off'}
                      </span>
                      <Switch
                        checked={getAgeGroupOverride(ageGroup, 'shotTrackingEnabled') ?? localConfig.features.shotTrackingEnabled}
                        onCheckedChange={(checked) => handleAgeGroupOverrideToggle(ageGroup, 'shotTrackingEnabled', checked)}
                      />
                    </div>
                  </div>
                  
                  {/* Position Metrics Override */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <Label className="text-text-primary font-semibold">Position Metrics</Label>
                    <div className="flex items-center gap-2">
                      {getAgeGroupOverride(ageGroup, 'positionSpecificMetricsEnabled') !== null && (
                        <StandardButton 
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetOverride(ageGroup, 'positionSpecificMetricsEnabled')}
                          className="text-xs h-7 px-2"
                        >
                          Reset
                        </StandardButton>
                      )}
                      <span className="text-xs text-text-secondary min-w-[100px] text-right">
                        {getAgeGroupOverride(ageGroup, 'positionSpecificMetricsEnabled') === null 
                          ? `Global (${localConfig.features.positionSpecificMetricsEnabled ? 'On' : 'Off'})` 
                          : getAgeGroupOverride(ageGroup, 'positionSpecificMetricsEnabled') 
                            ? 'Override: On' 
                            : 'Override: Off'}
                      </span>
                      <Switch
                        checked={getAgeGroupOverride(ageGroup, 'positionSpecificMetricsEnabled') ?? localConfig.features.positionSpecificMetricsEnabled}
                        onCheckedChange={(checked) => handleAgeGroupOverrideToggle(ageGroup, 'positionSpecificMetricsEnabled', checked)}
                      />
                    </div>
                  </div>
                  
                  {/* Detailed Disciplinary Override */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <Label className="text-text-primary font-semibold">Detailed Disciplinary</Label>
                    <div className="flex items-center gap-2">
                      {getAgeGroupOverride(ageGroup, 'detailedDisciplinaryEnabled') !== null && (
                        <StandardButton 
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetOverride(ageGroup, 'detailedDisciplinaryEnabled')}
                          className="text-xs h-7 px-2"
                        >
                          Reset
                        </StandardButton>
                      )}
                      <span className="text-xs text-text-secondary min-w-[100px] text-right">
                        {getAgeGroupOverride(ageGroup, 'detailedDisciplinaryEnabled') === null 
                          ? `Global (${localConfig.features.detailedDisciplinaryEnabled ? 'On' : 'Off'})` 
                          : getAgeGroupOverride(ageGroup, 'detailedDisciplinaryEnabled') 
                            ? 'Override: On' 
                            : 'Override: Off'}
                      </span>
                      <Switch
                        checked={getAgeGroupOverride(ageGroup, 'detailedDisciplinaryEnabled') ?? localConfig.features.detailedDisciplinaryEnabled}
                        onCheckedChange={(checked) => handleAgeGroupOverrideToggle(ageGroup, 'detailedDisciplinaryEnabled', checked)}
                      />
                    </div>
                  </div>
                  
                  {/* Goal Involvement Override */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <Label className="text-text-primary font-semibold">Goal Involvement</Label>
                    <div className="flex items-center gap-2">
                      {getAgeGroupOverride(ageGroup, 'goalInvolvementEnabled') !== null && (
                        <StandardButton 
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetOverride(ageGroup, 'goalInvolvementEnabled')}
                          className="text-xs h-7 px-2"
                        >
                          Reset
                        </StandardButton>
                      )}
                      <span className="text-xs text-text-secondary min-w-[100px] text-right">
                        {getAgeGroupOverride(ageGroup, 'goalInvolvementEnabled') === null 
                          ? `Global (${localConfig.features.goalInvolvementEnabled ? 'On' : 'Off'})` 
                          : getAgeGroupOverride(ageGroup, 'goalInvolvementEnabled') 
                            ? 'Override: On' 
                            : 'Override: Off'}
                      </span>
                      <Switch
                        checked={getAgeGroupOverride(ageGroup, 'goalInvolvementEnabled') ?? localConfig.features.goalInvolvementEnabled}
                        onCheckedChange={(checked) => handleAgeGroupOverrideToggle(ageGroup, 'goalInvolvementEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
