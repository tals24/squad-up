import React from 'react';
import GameDayRosterSidebar from '../components/GameDayRosterSidebar';

/**
 * RosterSidebarModule
 *
 * Pure wrapper for the game day roster sidebar section.
 * No logic - just composition and prop forwarding.
 *
 * @param {Object} props - All props passed through to GameDayRosterSidebar
 */
export default function RosterSidebarModule(props) {
  return <GameDayRosterSidebar {...props} />;
}
