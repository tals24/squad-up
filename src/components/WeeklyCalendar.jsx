import React from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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
      className="bg-card/50 p-2 rounded-lg min-h-[140px] flex flex-col gap-2 border-2 border-dashed border-border hover:border-brand-blue transition-colors"
    >
      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">{slot}</h3>
      <div className="flex-1 space-y-1">
        {drills.map(drill => (
          <div key={drill.id} className="bg-secondary p-2 rounded-md shadow-sm text-sm text-secondary-foreground flex items-center justify-between">
            <span className="truncate">{drill.DrillName}</span>
            <button onClick={() => onRemoveDrill(day, slot, drill.id)} className="p-0.5 rounded-full hover:bg-brand-red/20 text-muted-foreground hover:text-brand-red">
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
          className="text-xs p-1 h-16 bg-background border-border focus:border-brand-blue text-foreground"
        />
      )}
    </div>
  );
};


export default function WeeklyCalendar({ plan, onDrop, onRemoveDrill, onNotesChange }) {
  return (
    <main className="flex-1 grid grid-cols-7 gap-1 p-2 bg-background overflow-auto">
      {daysOfWeek.map(day => (
        <div key={day} className="flex flex-col gap-1">
          <h2 className="text-center font-bold text-sm text-foreground py-2 border-b border-border">{day}</h2>
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