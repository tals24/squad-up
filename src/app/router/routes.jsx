/**
 * Route Definitions
 * Centralized route configuration
 */

// Page Imports
import Dashboard from '@/pages/Dashboard';
import Players from '@/pages/Players';
import Player from '@/pages/Player';
import SyncStatus from '@/pages/SyncStatus';
import Analytics from '@/pages/Analytics';
import AddPlayer from '@/pages/AddPlayer';
import AddTeam from '@/pages/AddTeam';
import AddReport from '@/pages/AddReport';
import AddUser from '@/pages/AddUser';
import AddGame from '@/pages/AddGame';
import Login from '@/pages/Login';
import GamesSchedule from '@/pages/GamesSchedule';
import GameDetails from '@/pages/GameDetails';
import AccessDenied from '@/pages/AccessDenied';
import DrillLibrary from '@/pages/DrillLibrary';
import TacticBoard from '@/pages/TacticBoard';
import TrainingPlanner from '@/pages/TrainingPlanner';
import DrillDesigner from '@/pages/DrillDesigner';

/**
 * Public routes (no authentication required)
 */
export const publicRoutes = [
  {
    path: '/',
    element: Login,
    name: 'Login',
  },
  {
    path: '/Login',
    element: Login,
    name: 'Login',
  },
];

/**
 * Protected routes (authentication required, wrapped in Layout)
 */
export const protectedRoutes = [
  {
    path: '/Dashboard',
    element: Dashboard,
    name: 'Dashboard',
  },
  {
    path: '/Players',
    element: Players,
    name: 'Players',
  },
  {
    path: '/Player',
    element: Player,
    name: 'Player',
  },
  {
    path: '/SyncStatus',
    element: SyncStatus,
    name: 'SyncStatus',
  },
  {
    path: '/Analytics',
    element: Analytics,
    name: 'Analytics',
  },
  {
    path: '/AddPlayer',
    element: AddPlayer,
    name: 'AddPlayer',
  },
  {
    path: '/AddTeam',
    element: AddTeam,
    name: 'AddTeam',
  },
  {
    path: '/AddReport',
    element: AddReport,
    name: 'AddReport',
  },
  {
    path: '/AddUser',
    element: AddUser,
    name: 'AddUser',
  },
  {
    path: '/AddGame',
    element: AddGame,
    name: 'AddGame',
  },
  {
    path: '/GamesSchedule',
    element: GamesSchedule,
    name: 'GamesSchedule',
  },
  {
    path: '/GameDetails',
    element: GameDetails,
    name: 'GameDetails',
  },
  {
    path: '/AccessDenied',
    element: AccessDenied,
    name: 'AccessDenied',
  },
  {
    path: '/DrillLibrary',
    element: DrillLibrary,
    name: 'DrillLibrary',
  },
  {
    path: '/TacticBoard',
    element: TacticBoard,
    name: 'TacticBoard',
  },
  {
    path: '/TrainingPlanner',
    element: TrainingPlanner,
    name: 'TrainingPlanner',
  },
  {
    path: '/DrillDesigner',
    element: DrillDesigner,
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

