import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Textarea } from '@/shared/ui/primitives/textarea';
import { startOfWeek, addDays, format } from 'date-fns';
import DrillMenuDropdown from '@/features/drill-system/components/DrillMenuDropdown';
import DrillDetailModal from '@/features/drill-system/components/DrillDetailModal';

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const sessionSlots = ["Warm-up", "Main Part", "Small Game"];

const CalendarSlot = ({ day, slot, drills, notes, onDrop, onRemoveDrill, onNotesChange, onViewDrillDetails }) => {
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const drillData = JSON.parse(e.dataTransfer.getData("application/json"));
    onDrop(day, slot, drillData);
  };

  const handleViewDetails = (drill) => {
    console.log('🔍 WeeklyCalendar handleViewDetails - drill:', drill?.DrillName);
    setSelectedDrill(drill);
    setIsDetailModalOpen(true);
    if (onViewDrillDetails) {
      onViewDrillDetails(drill);
    }
  };

  const handleRemoveDrill = (drill) => {
    onRemoveDrill(day, slot, drill.id);
  };
  
  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="bg-slate-700/30 p-2 rounded-lg min-h-[140px] flex flex-col gap-2 border-2 border-dashed border-slate-600 hover:border-cyan-400 transition-colors"
    >
      <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">{slot}</h3>
      <div className="flex-1 space-y-1">
        {drills.map(drill => (
          <div key={drill.id} className="bg-slate-600/50 p-2 rounded-md shadow-sm text-sm text-slate-200 flex items-center justify-between group">
            <span className="truncate flex-1">{drill.DrillName}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DrillMenuDropdown
                drill={drill}
                onViewDetails={handleViewDetails}
                onRemove={handleRemoveDrill}
              />
            </div>
          </div>
        ))}
      </div>
      {slot === "Small Game" && (
        <Textarea
          placeholder="Notes..."
          value={notes}
          onChange={(e) => onNotesChange(day, e.target.value)}
          className="text-xs p-1 h-16 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
        />
      )}
      
      {/* Drill Detail Modal */}
      <DrillDetailModal
        drill={selectedDrill}
        open={isDetailModalOpen}
        setOpen={setIsDetailModalOpen}
        source="training-planner"
      />
      {console.log('🔍 WeeklyCalendar rendering DrillDetailModal with source: training-planner')}
    </div>
  );
};


export default function WeeklyCalendar({ plan, onDrop, onRemoveDrill, onNotesChange, currentDate, onViewDrillDetails }) {
  // Calculate the dates for each day of the week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
  const weekDates = daysOfWeek.map((_, index) => {
    const dayDate = addDays(weekStart, index);
    return format(dayDate, 'M/d');
  });

  // Safety check for plan
  if (!plan) {
    console.warn('WeeklyCalendar: plan is undefined, using empty structure');
    return (
      <main className="flex-1 grid grid-cols-7 gap-1 p-2 bg-slate-900/50 overflow-auto">
        <div className="col-span-7 text-center text-slate-400 py-8">Loading training plan...</div>
      </main>
    );
  }

  return (
    <main className="flex-1 grid grid-cols-7 gap-1 p-2 bg-slate-900/50 overflow-auto">
      {daysOfWeek.map((day, index) => (
        <div key={day} className="flex flex-col gap-1">
          <h2 className="text-center font-bold text-sm text-white py-2 border-b border-slate-700">
            {weekDates[index]} {day}
          </h2>
          <div className="flex flex-col gap-1">
            {sessionSlots.map(slot => (
              <CalendarSlot
                key={slot}
                day={day}
                slot={slot}
                drills={plan[day]?.[slot]?.drills || []}
                notes={plan[day]?.["Small Game"]?.notes || ""}
                onDrop={onDrop}
                onRemoveDrill={onRemoveDrill}
                onNotesChange={onNotesChange}
                onViewDrillDetails={onViewDrillDetails}
              />
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}