import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/api/client';

/**
 * useLineupDraftManager
 *
 * Custom hook that manages lineup draft loading and autosave for Scheduled games.
 * Handles draft precedence, merge logic, and debounced autosave.
 *
 * **Behavior**:
 * 1. Load draft with precedence: draft → gameRosters → default
 * 2. Merge draft rosters with all players (ensure all players have a status)
 * 3. Restore formation from draft (if exists)
 * 4. Autosave draft changes with 2.5s debounce
 * 5. Skip autosave while game is being finalized (prevents write conflicts)
 *
 * **Draft Precedence** (for Scheduled games):
 * - Priority 1: game.lineupDraft (most recent, includes formation)
 * - Priority 2: gameRosters (fallback if no draft)
 * - Priority 3: Empty/default (all players "Not in Squad")
 *
 * **Autosave Logic**:
 * - Debounce: 2.5 seconds after last change
 * - Endpoint: PUT /api/games/${gameId}/draft
 * - Payload: { rosters, formation, formationType }
 * - Guards: Skip if finalizing, skip if Scheduled status, skip on initial load
 *
 * @param {Object} config - Configuration object
 * @param {string} config.gameId - Game ID
 * @param {Object|null} config.game - Game object
 * @param {Array} config.gamePlayers - Players for this game's team
 * @param {Array} config.gameRosters - Game rosters from DataProvider
 * @param {boolean} config.isFinalizingGame - Whether game is being finalized
 * @param {Object} config.formation - Current formation (position -> player map)
 * @param {Function} config.setFormation - Setter for formation
 * @param {string} config.formationType - Current formation type (e.g., "1-4-4-2")
 * @param {Function} config.setFormationType - Setter for formation type
 * @param {boolean} config.manualFormationMode - Whether manual formation mode is enabled
 * @param {Function} config.setManualFormationMode - Setter for manual formation mode
 *
 * @returns {Object} Lineup draft state and autosave status
 * @returns {Object} return.localRosterStatuses - Player roster statuses (playerId -> status)
 * @returns {Function} return.setLocalRosterStatuses - Setter for roster statuses
 * @returns {boolean} return.isAutosaving - Whether draft is currently being saved
 * @returns {string|null} return.autosaveError - Autosave error message (if any)
 * @returns {Function} return.setIsAutosaving - Setter for autosaving state
 * @returns {Function} return.setAutosaveError - Setter for autosave error
 */
export function useLineupDraftManager({
  gameId,
  game,
  gamePlayers,
  gameRosters,
  isFinalizingGame,
  formation,
  setFormation,
  formationType,
  setFormationType,
  manualFormationMode,
  setManualFormationMode,
}) {
  // Roster statuses state
  const [localRosterStatuses, setLocalRosterStatuses] = useState({});

  // Autosave state
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveError, setAutosaveError] = useState(null);

  // Effect 1: Load existing roster statuses (with draft priority)
  useEffect(() => {
    if (!gameId || !game || gamePlayers.length === 0) {
      console.log('⚠️ [useLineupDraftManager] Skipping draft load - missing dependencies:', {
        hasGameId: !!gameId,
        hasGame: !!game,
        gamePlayersCount: gamePlayers.length,
      });
      return;
    }

    // 🔍 DEBUG: Log draft loading check with full context
    console.log('🔍 [useLineupDraftManager] === DRAFT LOADING START ===');
    console.log('🔍 [useLineupDraftManager] Game context:', {
      gameId,
      gameStatus: game.status,
      gameOpponent: game.opponent,
      gameDate: game.date,
    });
    console.log('🔍 [useLineupDraftManager] Draft data:', {
      hasLineupDraft: !!game.lineupDraft,
      lineupDraftType: typeof game.lineupDraft,
      lineupDraftKeys: game.lineupDraft ? Object.keys(game.lineupDraft) : null,
      draftRostersCount: game.lineupDraft?.rosters
        ? Object.keys(game.lineupDraft.rosters).length
        : 0,
      draftFormationCount: game.lineupDraft?.formation
        ? Object.keys(game.lineupDraft.formation).length
        : 0,
      draftFormationType: game.lineupDraft?.formationType,
    });
    console.log('🔍 [useLineupDraftManager] Available data:', {
      gamePlayersCount: gamePlayers.length,
      gameRostersCount: gameRosters?.length || 0,
      currentFormationType: formationType,
    });

    // Priority 1: Check for draft (for Scheduled AND Played games)
    // ✅ FIX: Load draft for both Scheduled and Played to preserve formation when status changes
    // Only skip draft for Done games (which are finalized and shouldn't use draft)
    const shouldLoadDraft =
      (game.status === 'Scheduled' || game.status === 'Played') &&
      game.lineupDraft &&
      typeof game.lineupDraft === 'object';

    if (shouldLoadDraft) {
      console.log(`✅ [useLineupDraftManager] LOADING DRAFT (${game.status} game)`);
      console.log('📋 [useLineupDraftManager] Draft content:', {
        fullDraft: game.lineupDraft,
        rostersKeys: Object.keys(game.lineupDraft.rosters || {}),
        formationKeys: Object.keys(game.lineupDraft.formation || {}),
      });

      // Extract rosters and formation from draft
      const draftRosters = game.lineupDraft.rosters || game.lineupDraft;
      const draftFormation = game.lineupDraft.formation || {};
      const draftFormationType = game.lineupDraft.formationType || formationType;

      console.log('🔍 [useLineupDraftManager] Draft extraction:', {
        draftRostersCount: Object.keys(draftRosters).length,
        draftFormationCount: Object.keys(draftFormation).length,
        draftFormationType,
      });

      // Merge draft rosters with all players (ensure all players have a status)
      const draftStatuses = { ...draftRosters };
      gamePlayers.forEach((player) => {
        if (!draftStatuses[player._id]) {
          draftStatuses[player._id] = 'Not in Squad';
        }
      });

      // Restore formation from draft
      if (Object.keys(draftFormation).length > 0) {
        console.log('🔧 [useLineupDraftManager] Restoring formation from draft...');
        console.log(
          '🔍 [useLineupDraftManager] Draft formation positions:',
          Object.keys(draftFormation)
        );

        // Set manual mode FIRST to prevent auto-rebuild from interfering
        setManualFormationMode(true);

        // Rebuild formation object with full player objects from gamePlayers
        const restoredFormation = {};
        let missingPlayers = [];

        Object.keys(draftFormation).forEach((posId) => {
          const draftPlayer = draftFormation[posId];
          console.log(`🔍 [useLineupDraftManager] Processing position ${posId}:`, {
            draftPlayer,
            hasPlayerId: !!(draftPlayer && draftPlayer._id),
          });

          if (draftPlayer && draftPlayer._id) {
            // Find full player object from gamePlayers
            const fullPlayer = gamePlayers.find((p) => p._id === draftPlayer._id);
            if (fullPlayer) {
              restoredFormation[posId] = fullPlayer;
              console.log(`✅ [useLineupDraftManager] Position ${posId} restored:`, {
                playerId: fullPlayer._id,
                playerName: fullPlayer.fullName,
                kitNumber: fullPlayer.kitNumber,
              });
            } else {
              missingPlayers.push({
                posId,
                playerId: draftPlayer._id,
                playerName: draftPlayer.fullName,
              });
              console.error(`❌ [useLineupDraftManager] MISSING PLAYER for position ${posId}:`, {
                playerId: draftPlayer._id,
                playerName: draftPlayer.fullName,
                availablePlayerIds: gamePlayers.map((p) => p._id),
                availablePlayerNames: gamePlayers.map((p) => p.fullName),
              });
            }
          } else {
            console.warn(`⚠️ [useLineupDraftManager] Empty position ${posId} in draft`);
          }
        });

        console.log('✅ [useLineupDraftManager] Formation restoration complete:', {
          totalPositions: Object.keys(draftFormation).length,
          restoredPositions: Object.keys(restoredFormation).length,
          missingPlayersCount: missingPlayers.length,
          missingPlayers,
          restoredFormation: Object.entries(restoredFormation).map(([pos, player]) => ({
            position: pos,
            playerId: player._id,
            playerName: player.fullName,
          })),
        });

        setFormation(restoredFormation);
        setFormationType(draftFormationType);
      } else {
        console.log('⚠️ [useLineupDraftManager] No formation in draft to restore');
      }

      console.log('✅ [useLineupDraftManager] Draft loaded, setting roster statuses:', {
        statusCount: Object.keys(draftStatuses).length,
        statuses: draftStatuses,
      });
      setLocalRosterStatuses(draftStatuses);
      console.log('🔍 [useLineupDraftManager] === DRAFT LOADING END (draft path) ===');
      return; // Draft loaded, skip gameRosters
    }

    // 🔍 DEBUG: Log why draft wasn't loaded
    if (game.status === 'Scheduled') {
      console.error(`⚠️ [useLineupDraftManager] Scheduled game but NO LINEUP DRAFT found:`, {
        hasLineupDraft: !!game.lineupDraft,
        lineupDraft: game.lineupDraft,
        fallingBackTo: 'gameRosters or default',
        WARNING: `This might indicate lineup draft was not saved or cleared! Formation data may be lost.`,
      });
    } else if (game.status === 'Played') {
      console.log(
        '📝 [useLineupDraftManager] Played game with no lineup draft (expected, uses gameRosters):',
        {
          gameStatus: game.status,
          hasLineupDraft: !!game.lineupDraft,
          decision: 'Fall back to gameRosters (Played games use finalized rosters)',
          note: 'Lineup drafts are only for Scheduled games. Report drafts are managed separately.',
        }
      );
    } else {
      console.log('📝 [useLineupDraftManager] Done/other game, draft loading skipped (expected):', {
        gameStatus: game.status,
        hasLineupDraft: !!game.lineupDraft,
        decision: 'Fall back to gameRosters (done games use finalized rosters)',
      });
    }

    // Priority 2: Load from gameRosters (for Played/Done games, or if no draft)
    console.log('🔍 [useLineupDraftManager] Attempting gameRosters fallback...');
    if (gameRosters && gameRosters.length > 0) {
      const rosterForGame = gameRosters.filter((roster) => {
        const rosterGameId =
          typeof roster.game === 'object' && roster.game !== null ? roster.game._id : roster.game;
        return rosterGameId === gameId;
      });

      console.log('🔍 [useLineupDraftManager] GameRosters found:', {
        totalRosters: gameRosters.length,
        rostersForThisGame: rosterForGame.length,
        rosterDetails: rosterForGame.map((r) => ({
          playerId: typeof r.player === 'object' ? r.player._id : r.player,
          playerName: typeof r.player === 'object' ? r.player.fullName : 'Unknown',
          status: r.status,
        })),
      });

      if (rosterForGame.length > 0) {
        const statuses = {};
        rosterForGame.forEach((roster) => {
          const playerId =
            typeof roster.player === 'object' && roster.player !== null
              ? roster.player._id
              : roster.player;
          statuses[playerId] = roster.status;
        });

        // FIX: Extract formation from gameRosters (all rosters have same formation, so take first)
        const firstRoster = rosterForGame[0];

        // 🔍 DIAGNOSTIC: Log the actual gameRoster structure
        console.log('🔍 [useLineupDraftManager] First gameRoster record structure:', {
          hasFormation: !!firstRoster.formation,
          formationValue: firstRoster.formation,
          formationType: typeof firstRoster.formation,
          hasFormationType: !!firstRoster.formationType,
          formationTypeValue: firstRoster.formationType,
          allKeys: Object.keys(firstRoster),
          fullRosterSample: firstRoster,
        });

        const hasFormationData = firstRoster.formation && firstRoster.formationType;

        if (hasFormationData) {
          console.log('✅ [useLineupDraftManager] Formation found in gameRosters!', {
            formationType: firstRoster.formationType,
            formationPositions: Object.keys(firstRoster.formation || {}).length,
            formation: firstRoster.formation,
          });

          // Restore formation type
          setFormationType(firstRoster.formationType);

          // Restore formation (reconstruct the position-to-player mapping)
          const restoredFormation = {};
          Object.entries(firstRoster.formation).forEach(([positionId, playerId]) => {
            if (playerId) {
              const player = gamePlayers.find((p) => p._id === playerId);
              if (player) {
                restoredFormation[positionId] = player;
                console.log(
                  `✅ Position ${positionId} restored: { playerId: "${playerId}", playerName: "${player.fullName}" }`
                );
              } else {
                console.warn(
                  `❌ MISSING PLAYER for position ${positionId}: playerId="${playerId}" not found in gamePlayers`
                );
              }
            }
          });

          setFormation(restoredFormation);
          setManualFormationMode(true);

          console.log('✅ [useLineupDraftManager] Loaded from gameRosters with formation:', {
            playerCount: Object.keys(statuses).length,
            playerStatuses: statuses,
            formationType: firstRoster.formationType,
            formationRestored: Object.keys(restoredFormation).length,
          });
        } else {
          console.log('✅ [useLineupDraftManager] Loaded from gameRosters (no formation):', {
            playerCount: Object.keys(statuses).length,
            playerStatuses: statuses,
            WARNING: 'NOTE: No formation data in gameRosters. Formation will be auto-built.',
          });
        }

        setLocalRosterStatuses(statuses);
        console.log('🔍 [useLineupDraftManager] === DRAFT LOADING END (gameRosters path) ===');
        return;
      } else {
        console.warn('⚠️ [useLineupDraftManager] No rosters found for this game in gameRosters');
      }
    } else {
      console.warn('⚠️ [useLineupDraftManager] No gameRosters available');
    }

    // Priority 3: Default (empty rosters)
    console.log('⚠️ [useLineupDraftManager] Using default (empty) rosters');
    setLocalRosterStatuses({});
    console.log('🔍 [useLineupDraftManager] === DRAFT LOADING END (default path) ===');
  }, [gameId, game, gameRosters, gamePlayers]);

  // Effect 2: Debounced autosave for roster statuses and formation
  useEffect(() => {
    // CRITICAL: Don't autosave if game is being finalized (prevents write conflicts)
    if (isFinalizingGame) {
      console.log('⏸️ [useLineupDraftManager] Skipping autosave - game is being finalized');
      return;
    }

    // Only autosave for Scheduled games
    if (!game || game.status !== 'Scheduled') {
      if (game) {
        console.log('⏸️ [useLineupDraftManager] Skipping autosave - not Scheduled:', {
          gameStatus: game.status,
          note: 'Autosave only runs for Scheduled games',
        });
      }
      return;
    }

    // Don't autosave on initial load (wait for user changes)
    if (Object.keys(localRosterStatuses).length === 0) {
      console.log('⏸️ [useLineupDraftManager] Skipping autosave - no roster data yet');
      return;
    }

    console.log('💾 [useLineupDraftManager] Autosave triggered - starting 2.5s timer...');

    // Set autosaving state
    setIsAutosaving(true);
    setAutosaveError(null);

    // Debounce: Wait 2.5 seconds after last change
    const autosaveTimer = setTimeout(async () => {
      try {
        console.log('💾 [useLineupDraftManager] 2.5s elapsed, executing autosave...');

        // Prepare formation data for draft (only include player IDs and basic info)
        const formationForDraft = {};
        Object.keys(formation).forEach((posId) => {
          const player = formation[posId];
          if (player && player._id) {
            formationForDraft[posId] = {
              _id: player._id,
              fullName: player.fullName,
              kitNumber: player.kitNumber,
            };
          }
        });

        const payload = {
          rosters: localRosterStatuses,
          formation: formationForDraft,
          formationType: formationType,
        };

        console.log('💾 [useLineupDraftManager] Autosave payload:', {
          rostersCount: Object.keys(localRosterStatuses).length,
          formationPositions: Object.keys(formationForDraft).length,
          formationType,
          formationDetails: Object.entries(formationForDraft).map(([pos, player]) => ({
            position: pos,
            playerId: player._id,
            playerName: player.fullName,
          })),
        });

        // ✅ REFACTORED: Use apiClient instead of manual fetch
        const result = await apiClient.put(`/api/games/${gameId}/draft`, payload);
        console.log('✅ [useLineupDraftManager] Draft autosaved successfully!', {
          result,
          savedFormationPositions: Object.keys(formationForDraft).length,
          savedRostersCount: Object.keys(localRosterStatuses).length,
        });
        setIsAutosaving(false);
      } catch (error) {
        console.error('❌ [useLineupDraftManager] Error autosaving draft:', {
          error: error.message,
          stack: error.stack,
        });
        setAutosaveError(error.message);
        setIsAutosaving(false);
      }
    }, 2500); // 2.5 second debounce

    // Cleanup: Cancel timer if localRosterStatuses, formation, or finalization status changes
    return () => {
      clearTimeout(autosaveTimer);
    };
  }, [localRosterStatuses, formation, formationType, gameId, game, isFinalizingGame]);

  return {
    localRosterStatuses,
    setLocalRosterStatuses,
    isAutosaving,
    autosaveError,
    setIsAutosaving,
    setAutosaveError,
  };
}
