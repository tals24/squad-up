import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/primitives/card';
import { Button } from '@/shared/ui/primitives/button';
import { TrendingUp, Save, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '@/shared/ui/primitives/use-toast';
import { cn } from '@/shared/lib/utils';

/**
 * Compact Slider Component for Difficulty Assessment
 */
const CompactSlider = ({ label, value, onChange, disabled = false }) => {
  const levels = {
    1: 'Poor',
    2: 'Below',
    3: 'Normal',
    4: 'Good',
    5: 'Elite',
  };

  const handleChange = (e) => {
    if (disabled) return;
    const newValue = parseInt(e.target.value, 10);
    onChange?.(newValue);
  };

  // If value is 0 (not set), show at middle position (3)
  const sliderValue = value === 0 ? 3 : value >= 1 && value <= 5 ? value : 3;
  const displayLabel = value === 0 ? 'Not Set' : levels[value] || '—';
  const isUnset = value === 0;

  return (
    <div className="space-y-1">
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span
          className={cn(
            'text-xs font-semibold min-w-[45px] text-right',
            isUnset ? 'text-slate-500' : 'text-purple-400'
          )}
        >
          {displayLabel}
        </span>
      </div>
      {/* Slider */}
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={sliderValue}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          'w-full h-1.5 rounded-full appearance-none cursor-pointer',
          'focus:outline-none focus:ring-1 focus:ring-purple-500/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Webkit thumb styling - color changes based on set/unset
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-3.5',
          '[&::-webkit-slider-thumb]:h-3.5',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:transition-all',
          '[&::-webkit-slider-thumb]:hover:scale-110',
          isUnset
            ? '[&::-webkit-slider-thumb]:bg-slate-500'
            : '[&::-webkit-slider-thumb]:bg-purple-400',
          isUnset
            ? '[&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(100,116,139,0.4)]'
            : '[&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(192,132,252,0.5)]',
          // Firefox thumb styling
          '[&::-moz-range-thumb]:w-3.5',
          '[&::-moz-range-thumb]:h-3.5',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:transition-all',
          '[&::-moz-range-thumb]:hover:scale-110',
          isUnset ? '[&::-moz-range-thumb]:bg-slate-500' : '[&::-moz-range-thumb]:bg-purple-400',
          isUnset
            ? '[&::-moz-range-thumb]:shadow-[0_0_6px_rgba(100,116,139,0.4)]'
            : '[&::-moz-range-thumb]:shadow-[0_0_6px_rgba(192,132,252,0.5)]',
          // Track styling
          '[&::-webkit-slider-runnable-track]:h-1.5',
          '[&::-webkit-slider-runnable-track]:rounded-full',
          '[&::-moz-range-track]:h-1.5',
          '[&::-moz-range-track]:rounded-full'
        )}
        style={{
          background: isUnset
            ? 'linear-gradient(to right, #475569 0%, #64748b 50%, #475569 100%)'
            : `linear-gradient(to right, 
                #ef4444 0%, 
                #f59e0b 25%, 
                #10b981 50%, 
                #3b82f6 75%, 
                #8b5cf6 100%)`,
        }}
      />
    </div>
  );
};

/**
 * DifficultyAssessmentCard Component
 *
 * Inline component for game difficulty assessment in MatchAnalysisSidebar.
 * - Scheduled: Full interactive card with sliders
 * - Played: Hidden
 * - Done: Compact one-line display
 */
export default function DifficultyAssessmentCard({
  game,
  assessment,
  onSave,
  onDelete,
  isScheduled,
  isDone,
}) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Local state for form inputs
  const [opponentStrength, setOpponentStrength] = useState(0);
  const [matchImportance, setMatchImportance] = useState(0);
  const [externalConditions, setExternalConditions] = useState(0);

  // Initialize form with existing assessment data
  useEffect(() => {
    if (assessment) {
      setOpponentStrength(assessment.opponentStrength || 0);
      setMatchImportance(assessment.matchImportance || 0);
      setExternalConditions(assessment.externalConditions || 0);
    } else {
      setOpponentStrength(0);
      setMatchImportance(0);
      setExternalConditions(0);
    }
  }, [assessment]);

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (opponentStrength === 0 || matchImportance === 0 || externalConditions === 0) {
      return null;
    }
    const calculated = opponentStrength * 0.4 + matchImportance * 0.35 + externalConditions * 0.25;
    return parseFloat(calculated.toFixed(1));
  }, [opponentStrength, matchImportance, externalConditions]);

  // Determine if form is valid
  const isValid = opponentStrength >= 1 && matchImportance >= 1 && externalConditions >= 1;

  // Check if any values are set
  const hasAnyValues = opponentStrength > 0 || matchImportance > 0 || externalConditions > 0;

  // Handle reset all - if assessment exists in backend, delete it; otherwise just clear form
  const handleResetAll = async () => {
    if (assessment && onDelete) {
      // Assessment exists in backend, delete it
      try {
        await onDelete();
        // Form will be cleared automatically when assessment becomes null
      } catch (error) {
        console.error('Error deleting assessment:', error);
      }
    } else {
      // Just clear the local form
      setOpponentStrength(0);
      setMatchImportance(0);
      setExternalConditions(0);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!isValid || !onSave) return;

    setIsSaving(true);
    try {
      await onSave({
        opponentStrength,
        matchImportance,
        externalConditions,
      });
      toast({
        title: 'Success',
        description: 'Difficulty assessment saved',
      });
    } catch (error) {
      console.error('Error saving difficulty assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assessment',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Done status: Compact one-line display
  if (isDone && assessment?.overallScore) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-purple-600/30 rounded-lg">
        <TrendingUp className="w-3 h-3 text-purple-400 shrink-0" />
        <span className="text-xs text-slate-400 shrink-0">Difficulty:</span>
        <span className="text-xs font-semibold text-purple-400">
          {assessment.overallScore.toFixed(1)} / 5.0
        </span>
      </div>
    );
  }

  // Scheduled status: Full interactive card
  if (isScheduled) {
    return (
      <Card className="bg-slate-900/90 backdrop-blur-sm border-purple-600/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Difficulty Assessment
            </div>
            {hasAnyValues && (
              <button
                onClick={handleResetAll}
                className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset all difficulty ratings"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Assessment Parameters */}
          <div className="space-y-3">
            <CompactSlider
              label="Opponent Strength"
              value={opponentStrength}
              onChange={setOpponentStrength}
            />
            <CompactSlider
              label="Match Importance"
              value={matchImportance}
              onChange={setMatchImportance}
            />
            <CompactSlider
              label="External Conditions"
              value={externalConditions}
              onChange={setExternalConditions}
            />
          </div>

          {/* Overall Score Display */}
          {overallScore !== null && (
            <div className="p-2.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Overall Difficulty:</span>
                <span className="text-xl font-bold text-purple-400">
                  {overallScore.toFixed(1)}{' '}
                  <span className="text-xs text-slate-500 font-normal">/ 5</span>
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isValid || isSaving}
              size="sm"
              className="w-full text-xs h-7 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 mr-1" />
                  Save Assessment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For "Played" status or if not enabled, don't render anything
  return null;
}
