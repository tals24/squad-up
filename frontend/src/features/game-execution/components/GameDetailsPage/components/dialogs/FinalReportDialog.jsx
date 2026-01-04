import React from "react";
import { BaseDialog } from "@/shared/ui/composed";
import { Trophy } from "lucide-react";

export default function FinalReportDialog({ 
  open, 
  onOpenChange, 
  finalScore, 
  teamSummary, 
  onConfirm, 
  isSaving 
}) {
  const isValid = 
    finalScore.ourScore !== null &&
    finalScore.opponentScore !== null &&
    teamSummary.defenseSummary &&
    teamSummary.midfieldSummary &&
    teamSummary.attackSummary &&
    teamSummary.generalSummary;

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Submit & Lock Final Report"
      titleIcon={<Trophy className="text-yellow-400" />}
      size="lg"
      error={!isValid ? "Please ensure all fields are filled before submitting." : null}
      actions={{
        cancel: {
          label: "Cancel",
          onClick: () => onOpenChange(false),
          disabled: isSaving,
        },
        confirm: {
          label: "Submit & Lock",
          onClick: onConfirm,
          disabled: !isValid || isSaving,
          loading: isSaving,
        },
      }}
    >
      {/* Final Score */}
      <div>
        <h4 className="font-semibold text-white mb-2">Final Score</h4>
        <div className="text-2xl font-bold text-center">
          {finalScore.ourScore} - {finalScore.opponentScore}
        </div>
      </div>

      {/* Team Summaries Preview */}
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-white mb-1">Defense Summary</h4>
          <p className="text-sm text-slate-300 bg-slate-800 p-3 rounded border border-slate-700">
            {teamSummary.defenseSummary || <span className="text-red-400">Not filled</span>}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-1">Midfield Summary</h4>
          <p className="text-sm text-slate-300 bg-slate-800 p-3 rounded border border-slate-700">
            {teamSummary.midfieldSummary || <span className="text-red-400">Not filled</span>}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-1">Attack Summary</h4>
          <p className="text-sm text-slate-300 bg-slate-800 p-3 rounded border border-slate-700">
            {teamSummary.attackSummary || <span className="text-red-400">Not filled</span>}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-1">General Summary</h4>
          <p className="text-sm text-slate-300 bg-slate-800 p-3 rounded border border-slate-700">
            {teamSummary.generalSummary || <span className="text-red-400">Not filled</span>}
          </p>
        </div>
      </div>
    </BaseDialog>
  );
}

