import React from 'react';
import { Loader2, Info } from 'lucide-react';
import WeeklyCalendar from '../../WeeklyCalendar';
import TrainingPlannerSidebar from '../../TrainingPlannerSidebar';

const TrainingPlannerContent = ({
  isLoadingPlan,
  selectedTeamId,
  trainingPlan,
  onDrop,
  onRemoveDrill,
  onNotesChange,
  currentDate,
  onViewDrillDetails,
}) => {
  if (isLoadingPlan) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
          <p className="text-slate-400">Loading training plan...</p>
        </div>
      </div>
    );
  }

  if (selectedTeamId && selectedTeamId !== 'no-teams') {
    return (
      <>
        <WeeklyCalendar
          plan={trainingPlan}
          onDrop={onDrop}
          onRemoveDrill={onRemoveDrill}
          onNotesChange={onNotesChange}
          currentDate={currentDate}
          onViewDrillDetails={onViewDrillDetails}
        />
        <TrainingPlannerSidebar context="training-planner" />
      </>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center text-center p-4">
      <div className="p-8 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 max-w-sm">
        <Info className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Select a Team to Begin</h2>
        <p className="text-slate-400 mt-2">
          Please select a team from the dropdown above to start planning your training week.
        </p>
      </div>
    </div>
  );
};

export default TrainingPlannerContent;
