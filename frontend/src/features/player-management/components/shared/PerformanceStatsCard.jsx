import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/primitives/card';
import { TrendingUp, Star, Trophy, Users, Clock, Eye } from 'lucide-react';

const StatBox = ({ value, label, icon: Icon, color }) => (
  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 text-center">
    <div
      className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center bg-slate-600 border border-slate-500 mb-2`}
    >
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className="text-2xl font-bold text-slate-100">{value}</div>
    <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
  </div>
);

const PerformanceStatsCard = ({ stats, reportCount, gamesPlayed = 0, gamesInSquad = 0 }) => {
  return (
    <Card className="shadow-2xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-100 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-cyan-400" />
          Performance Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-700/50 p-4 rounded-lg text-center">
          <div className="text-slate-400 text-sm mb-1">Average Rating</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-yellow-400">{stats.averageRating}</span>
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatBox value={stats.totalGoals} label="Goals" icon={Trophy} color="text-cyan-400" />
          <StatBox
            value={stats.totalAssists}
            label="Assists"
            icon={Users}
            color="text-purple-400"
          />
          <StatBox value={stats.totalMinutes} label="Minutes" icon={Clock} color="text-green-400" />
          <StatBox value={reportCount} label="Reports" icon={Eye} color="text-red-400" />
        </div>
        {(gamesPlayed > 0 || gamesInSquad > 0) && (
          <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 text-center">
              Game Participation
            </div>
            <div className="flex justify-around text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-100">{gamesPlayed}</div>
                <div className="text-slate-400">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-100">{gamesInSquad}</div>
                <div className="text-slate-400">Games in Squad</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceStatsCard;
