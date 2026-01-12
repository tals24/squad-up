import React from 'react';
import { Tag, Users, Eye, ClipboardList } from 'lucide-react';
import { getCategoryColor, getAgeColor } from '@/shared/utils';

export default function DrillGrid({ drills, onDrillClick }) {
  const displayAgeGroups = (ageGroups) => {
    if (Array.isArray(ageGroups)) {
      return ageGroups.join(', ');
    }
    return ageGroups || 'Not specified';
  };

  if (drills.length === 0) {
    return (
      <div className="col-span-full">
        <div className="bg-slate-800/70 border-slate-700 rounded-xl border shadow-2xl">
          <div className="p-12 text-center">
            <ClipboardList className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">No Drills Found</h3>
            <p className="text-slate-400">Try adjusting your filters or add a new drill.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {drills.map((drill) => (
        <div
          key={drill._id}
          className="bg-slate-800/70 border-slate-700 rounded-xl border hover:bg-slate-800/90 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col"
          onClick={() => onDrillClick(drill)}
        >
          <div className="p-6 flex-grow">
            <h3 className="text-lg font-bold text-slate-100 truncate mb-2 group-hover:text-cyan-400 transition-colors">
              {drill.drillName}
            </h3>
            <p className="text-slate-400 text-sm mb-4 h-10 overflow-hidden">
              {drill.description || 'No description available.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getCategoryColor(drill.category)}`}
              >
                <Tag className="w-3 h-3 mr-1" /> {drill.category}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getAgeColor()}`}
              >
                <Users className="w-3 h-3 mr-1" /> {displayAgeGroups(drill.targetAgeGroup)}
              </span>
            </div>
          </div>
          <div className="p-6 border-t border-slate-700">
            <button
              className="w-full bg-slate-700 hover:bg-cyan-600 text-slate-100 hover:text-white px-4 py-2 rounded-lg border border-slate-600 hover:border-cyan-500 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                onDrillClick(drill);
              }}
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
