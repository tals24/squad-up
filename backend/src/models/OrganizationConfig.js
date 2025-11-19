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

