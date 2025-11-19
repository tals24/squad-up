# Implementation Plan: Organization Configuration System

**Document Version:** 1.1 (Updated)  
**Date:** December 2024  
**Status:** Planning Phase - Reviewed & Enhanced  
**Priority:** High (Foundation for Optional Features)

---

## Executive Summary

This document outlines the implementation plan for a database-driven configuration system that enables/disables optional features (Shot Tracking, Position Metrics, etc.) at the organization level with optional age group overrides.

**Goal:** Build the "Switchboard" that controls feature availability without implementing the optional features themselves.

### Changes in v1.1 (Review Update)

This version incorporates feedback from comprehensive code review:

**Critical Fixes:**
- ✅ Fixed schema redundancy (removed manual `createdAt`/`updatedAt`)
- ✅ Added duplicate age group validation
- ✅ Fixed GET endpoint auto-creation (now returns defaults without saving)

**Performance & Code Quality:**
- ✅ Extracted shared `inferAgeGroupFromTeam()` utility
- ✅ Optimized `useFeature` hook with memoized team map
- ✅ Added save validation before PUT requests

**UX Improvements:**
- ✅ Added "Reset to Global" buttons for age group overrides
- ✅ Improved override status labels (shows "Global (On/Off)" vs "Override: On/Off")
- ✅ Added no-changes detection and warning for all features disabled

**Production Readiness:**
- ✅ Added migration script with rollback strategy
- ✅ Expanded testing section with detailed test cases
- ✅ Added documentation update checklist

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    OrganizationConfig                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Global Features (defaults for all teams)            │   │
│  │  - shotTrackingEnabled: false                       │   │
│  │  - positionMetricsEnabled: false                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Age Group Overrides (optional per age group)        │   │
│  │  [{ ageGroup: 'U14-U16', shotTrackingEnabled: true }]│   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Priority Logic:
                          │ 1. Check Age Group Override
                          │ 2. Fallback to Global Feature
                          ▼
              ┌───────────────────────────┐
              │   useFeature Hook         │
              │   (featureName, teamId)   │
              └───────────────────────────┘
```

---

## Phase 1: Backend Foundation

### 1.1 Database Model: OrganizationConfig

**File:** `backend/src/models/OrganizationConfig.js`

#### Schema Structure

```javascript
const mongoose = require('mongoose');

const organizationConfigSchema = new mongoose.Schema({
  // Link to Organization (for multi-org support in future)
  // For now, we'll use a single default organization
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization', // Optional - can be null for single-org
    default: null,
    unique: true, // Only one config per organization
    sparse: true // Allow null values
  },

  // Global Feature Toggles (defaults for all teams)
  features: {
    shotTrackingEnabled: {
      type: Boolean,
      default: false
    },
    positionSpecificMetricsEnabled: {
      type: Boolean,
      default: false
    },
    detailedDisciplinaryEnabled: {
      type: Boolean,
      default: true // Enabled by default (already implemented)
    },
    goalInvolvementEnabled: {
      type: Boolean,
      default: true // Enabled by default (already implemented)
    }
  },

  // Age Group Overrides (optional per age group)
  ageGroupOverrides: [{
    ageGroup: {
      type: String,
      required: true,
      enum: ['U6-U8', 'U8-U10', 'U10-U12', 'U12-U14', 'U14-U16', 'U16+']
    },
    shotTrackingEnabled: {
      type: Boolean,
      default: null // null = use global default
    },
    positionSpecificMetricsEnabled: {
      type: Boolean,
      default: null // null = use global default
    }
  }]
}, {
  timestamps: true // Auto-creates createdAt and updatedAt
});

// Indexes
organizationConfigSchema.index({ organizationId: 1 }, { unique: true, sparse: true });

// Pre-save validation: Prevent duplicate age groups
organizationConfigSchema.pre('save', function(next) {
  const ageGroups = this.ageGroupOverrides.map(o => o.ageGroup);
  const uniqueAgeGroups = [...new Set(ageGroups)];
  
  if (ageGroups.length !== uniqueAgeGroups.length) {
    return next(new Error('Duplicate age group overrides are not allowed'));
  }
  
  next();
});

module.exports = mongoose.model('OrganizationConfig', organizationConfigSchema, 'organization_configs');
```

#### Key Design Decisions

1. **Single Organization Support (Initial):**
   - `organizationId` can be `null` for single-org deployments
   - `unique: true, sparse: true` ensures only one config exists
   - Future: Can add `Organization` model and link teams to organizations

2. **Age Group Overrides:**
   - Stored as array of objects with `ageGroup` string
   - `null` values mean "use global default"
   - Only override fields that differ from global

3. **Default Values:**
   - `shotTrackingEnabled: false` (opt-in feature)
   - `positionSpecificMetricsEnabled: false` (opt-in feature)
   - `detailedDisciplinaryEnabled: true` (already implemented)
   - `goalInvolvementEnabled: true` (already implemented)

---

### 1.2 Shared Utilities

**File:** `backend/src/utils/ageGroupUtils.js` (New)

Create shared utility for age group inference to avoid code duplication:

```javascript
/**
 * Infer age group from team name
 * @param {Object} team - Team object with teamName
 * @returns {string|null} - Age group string or null if not found
 */
function inferAgeGroupFromTeam(team) {
  // Option 1: Parse from teamName (e.g., "U14 Team A" -> "U14-U16")
  const teamName = team.teamName || '';
  const ageMatch = teamName.match(/U(\d+)/i);
  
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    if (age <= 8) return 'U6-U8';
    if (age <= 10) return 'U8-U10';
    if (age <= 12) return 'U10-U12';
    if (age <= 14) return 'U12-U14';
    if (age <= 16) return 'U14-U16';
    return 'U16+';
  }
  
  // Option 2: Check division field (if it contains age info)
  // const division = team.division || '';
  // const divMatch = division.match(/U(\d+)/i);
  // if (divMatch) { /* same logic as above */ }
  
  // Option 3: Use explicit ageGroupId field (future enhancement)
  // if (team.ageGroupId) return team.ageGroupId;
  
  return null; // No age group found
}

module.exports = { inferAgeGroupFromTeam };
```

---

### 1.3 API Routes: Organization Configuration

**File:** `backend/src/routes/organizationConfigs.js`

#### Route Structure

```javascript
const express = require('express');
const { authenticateJWT, requireRole } = require('../middleware/jwtAuth');
const OrganizationConfig = require('../models/OrganizationConfig');
const { inferAgeGroupFromTeam } = require('../utils/ageGroupUtils');

const router = express.Router();

/**
 * GET /api/organizations/:orgId/config
 * Get organization configuration
 * Access: All authenticated users (Coaches, Managers, Admins)
 */
router.get('/:orgId/config', authenticateJWT, async (req, res) => {
  try {
    const { orgId } = req.params;
    
    // For single-org: orgId can be 'default' or actual ObjectId
    // If orgId is 'default', find config with null organizationId
    const query = orgId === 'default' || orgId === 'null' 
      ? { organizationId: null } 
      : { organizationId: orgId };

    let config = await OrganizationConfig.findOne(query);

    // If no config exists, return default values WITHOUT saving
    // This follows REST principles (GET should not modify data)
    if (!config) {
      return res.json({
        success: true,
        data: {
          _id: null, // Indicates this is not saved
          organizationId: orgId === 'default' || orgId === 'null' ? null : orgId,
          features: {
            shotTrackingEnabled: false,
            positionSpecificMetricsEnabled: false,
            detailedDisciplinaryEnabled: true,
            goalInvolvementEnabled: true
          },
          ageGroupOverrides: [],
          isDefault: true, // Flag to indicate this is a default response
          createdAt: null,
          updatedAt: null
        }
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get organization config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization configuration'
    });
  }
});

/**
 * PUT /api/organizations/:orgId/config
 * Update organization configuration
 * Access: Admin only
 */
router.put('/:orgId/config', authenticateJWT, requireRole(['Admin']), async (req, res) => {
  try {
    const { orgId } = req.params;
    const { features, ageGroupOverrides } = req.body;

    // Validate request body
    if (!features && !ageGroupOverrides) {
      return res.status(400).json({
        success: false,
        error: 'Must provide features or ageGroupOverrides'
      });
    }

    const query = orgId === 'default' || orgId === 'null' 
      ? { organizationId: null } 
      : { organizationId: orgId };

    // Find or create config
    let config = await OrganizationConfig.findOne(query);

    if (!config) {
      config = await OrganizationConfig.create({
        organizationId: orgId === 'default' || orgId === 'null' ? null : orgId,
        features: features || {
          shotTrackingEnabled: false,
          positionSpecificMetricsEnabled: false,
          detailedDisciplinaryEnabled: true,
          goalInvolvementEnabled: true
        },
        ageGroupOverrides: ageGroupOverrides || []
      });
    } else {
      // Update existing config
      if (features) {
        config.features = { ...config.features, ...features };
      }
      if (ageGroupOverrides) {
        config.ageGroupOverrides = ageGroupOverrides;
      }
      await config.save();
    }

    res.json({
      success: true,
      data: config,
      message: 'Organization configuration updated successfully'
    });
  } catch (error) {
    console.error('Update organization config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organization configuration'
    });
  }
});

/**
 * GET /api/organizations/:orgId/config/feature/:featureName
 * Check if a specific feature is enabled (for a team/age group)
 * Access: All authenticated users
 * Query params: ?teamId=xxx (optional, for age group override check)
 */
router.get('/:orgId/config/feature/:featureName', authenticateJWT, async (req, res) => {
  try {
    const { orgId, featureName } = req.params;
    const { teamId } = req.query;

    const query = orgId === 'default' || orgId === 'null' 
      ? { organizationId: null } 
      : { organizationId: orgId };

    const config = await OrganizationConfig.findOne(query);

    if (!config) {
      // Return default values if config doesn't exist
      const defaultFeatures = {
        shotTrackingEnabled: false,
        positionSpecificMetricsEnabled: false,
        detailedDisciplinaryEnabled: true,
        goalInvolvementEnabled: true
      };
      return res.json({
        success: true,
        data: {
          enabled: defaultFeatures[featureName] || false
        }
      });
    }

    // Get global feature value
    let enabled = config.features[featureName] || false;

    // If teamId provided, check for age group override
    if (teamId) {
      const Team = require('../models/Team');
      const team = await Team.findById(teamId);
      
      if (team) {
        // Infer age group from team name or division
        // Example: "U14 Team A" -> ageGroup = "U14-U16"
        // Or: Check if team has ageGroup field (future enhancement)
        const ageGroup = inferAgeGroupFromTeam(team);
        
        if (ageGroup) {
          const override = config.ageGroupOverrides.find(
            o => o.ageGroup === ageGroup
          );
          
          if (override && override[featureName] !== null && override[featureName] !== undefined) {
            enabled = override[featureName];
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        enabled
      }
    });
  } catch (error) {
    console.error('Check feature enabled error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feature status'
    });
  }
});

module.exports = router;
```

#### Route Registration

**File:** `backend/src/app.js`

Add after other route imports:

```javascript
const organizationConfigRoutes = require('./routes/organizationConfigs');
```

Add after other route registrations:

```javascript
app.use('/api/organizations', organizationConfigRoutes);
```

---

### 1.4 Authorization & Security

**Authorization Rules:**

1. **GET `/api/organizations/:orgId/config`:**
   - Access: All authenticated users (`authenticateJWT`)
   - Reason: Coaches need to read config to conditionally render features

2. **PUT `/api/organizations/:orgId/config`:**
   - Access: Admin only (`requireRole(['Admin'])`)
   - Reason: Only admins should modify feature toggles

3. **GET `/api/organizations/:orgId/config/feature/:featureName`:**
   - Access: All authenticated users
   - Reason: Components need to check feature status

---

## Phase 2: Frontend Integration

### 2.1 Config Provider

**Option A: Extend DataProvider (Recommended)**

**File:** `src/app/providers/DataProvider.jsx`

Add to existing DataProvider:

```javascript
// Add to state
const [organizationConfig, setOrganizationConfig] = useState(null);
const [isLoadingConfig, setIsLoadingConfig] = useState(true);

// Add fetch function
const fetchOrganizationConfig = async () => {
  try {
    setIsLoadingConfig(true);
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organizations/default/config`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch config');
    
    const result = await response.json();
    setOrganizationConfig(result.data);
  } catch (error) {
    console.error('Failed to fetch organization config:', error);
    // Set default config on error
    setOrganizationConfig({
      features: {
        shotTrackingEnabled: false,
        positionSpecificMetricsEnabled: false,
        detailedDisciplinaryEnabled: true,
        goalInvolvementEnabled: true
      },
      ageGroupOverrides: []
    });
  } finally {
    setIsLoadingConfig(false);
  }
};

// Add to useEffect (fetch on mount)
useEffect(() => {
  fetchData();
  fetchOrganizationConfig(); // Add this
}, []);

// Add to context value
const value = {
  ...data,
  isLoading,
  error,
  refreshData: fetchData,
  organizationConfig,        // Add this
  isLoadingConfig,          // Add this
  refreshConfig: fetchOrganizationConfig // Add this
};
```

**Option B: Separate ConfigProvider**

**File:** `src/app/providers/ConfigProvider.jsx` (New)

```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';

const ConfigContext = createContext(null);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [organizationConfig, setOrganizationConfig] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const fetchOrganizationConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organizations/default/config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch config');
      
      const result = await response.json();
      setOrganizationConfig(result.data);
    } catch (error) {
      console.error('Failed to fetch organization config:', error);
      // Set default config on error
      setOrganizationConfig({
        features: {
          shotTrackingEnabled: false,
          positionSpecificMetricsEnabled: false,
          detailedDisciplinaryEnabled: true,
          goalInvolvementEnabled: true
        },
        ageGroupOverrides: []
      });
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchOrganizationConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{
      organizationConfig,
      isLoadingConfig,
      refreshConfig: fetchOrganizationConfig
    }}>
      {children}
    </ConfigContext.Provider>
  );
};
```

**Recommendation:** Use Option A (extend DataProvider) to keep all data in one place.

---

### 2.2 useFeature Hook

**File:** `src/hooks/useFeature.js` (New)

```javascript
import { useMemo } from 'react';
import { useData } from '@/app/providers/DataProvider';
// OR if using separate ConfigProvider:
// import { useConfig } from '@/app/providers/ConfigProvider';

/**
 * Hook to check if a feature is enabled for a specific team
 * 
 * Priority Logic:
 * 1. Check Age Group Override (if teamId provided)
 * 2. Fallback to Global Feature Setting
 * 
 * Performance: Uses memoized age group map to avoid repeated team lookups
 * 
 * @param {string} featureName - Feature name (e.g., 'shotTrackingEnabled')
 * @param {string|null} teamId - Optional team ID to check age group override
 * @returns {boolean} - Whether the feature is enabled
 */
export const useFeature = (featureName, teamId = null) => {
  const { organizationConfig, teams } = useData();
  // OR if using separate ConfigProvider:
  // const { organizationConfig } = useConfig();
  // const { teams } = useData();

  // Performance optimization: Cache age group lookups
  const teamAgeGroupMap = useMemo(() => {
    const map = new Map();
    teams.forEach(team => {
      const ageGroup = inferAgeGroupFromTeam(team);
      if (ageGroup) {
        // Store by both _id and teamID for flexible lookup
        map.set(team._id, ageGroup);
        if (team.teamID) {
          map.set(team.teamID, ageGroup);
        }
      }
    });
    return map;
  }, [teams]);

  return useMemo(() => {
    // If config not loaded, return false (safe default)
    if (!organizationConfig) {
      return false;
    }

    // Get global feature value
    const globalEnabled = organizationConfig.features[featureName] || false;

    // If no teamId provided, return global value
    if (!teamId) {
      return globalEnabled;
    }

    // Get age group from cached map
    const ageGroup = teamAgeGroupMap.get(teamId);
    
    if (!ageGroup) {
      // No age group found, return global value
      return globalEnabled;
    }

    // Check for age group override
    const override = organizationConfig.ageGroupOverrides?.find(
      o => o.ageGroup === ageGroup
    );

    if (override && override[featureName] !== null && override[featureName] !== undefined) {
      // Age group override exists and is not null
      return override[featureName];
    }

    // No override found, return global value
    return globalEnabled;
  }, [featureName, teamId, organizationConfig, teamAgeGroupMap]);
};

/**
 * Helper function to infer age group from team
 * Matches backend logic
 */
function inferAgeGroupFromTeam(team) {
  // Option 1: Parse from teamName (e.g., "U14 Team A" -> "U14-U16")
  const teamName = team.teamName || '';
  const ageMatch = teamName.match(/U(\d+)/i);
  
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    if (age <= 8) return 'U6-U8';
    if (age <= 10) return 'U8-U10';
    if (age <= 12) return 'U10-U12';
    if (age <= 14) return 'U12-U14';
    if (age <= 16) return 'U14-U16';
    return 'U16+';
  }
  
  // Option 2: Check division field (if it contains age info)
  // Option 3: Check team.ageGroupId (future enhancement)
  
  return null;
}
```

#### Usage Example

```javascript
import { useFeature } from '@/hooks/useFeature';

function PlayerPerformanceDialog({ player, game }) {
  const showShotTracking = useFeature('shotTrackingEnabled', game.team);
  const showPositionMetrics = useFeature('positionSpecificMetricsEnabled', game.team);

  return (
    <Dialog>
      {/* Basic stats */}
      
      {showShotTracking && (
        <ShotTrackingSection player={player} />
      )}
      
      {showPositionMetrics && (
        <PositionMetricsSection player={player} />
      )}
    </Dialog>
  );
}
```

---

## Phase 3: UI Implementation

### 3.1 Admin Settings Page

**File:** `src/pages/Settings/components/OrganizationSettingsSection.jsx` (Modify existing)

Replace placeholder with functional component:

```javascript
import React, { useState, useEffect } from 'react';
import { useData } from '@/app/providers/DataProvider';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/primitives/card';
import { Button } from '@/shared/ui/primitives/button';
import { Switch } from '@/shared/ui/primitives/switch';
import { Label } from '@/shared/ui/primitives/label';
import { Alert, AlertDescription } from '@/shared/ui/primitives/alert';
import { Settings, Save, Loader2 } from 'lucide-react';

const AGE_GROUPS = ['U6-U8', 'U8-U10', 'U10-U12', 'U12-U14', 'U14-U16', 'U16+'];

export default function OrganizationSettingsSection() {
  const { organizationConfig, isLoadingConfig, refreshConfig } = useData();
  const { userRole } = useUserRole();
  const [localConfig, setLocalConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Check if user is admin
  const isAdmin = userRole === 'Admin' || userRole === 'admin';

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
        <Alert className={saveMessage.type === 'success' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}>
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
          <CardTitle>Age Group Overrides</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Override global settings for specific age groups. Leave unchecked to use global setting.
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
```

---

## Implementation Checklist

### Phase 1: Backend
- [ ] Create `backend/src/models/OrganizationConfig.js`
  - [ ] Add schema with features and ageGroupOverrides
  - [ ] Add duplicate age group validation
  - [ ] Remove redundant createdAt/updatedAt fields (use timestamps: true)
- [ ] Create `backend/src/utils/ageGroupUtils.js` (shared utility)
- [ ] Create `backend/src/routes/organizationConfigs.js`
  - [ ] GET endpoint (return defaults without saving if not exists)
  - [ ] PUT endpoint (admin only)
  - [ ] GET feature check endpoint
- [ ] Register routes in `backend/src/app.js`
- [ ] Create migration script `backend/scripts/initializeOrgConfig.js`
- [ ] Test API endpoints with Postman/curl
- [ ] Update `docs/API_DOCUMENTATION.md`
- [ ] Update `docs/DATABASE_ARCHITECTURE.md`

### Phase 2: Frontend Integration
- [ ] Extend `DataProvider` with `organizationConfig` state
  - [ ] Add `fetchOrganizationConfig()` function
  - [ ] Add `refreshConfig()` function
  - [ ] Handle default config response (isDefault: true)
- [ ] Create `src/hooks/useFeature.js`
  - [ ] Implement priority logic (override > global)
  - [ ] Add performance optimization (memoized team age group map)
  - [ ] Add `inferAgeGroupFromTeam()` helper function
- [ ] Test `useFeature` hook with mock data
- [ ] Test age group override priority logic

### Phase 3: UI Implementation
- [ ] Replace placeholder `OrganizationSettingsSection.jsx`
  - [ ] Add global feature toggles (4 features)
  - [ ] Add age group override table (6 age groups)
  - [ ] Add "Reset to Global" buttons for overrides
  - [ ] Improve override status labels
  - [ ] Add save validation (no changes check)
  - [ ] Add warning for all features disabled
  - [ ] Add loading states
  - [ ] Add success/error/info messages
- [ ] Test admin-only access
- [ ] Test feature toggle persistence
- [ ] Test UX for overrides (clear labeling)

### Testing
#### Backend Tests
- [ ] Test GET /api/organizations/default/config (returns default if not exists)
- [ ] Test PUT /api/organizations/default/config (admin only)
- [ ] Test PUT with non-admin user (should return 403)
- [ ] Test age group override priority logic in GET feature endpoint
- [ ] Test duplicate age group validation (should fail)
- [ ] Test invalid age group enum values (should fail)
- [ ] Test inferAgeGroupFromTeam utility with various team names

#### Frontend Tests
- [ ] Test useFeature hook returns false when config is null
- [ ] Test useFeature hook respects global feature value
- [ ] Test useFeature hook respects age group override
- [ ] Test useFeature hook priority (override > global)
- [ ] Test inferAgeGroupFromTeam with various team names (U6, U10, U14, etc.)
- [ ] Test OrganizationSettingsSection admin-only rendering
- [ ] Test OrganizationSettingsSection save validation
- [ ] Test "Reset to Global" button functionality

#### Integration Tests
- [ ] Test full flow: Admin enables feature → Coach sees feature in UI
- [ ] Test age group override: U14 team sees different config than U10 team
- [ ] Test config persistence across page refreshes
- [ ] Test default config creation on first save

---

## Migration Strategy

### For New Deployments
- Config will be auto-created with default values when admin first accesses Settings page
- First PUT request will create the config with admin's choices

### For Existing Deployments

**Approach:** Run migration script on deployment to ensure config exists

#### Migration Script

**File:** `backend/scripts/initializeOrgConfig.js` (New)

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const OrganizationConfig = require('../src/models/OrganizationConfig');

async function initializeOrgConfig() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if config already exists
    const existingConfig = await OrganizationConfig.findOne({ organizationId: null });
    
    if (!existingConfig) {
      console.log('📝 Creating default organization config...');
      await OrganizationConfig.create({
        organizationId: null,
        features: {
          shotTrackingEnabled: false,
          positionSpecificMetricsEnabled: false,
          detailedDisciplinaryEnabled: true,  // Already implemented
          goalInvolvementEnabled: true        // Already implemented
        },
        ageGroupOverrides: []
      });
      console.log('✅ Organization config initialized with default values');
    } else {
      console.log('ℹ️  Organization config already exists');
      console.log('   Current features:', existingConfig.features);
      console.log('   Age group overrides:', existingConfig.ageGroupOverrides.length);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run migration
initializeOrgConfig()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
```

#### Running the Migration

```bash
# In backend directory
node scripts/initializeOrgConfig.js
```

#### Add to Deployment Process

Add to `package.json` scripts:

```json
{
  "scripts": {
    "migrate": "node scripts/initializeOrgConfig.js",
    "deploy": "npm run migrate && npm start"
  }
}
```

#### Rollback Strategy

If issues arise after deployment:

1. **Disable all optional features:**
```javascript
// Quick fix: Set all optional features to false via MongoDB shell
db.organization_configs.updateOne(
  { organizationId: null },
  { $set: { 
    'features.shotTrackingEnabled': false,
    'features.positionSpecificMetricsEnabled': false
  }}
);
```

2. **Remove config to force defaults:**
```javascript
// Delete config to revert to defaults (returned by GET endpoint)
db.organization_configs.deleteOne({ organizationId: null });
```

3. **Frontend will gracefully handle missing config** by returning `false` for all features

---

## Future Enhancements

1. **Team-Age Group Link:**
   - Add `ageGroupId` field to `Team` model
   - Update `inferAgeGroupFromTeam()` to use explicit link

2. **Multi-Organization Support:**
   - Create `Organization` model
   - Link teams to organizations
   - Add organization selection in UI

3. **Feature History:**
   - Track when features were enabled/disabled
   - Audit log for admin changes

4. **Feature Dependencies:**
   - Define feature dependencies (e.g., Position Metrics requires Shot Tracking)
   - Validate dependencies in API

---

## Notes

### Design Decisions
- **Single Organization:** Current implementation assumes single organization. Can be extended later.
- **Age Group Inference:** Infers from team name (e.g., "U14 Team A" → "U14-U16"). Can be enhanced with explicit `ageGroupId` field in Team model.
- **Default Config:** GET endpoint returns default values WITHOUT saving (follows REST principles).
- **Null Overrides:** Age group overrides with `null` values use global defaults.

### Key Improvements (v1.1)
- **✅ Schema Optimization:** Removed redundant `createdAt`/`updatedAt` fields (use `timestamps: true`)
- **✅ Data Validation:** Added duplicate age group validation in pre-save middleware
- **✅ Shared Utilities:** Extracted `inferAgeGroupFromTeam()` to `backend/src/utils/ageGroupUtils.js`
- **✅ REST Compliance:** GET endpoint no longer auto-creates config (returns defaults instead)
- **✅ Performance:** Added memoized team age group map in `useFeature` hook
- **✅ Better UX:** Added "Reset to Global" buttons and improved override status labels
- **✅ Validation:** Added save validation (no changes check, all features disabled warning)
- **✅ Migration:** Added migration script and rollback strategy
- **✅ Testing:** Expanded test plan with detailed backend, frontend, and integration tests

### Production Readiness
- **Security:** Admin-only PUT endpoint, all users can read config
- **Error Handling:** Graceful fallbacks when config is missing or loading
- **Performance:** Optimized lookups with memoization
- **Maintainability:** Shared utilities, clear code structure
- **Migration:** Safe deployment with rollback strategy

---

**Last Updated:** December 2024 (v1.1)

