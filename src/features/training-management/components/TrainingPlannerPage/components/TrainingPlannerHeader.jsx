import React from 'react';
import { Button } from '@/shared/ui/primitives/button';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/primitives/select";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format } from 'date-fns';

const TrainingPlannerHeader = ({
  currentDate,
  selectedTeamId,
  managedTeams,
  hasSavedData,
  isSaving,
  onWeekChange,
  onTeamChange,
  onSavePlan
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  return (
    <header className="p-4 border-b border-slate-700 bg-slate-800/70 backdrop-blur-sm flex items-center justify-between z-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Training <span className="text-cyan-400">Planner</span></h1>
        <div className="flex items-center gap-4 text-white mt-1">
          <div className="flex items-center gap-2 bg-slate-700/50 border border-slate-600 rounded-lg p-1">
            <Button 
              onClick={() => onWeekChange(subWeeks(currentDate, 1))} 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-slate-400 hover:bg-slate-600 hover:text-cyan-400"
            >
              <ChevronLeft className="w-5 h-5"/>
            </Button>
            <span className="font-bold text-lg text-white tabular-nums tracking-tighter">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
            <Button 
              onClick={() => onWeekChange(addWeeks(currentDate, 1))} 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-slate-400 hover:bg-slate-600 hover:text-cyan-400"
            >
              <ChevronRight className="w-5 h-5"/>
            </Button>
          </div>
          <Select value={selectedTeamId} onValueChange={onTeamChange}>
            <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white hover:border-cyan-400/50">
              <SelectValue placeholder={managedTeams.length > 0 ? "Select Team..." : "No Teams Available"} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 text-white">
              {managedTeams.length > 0 ? (
                managedTeams.map(team => (
                  <SelectItem key={team._id || team.id} value={team._id || team.id} className="focus:bg-slate-700 hover:bg-slate-700">
                    {team.teamName}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-teams" disabled>No Teams Available</SelectItem>
              )}
            </SelectContent>
          </Select>
          {hasSavedData && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 border border-green-500/30 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Plan Saved</span>
            </div>
          )}
        </div>
      </div>
      <Button 
        onClick={onSavePlan} 
        disabled={isSaving} 
        className="bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
        {isSaving ? 'Saving...' : 'Save Weekly Plan'}
      </Button>
    </header>
  );
};

export default TrainingPlannerHeader;
