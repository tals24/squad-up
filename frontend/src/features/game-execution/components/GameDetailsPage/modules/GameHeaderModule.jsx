import React from 'react';
import GameDetailsHeader from '../components/GameDetailsHeader';

/**
 * GameHeaderModule
 *
 * Pure wrapper for the game details header section.
 * No logic - just composition and prop forwarding.
 *
 * @param {Object} props - All props passed through to GameDetailsHeader
 */
export default function GameHeaderModule(props) {
  return <GameDetailsHeader {...props} />;
}
