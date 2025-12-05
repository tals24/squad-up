import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/primitives/design-system-components';
import { createPageUrl, safeDate, safeIsPast, safeIsFuture, safeFormatDistanceToNow } from '@/shared/utils';
import { getGameResult, getResultColor, getResultText } from '@/features/game-management/utils';
import { DASHBOARD_COLORS } from '../../utils';

/**
 * Game Zone Component
 * Displays recent game results and next upcoming game
 * 
 * @param {Object} props - Component props
 * @param {Array} props.games - Array of game objects
 */
const GameZone = ({ games }) => {
  const recentGames = games
    .filter(game => game.Date && safeIsPast(game.Date) && game.FinalScore_Display)
    .sort((a, b) => {
      const dateA = safeDate(a.Date);
      const dateB = safeDate(b.Date);
      if (!dateA || !dateB) return 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  const nextGame = games
    .filter(game => game.Date && safeIsFuture(game.Date))
    .sort((a, b) => {
      const dateA = safeDate(a.Date);
      const dateB = safeDate(b.Date);
      if (!dateA || !dateB) return 0;
      return dateA - dateB;
    })[0];

  return (
    <Card className={`${DASHBOARD_COLORS.background.card} ${DASHBOARD_COLORS.background.border} shadow-xl ${DASHBOARD_COLORS.effects.hoverShadow} ${DASHBOARD_COLORS.effects.hoverBorder} ${DASHBOARD_COLORS.effects.transition} backdrop-blur-sm flex flex-col`}>
      <CardHeader>
        <CardTitle className={`text-lg font-bold ${DASHBOARD_COLORS.text.primary} flex items-center gap-2`}>
          <Trophy className={`w-5 h-5 ${DASHBOARD_COLORS.text.accent}`} />
          Game Zone
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <h3 className={`text-sm font-semibold ${DASHBOARD_COLORS.text.secondary} mb-2`}>Recent Results</h3>
        <div className="flex gap-2 justify-center">
          {recentGames.length > 0 ? (
            recentGames.map((game) => {
              const result = getGameResult(game);
              return (
                <div key={game.id} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getResultColor(result)}`}>
                    {getResultText(result)}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{game.FinalScore_Display}</span>
                </div>
              );
            })
          ) : (
            <div className="text-center text-slate-500 py-2">
              <p className="text-sm">No recent games</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <div className="border-t border-slate-700 mx-6"></div>
      
      <CardContent className="pt-4">
        <h3 className={`text-sm font-semibold ${DASHBOARD_COLORS.text.secondary} mb-2`}>Next Game</h3>
        {nextGame ? (
          <Link to={createPageUrl(`GameDetails?id=${nextGame.id}`)} className={`block ${DASHBOARD_COLORS.background.hover} rounded-lg p-2 transition-colors -m-2`}>
            <p className={`font-bold ${DASHBOARD_COLORS.text.primary} truncate`}>
              {nextGame.GameTitle || "Untitled Game"}
            </p>
            <div className={`text-sm ${DASHBOARD_COLORS.text.accent} font-mono mt-1`}>
              {safeFormatDistanceToNow(nextGame.Date, { addSuffix: true })}
            </div>
            {nextGame.Location && (
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                <MapPin className="w-3 h-3" />
                <span>{nextGame.Location}</span>
              </div>
            )}
          </Link>
        ) : (
          <div className="text-center text-slate-500 py-2">
            <p className="text-sm">No upcoming games</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GameZone;

