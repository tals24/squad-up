import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Swords, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/primitives/design-system-components';
import { createPageUrl, safeFormatDistanceToNow, DASHBOARD_COLORS } from '@/utils';

/**
 * Activity Item Component
 * Individual activity item in the timeline
 */
const ActivityItem = ({ event, getPlayerName }) => (
  <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700">
      {event.type === 'game' ? (
        <Swords className="w-5 h-5 text-cyan-400" />
      ) : (
        <FileText className="w-5 h-5 text-purple-400" />
      )}
    </div>
    <div className="flex-1">
      {event.type === 'game' ? (
        <Link 
          to={createPageUrl(`GameDetails?id=${event._id || event.id}`)} 
          className="font-bold text-white hover:text-cyan-400 transition-colors"
        >
          {event.gameTitle || event.GameTitle || 'Game Played'}
        </Link>
      ) : (
        <Link 
          to={createPageUrl(`Player?id=${event.player?._id || event.player}`)} 
          className="font-bold text-white hover:text-purple-400 transition-colors"
        >
          Scout Report: {getPlayerName(event)}
        </Link>
      )}
      <p className="text-sm text-slate-400">
        {event.type === 'game' 
          ? `Final Score: ${event.finalScore || event.FinalScore_Display || 'N/A'}` 
          : `Rating: ${event.generalRating || event.GeneralRating || 'N/A'}/5`
        }
      </p>
    </div>
    <div className="text-right text-sm text-slate-500 font-mono">
      {safeFormatDistanceToNow(event.eventDate, { addSuffix: true })}
    </div>
  </div>
);

/**
 * Empty Activity State Component
 * Displayed when there are no recent activities
 */
const EmptyActivityState = () => (
  <div className="text-center py-8 text-slate-500">
    <Eye className="w-12 h-12 mx-auto mb-3" />
    <p className="font-medium">No recent activity</p>
    <p className="text-sm">Data will appear here once games are played or reports are filed.</p>
  </div>
);

/**
 * Recent Activity Component
 * Displays timeline of recent games and reports
 * 
 * @param {Object} props - Component props
 * @param {Array} props.events - Array of recent events
 * @param {Function} props.getPlayerName - Function to get player name from report
 */
const RecentActivity = ({ events, getPlayerName }) => {
  return (
    <Card className={`${DASHBOARD_COLORS.background.card} ${DASHBOARD_COLORS.background.border} shadow-xl ${DASHBOARD_COLORS.effects.hoverShadow} ${DASHBOARD_COLORS.effects.hoverBorder} ${DASHBOARD_COLORS.effects.transition} backdrop-blur-sm`}>
      <CardHeader>
        <CardTitle className={`text-xl font-bold ${DASHBOARD_COLORS.text.primary} flex items-center gap-2`}>
          <Eye className={`w-6 h-6 ${DASHBOARD_COLORS.text.accent}`} />
          Recent Activity
        </CardTitle>
        <p className={`text-sm ${DASHBOARD_COLORS.text.secondary}`}>
          Latest games and reports.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.length > 0 ? (
            events.map((event, index) => (
              <ActivityItem 
                key={event._id || event.id || `event-${index}`} 
                event={event} 
                getPlayerName={getPlayerName}
              />
            ))
          ) : (
            <EmptyActivityState />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;

