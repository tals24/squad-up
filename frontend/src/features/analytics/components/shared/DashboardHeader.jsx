import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/primitives/design-system-components';
import { createPageUrl } from '@/shared/utils';
import { DASHBOARD_COLORS } from '../../utils';

/**
 * Dashboard Header Component
 * Displays welcome message, role, and primary CTA button
 *
 * @param {Object} props - Component props
 * @param {Object} props.currentUser - Current authenticated user
 * @param {string} props.roleDisplay - Formatted role display string
 * @param {Function} props.onAddReport - Callback for add report action
 */
const DashboardHeader = ({ currentUser, roleDisplay, onAddReport }) => {
  const userName =
    currentUser?.fullName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'User';

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Welcome, <span className="text-cyan-400">{userName}</span>
        </h1>
        <p className={`${DASHBOARD_COLORS.text.secondary} text-lg font-mono`}>{roleDisplay}</p>
      </div>
      <Link to={`${createPageUrl('AddReport')}?from=Dashboard`} onClick={onAddReport}>
        <Button className="bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/20 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Scout Report
        </Button>
      </Link>
    </div>
  );
};

export default DashboardHeader;
