/**
 * Game Details Page
 * 
 * Thin page wrapper that composes the GameDetails feature component.
 * 
 * Responsibilities:
 * - Route-level component (lazy-loaded by router)
 * - Minimal composition logic (pass route params, handle top-level errors)
 * - NO business logic, NO state management, NO direct API calls
 * 
 * The actual feature implementation is in:
 * @see @/features/game-management/components/GameDetailsPage
 */

import React from 'react';
import GameDetails from '@/features/game-execution/components/GameDetailsPage';

/**
 * GameDetailsPage - Route-level wrapper
 * 
 * This is the component referenced by the router.
 * It exists solely to maintain a clean separation between:
 * - Routing concerns (pages layer)
 * - Feature implementation (features layer)
 * 
 * @returns {JSX.Element} The game details feature component
 */
export default function GameDetailsPage() {
  return <GameDetails />;
}

