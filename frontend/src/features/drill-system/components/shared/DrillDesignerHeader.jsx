import React from 'react';
import { Target, Eye, Edit3, Plus } from 'lucide-react';
import { getModeDisplayText, getModeColorClasses } from '@/utils/drillLabUtils';

export default function DrillDesignerHeader({ 
  drillName, 
  mode, 
  isReadOnly, 
  isLoading 
}) {
  const modeText = getModeDisplayText(mode, isReadOnly);
  const modeColorClasses = getModeColorClasses(mode, isReadOnly);

  const getModeIcon = () => {
    if (isReadOnly) return <Eye className="w-4 h-4" />;
    if (mode === 'create') return <Plus className="w-4 h-4" />;
    if (mode === 'edit') return <Edit3 className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/90 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-700 rounded w-64 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 border-b border-slate-700 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-600/20 rounded-lg border border-cyan-500/30">
                <Target className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">
                  {drillName || 'Drill Designer'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${modeColorClasses}`}>
                    {getModeIcon()}
                    {modeText}
                  </span>
                  {isReadOnly && (
                    <span className="text-xs text-slate-400">
                      Read-only mode
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

