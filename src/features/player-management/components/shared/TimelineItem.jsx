import React from 'react';
import { Badge } from '@/shared/ui/primitives/badge';
import { Award, Eye, Star, Clock, Trophy, Users, Target } from 'lucide-react';

const StatBox = ({ value, label, icon: Icon, color }) => (
  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 text-center">
    <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center bg-slate-600 border border-slate-500 mb-2`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className="text-2xl font-bold text-slate-100">{value}</div>
    <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
  </div>
);

const TimelineItem = ({ report, gameForReport, isLast }) => {
  // Handle both old Airtable and new MongoDB structures
  const reportType = report.reportType || report.type || 'Scout Report';
  const rating = report.generalRating || report.rating || 0;
  const notes = report.notes || report.content;
  const opponent = gameForReport?.opponent || gameForReport?.Opponent;

  return (
    <div className="relative pl-12">
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-slate-600"></div>
      )}
      <div className="absolute left-0 top-3 w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border-4 border-slate-800">
        {reportType === 'Game Report' ? <Award className="w-5 h-5 text-cyan-400" /> : <Eye className="w-5 h-5 text-purple-400" />}
      </div>

      <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 hover:border-cyan-500/30 transition-colors duration-300">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className={`${reportType === 'Game Report' ? 'text-cyan-400 border-cyan-500/50 bg-cyan-900/30' : 'text-purple-400 border-purple-500/50 bg-purple-900/30'}`}>
            {reportType}
          </Badge>
          <span className="text-sm text-slate-400 font-mono">
            {report.date ? new Date(report.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 
             report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No date'}
          </span>
        </div>

        {reportType === 'Game Report' && gameForReport && (
          <h4 className="font-semibold text-slate-100 mb-3 text-lg">
            vs <span className="text-red-400">{opponent || 'Unknown Opponent'}</span>
          </h4>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-slate-500'}`} />
            ))}
          </div>
          <span className="text-sm font-bold text-slate-100 ml-1">
            {rating}/5 Rating
          </span>
        </div>

        {reportType === 'Game Report' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatBox value={report.minutesPlayed || 0} label="Minutes" icon={Clock} color="text-green-400"/>
            <StatBox value={report.goals || 0} label="Goals" icon={Trophy} color="text-cyan-400"/>
            <StatBox value={report.assists || 0} label="Assists" icon={Users} color="text-purple-400"/>
            <StatBox value={(report.goals || 0) + (report.assists || 0)} label="Goals Involved" icon={Target} color="text-red-400"/>
          </div>
        )}

        {notes && (
          <div className="border-t border-slate-600 pt-4">
            <h4 className="font-semibold text-slate-100 mb-2">Notes:</h4>
            <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineItem;
