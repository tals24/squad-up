import React from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { startOfWeek, addDays, format } from 'date-fns';

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const sessionSlots = ["Warm-up", "Main Part", "Small Game"];

const CalendarSlot = ({ day, slot, drills, notes, onDrop, onRemoveDrill, onNotesChange }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const drillData = JSON.parse(e.dataTransfer.getData("application/json"));
    onDrop(day, slot, drillData);
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
          <div key={drill.id} className="bg-slate-600/50 p-2 rounded-md shadow-sm text-sm text-slate-200 flex items-center justify-between">
            <span className="truncate">{drill.DrillName}</span>
            <button onClick={() => onRemoveDrill(day, slot, drill.id)} className="p-0.5 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400">
              <X className="w-3 h-3"/>
            </button>
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
    </div>
  );
};


export default function WeeklyCalendar({ plan, onDrop, onRemoveDrill, onNotesChange, currentDate }) {
  // Calculate the dates for each day of the week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
  const weekDates = daysOfWeek.map((_, index) => {
    const dayDate = addDays(weekStart, index);
    return format(dayDate, 'M/d');
  });

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
              />
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}