/**
 * Route Definitions
 * Centralized route configuration
 */

// Feature Imports
import {
  GameDetailsPage,
  GamesSchedulePage,
  AddGamePage,
} from '@/features/game-management';

import {
  PlayersPage,
  PlayerDetailPage,
  AddPlayerPage,
} from '@/features/player-management';

import {
  DrillLibraryPage,
  DrillDesignerPage,
} from '@/features/drill-system';

import {
  TrainingPlannerPage,
} from '@/features/training-management';

import {
  DashboardPage,
  AnalyticsPage,
} from '@/features/analytics';

import {
  AddTeamPage,
  TacticBoardPage,
} from '@/features/team-management';

import {
  LoginPage,
  AddUserPage,
  AccessDeniedPage,
} from '@/features/user-management';

import {
  AddReportPage,
} from '@/features/reporting';

// Page Imports (not migrated - misc pages)
import { SettingsPage } from '@/features/settings';

/**
 * Public routes (no authentication required)
 */
export const publicRoutes = [
  {
    path: '/',
    element: LoginPage,
    name: 'Login',
  },
  {
    path: '/Login',
    element: LoginPage,
    name: 'Login',
  },
];

/**
 * Protected routes (authentication required, wrapped in Layout)
 */
export const protectedRoutes = [
  {
    path: '/Dashboard',
    element: DashboardPage,
    name: 'Dashboard',
  },
  {
    path: '/Players',
    element: PlayersPage,
    name: 'Players',
  },
  {
    path: '/Player',
    element: PlayerDetailPage,
    name: 'Player',
  },
  {
    path: '/Settings',
    element: SettingsPage,
    name: 'Settings',
  },
  {
    path: '/Analytics',
    element: AnalyticsPage,
    name: 'Analytics',
  },
  {
    path: '/AddPlayer',
    element: AddPlayerPage,
    name: 'AddPlayer',
  },
  {
    path: '/AddTeam',
    element: AddTeamPage,
    name: 'AddTeam',
  },
  {
    path: '/AddReport',
    element: AddReportPage,
    name: 'AddReport',
  },
  {
    path: '/AddUser',
    element: AddUserPage,
    name: 'AddUser',
  },
  {
    path: '/AddGame',
    element: AddGamePage,
    name: 'AddGame',
  },
  {
    path: '/GamesSchedule',
    element: GamesSchedulePage,
    name: 'GamesSchedule',
  },
  {
    path: '/GameDetails',
    element: GameDetailsPage,
    name: 'GameDetails',
  },
  {
    path: '/AccessDenied',
    element: AccessDeniedPage,
    name: 'AccessDenied',
  },
  {
    path: '/DrillLibrary',
    element: DrillLibraryPage,
    name: 'DrillLibrary',
  },
  {
    path: '/TacticBoard',
    element: TacticBoardPage,
    name: 'TacticBoard',
  },
  {
    path: '/TrainingPlanner',
    element: TrainingPlannerPage,
    name: 'TrainingPlanner',
  },
  {
    path: '/DrillDesigner',
    element: DrillDesignerPage,
    name: 'DrillDesigner',
  },
];

/**
 * Full-screen pages (no sidebar/header)
 */
export const fullScreenPages = ['DrillDesigner'];

/**
 * Get current page name from URL
 */
export function getCurrentPage(url) {
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split('/').pop();
  if (urlLastPart.includes('?')) {
    urlLastPart = urlLastPart.split('?')[0];
  }

  const allRoutes = [...publicRoutes, ...protectedRoutes];
  const route = allRoutes.find((r) => r.name.toLowerCase() === urlLastPart.toLowerCase());
  return route ? route.name : 'Dashboard';
}

