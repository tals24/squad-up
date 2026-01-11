import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, TrendingUp, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/primitives/design-system-components';
import { createPageUrl } from '@/shared/utils';
import { DASHBOARD_COLORS } from '../../utils';

/**
 * Stat Card Component
 * Individual stat card with icon, title, value, and link
 */
const StatCard = ({ title, value, icon: Icon, linkTo, colorClass }) => (
  <Link to={linkTo} className="block group">
    <Card
      className={`${DASHBOARD_COLORS.background.card} ${DASHBOARD_COLORS.background.border} shadow-lg ${DASHBOARD_COLORS.effects.hoverShadow} ${DASHBOARD_COLORS.effects.hoverBorder} ${DASHBOARD_COLORS.effects.transition} backdrop-blur-sm`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center bg-slate-700 border border-slate-600 group-hover:bg-cyan-500/10 group-hover:border-cyan-500 transition-colors`}
            >
              <Icon
                className={`w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors ${colorClass}`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{title}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

/**
 * Dashboard Stats Component
 * Grid of stat cards showing key metrics
 *
 * @param {Object} props - Component props
 * @param {number} props.teamsCount - Number of teams
 * @param {number} props.playersCount - Number of players
 * @param {number} props.reportsCount - Number of reports
 */
const DashboardStats = ({ teamsCount, playersCount, reportsCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <StatCard
        title="My Teams"
        value={teamsCount}
        icon={Trophy}
        linkTo={createPageUrl('Dashboard')}
      />
      <StatCard
        title="Managed Players"
        value={playersCount}
        icon={Users}
        linkTo={createPageUrl('Players')}
      />
      <StatCard
        title="Reports Filed"
        value={reportsCount}
        icon={TrendingUp}
        linkTo={createPageUrl('Players')}
      />
    </div>
  );
};

export default DashboardStats;
