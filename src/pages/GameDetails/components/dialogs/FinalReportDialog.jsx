import React from "react";
import { Button } from "@/shared/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/primitives/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(148, 163, 184, 0.2) transparent'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Submit & Lock Final Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
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

          {!isValid && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-red-400 text-sm">
              Please ensure all fields are filled before submitting.
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="border-slate-700 text-slate-400">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!isValid || isSaving}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
          >
            {isSaving ? "Submitting..." : "Submit & Lock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

