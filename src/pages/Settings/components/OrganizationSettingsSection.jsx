import React from "react";
import { 
  Settings,
  Target,
  Users,
  AlertCircle,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/primitives/alert";

export default function OrganizationSettingsSection() {
  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="w-4 h-4 text-blue-400" />
        <AlertTitle className="text-blue-300">Coming in Phase 4</AlertTitle>
        <AlertDescription className="text-blue-200">
          Enhanced Match Event Tracking configuration will be available here. This includes feature toggles for Shot Tracking, Position-Specific Metrics, and age group overrides.
        </AlertDescription>
      </Alert>

      {/* Placeholder Card: Enhanced Tracking Features */}
      <Card className="bg-bg-secondary/70 border-border-custom shadow-xl backdrop-blur-sm opacity-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
            <Target className="w-6 h-6 text-accent-primary" />
            Enhanced Tracking Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-custom">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-text-primary">Shot Tracking</h4>
                <div className="text-sm text-slate-500">Disabled</div>
              </div>
              <p className="text-sm text-text-secondary">
                Track shots on/off target for forwards
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-custom">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-text-primary">Position-Specific Metrics</h4>
                <div className="text-sm text-slate-500">Disabled</div>
              </div>
              <p className="text-sm text-text-secondary">
                Track position-specific performance indicators
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-custom">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-text-primary">Detailed Disciplinary Tracking</h4>
                <div className="text-sm text-slate-500">Disabled</div>
              </div>
              <p className="text-sm text-text-secondary">
                Track fouls committed/received in addition to cards
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-custom">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-text-primary">Goal Involvement Tracking</h4>
                <div className="text-sm text-slate-500">Disabled</div>
              </div>
              <p className="text-sm text-text-secondary">
                Track indirect goal contributors (pre-assists, etc.)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Card: Age Group Overrides */}
      <Card className="bg-bg-secondary/70 border-border-custom shadow-xl backdrop-blur-sm opacity-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
            <Users className="w-6 h-6 text-accent-primary" />
            Age Group Overrides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary text-center py-8">
            Configure feature overrides per age group here. This will allow you to enable/disable specific tracking features for different age brackets.
          </p>
        </CardContent>
      </Card>

      {/* Roadmap Info */}
      <Alert className="bg-slate-800/50 border-slate-700">
        <AlertCircle className="w-4 h-4 text-slate-400" />
        <AlertTitle className="text-slate-300">Implementation Roadmap</AlertTitle>
        <AlertDescription className="text-slate-400">
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><strong>Phase 1:</strong> Core Goal Tracking with relationships</li>
            <li><strong>Phase 2:</strong> Substitution & Disciplinary tracking</li>
            <li><strong>Phase 3:</strong> Match Context entry</li>
            <li><strong>Phase 4:</strong> Configuration management (this section)</li>
            <li><strong>Phase 5:</strong> Analytics & visualizations</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

