import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/primitives/card';
import { Button } from '@/shared/ui/primitives/button';
import { Clock, Plus } from 'lucide-react';
import { createPageUrl } from '@/shared/utils';
import TimelineItem from './TimelineItem';

const DevelopmentTimeline = ({ playerReports, games, playerId }) => {
  return (
    <Card className="shadow-2xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-100 flex items-center gap-3">
          <Clock className="w-6 h-6 text-cyan-400" />
          Development Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pr-2">
        {playerReports.length > 0 ? (
          <div className="space-y-8 scrollbar-hover max-h-[60rem] overflow-y-auto pr-4">
            {playerReports.map((report, index) => {
              // Handle both old Airtable and new MongoDB structures
              const gameForReport = report.game
                ? games.find((g) => g._id === report.game._id || g._id === report.game)
                : games.find((g) => report.Game && report.Game.includes(g.id));
              const isLast = index === playerReports.length - 1;

              return (
                <TimelineItem
                  key={report._id || report.id || `report-${index}`}
                  report={report}
                  gameForReport={gameForReport}
                  isLast={isLast}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">No Reports Yet</h3>
            <p className="text-slate-400 mb-6">
              Start building this player's development timeline by adding their first report.
            </p>
            <Link to={createPageUrl(`AddReport?playerId=${playerId}`)}>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold">
                <Plus className="w-5 h-5 mr-2" />
                Add First Report
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DevelopmentTimeline;
