import React, { useState, useEffect } from "react";
import { 
  Settings,
  Save,
  Loader2,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Alert, AlertDescription } from "@/shared/ui/primitives/alert";
import { Button } from "@/shared/ui/primitives/button";
import { Switch } from "@/shared/ui/primitives/switch";
import { Label } from "@/shared/ui/primitives/label";
import { useData } from "@/app/providers/DataProvider";
import { useUserRole } from "@/shared/hooks/useUserRole";
import { User } from "@/api/entities";

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organizations/default/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
      <Alert>
        <AlertDescription>
          Only administrators can modify organization settings.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoadingConfig || !localConfig) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saveMessage && (
        <Alert className={saveMessage.type === 'success' ? 'bg-green-500/10 border-green-500' : saveMessage.type === 'info' ? 'bg-blue-500/10 border-blue-500' : 'bg-red-500/10 border-red-500'}>
          <AlertDescription>{saveMessage.text}</AlertDescription>
        </Alert>
      )}

      {/* Global Features Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Global Feature Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-semibold">Shot Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Enable shot tracking for all teams (can be overridden per age group)
              </p>
            </div>
            <Switch
              checked={localConfig.features.shotTrackingEnabled}
              onCheckedChange={(checked) => handleGlobalFeatureToggle('shotTrackingEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-semibold">Position-Specific Metrics</Label>
              <p className="text-sm text-muted-foreground">
                Enable position-specific metrics for all teams (can be overridden per age group)
              </p>
            </div>
            <Switch
              checked={localConfig.features.positionSpecificMetricsEnabled}
              onCheckedChange={(checked) => handleGlobalFeatureToggle('positionSpecificMetricsEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-semibold">Detailed Disciplinary Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Track fouls committed/received in addition to cards
              </p>
            </div>
            <Switch
              checked={localConfig.features.detailedDisciplinaryEnabled}
              onCheckedChange={(checked) => handleGlobalFeatureToggle('detailedDisciplinaryEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-semibold">Goal Involvement Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Track indirect goal contributors (pre-assists, etc.)
              </p>
            </div>
            <Switch
              checked={localConfig.features.goalInvolvementEnabled}
              onCheckedChange={(checked) => handleGlobalFeatureToggle('goalInvolvementEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Age Group Overrides Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Age Group Overrides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Override global settings for specific age groups. Click "Reset" to use the global setting for that age group.
          </p>
          
          <div className="space-y-4">
            {AGE_GROUPS.map(ageGroup => (
              <div key={ageGroup} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">{ageGroup}</h4>
                
                <div className="space-y-3">
                  {/* Shot Tracking Override */}
                  <div className="flex items-center justify-between">
                    <Label>Shot Tracking</Label>
                    <div className="flex items-center gap-2">
                      {getAgeGroupOverride(ageGroup, 'shotTrackingEnabled') !== null && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleResetOverride(ageGroup, 'shotTrackingEnabled')}
                          className="text-xs h-6 px-2"
                        >
                          Reset
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground min-w-[80px]">
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
                  <div className="flex items-center justify-between">
                    <Label>Position Metrics</Label>
                    <div className="flex items-center gap-2">
                      {getAgeGroupOverride(ageGroup, 'positionSpecificMetricsEnabled') !== null && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleResetOverride(ageGroup, 'positionSpecificMetricsEnabled')}
                          className="text-xs h-6 px-2"
                        >
                          Reset
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground min-w-[80px]">
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

