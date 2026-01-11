import { useEffect, useMemo } from 'react';
import { useAutosave } from '@/shared/hooks/useAutosave';

/**
 * Custom hook to manage report drafts for Played/Done games
 *
 * Responsibilities:
 * 1. Load report draft (if exists) and merge with current state
 * 2. Autosave report data for Played games (debounced 2.5s)
 * 3. Skip autosave for Done games (finalized) and while finalizing
 *
 * Draft Priority:
 * - Priority 1: Load from game.reportDraft (temporary, editable)
 * - Priority 2: Fall back to saved data in collections (PlayerMatchStat, etc.)
 *
 * @param {Object} params
 * @param {string} params.gameId - Game ID
 * @param {Object} params.game - Game object with status and reportDraft
 * @param {boolean} params.isFinalizingGame - Whether game is being finalized
 * @param {Object} params.teamSummary - Current team summary state
 * @param {Function} params.setTeamSummary - Setter for team summary
 * @param {Object} params.finalScore - Current final score state
 * @param {Function} params.setFinalScore - Setter for final score
 * @param {Object} params.matchDuration - Current match duration state
 * @param {Function} params.setMatchDuration - Setter for match duration
 * @param {Object} params.localPlayerReports - Current player reports state
 * @param {Function} params.setLocalPlayerReports - Setter for player reports
 * @param {Object} params.localPlayerMatchStats - Current player match stats state
 * @param {Function} params.setLocalPlayerMatchStats - Setter for player match stats
 *
 * @returns {Object} return.isAutosavingReport - Whether autosave is in progress
 * @returns {Error|null} return.reportAutosaveError - Autosave error if any
 */
export function useReportDraftManager({
  gameId,
  game,
  isFinalizingGame,
  teamSummary,
  setTeamSummary,
  finalScore,
  setFinalScore,
  matchDuration,
  setMatchDuration,
  localPlayerReports,
  setLocalPlayerReports,
  localPlayerMatchStats,
  setLocalPlayerMatchStats,
}) {
  // === LOAD REPORT DRAFT ===
  useEffect(() => {
    if (!gameId || !game || (game.status !== 'Played' && game.status !== 'Done')) {
      return;
    }

    console.log('🔍 [useReportDraftManager] === DRAFT LOADING START ===');
    console.log('🔍 [useReportDraftManager] Game context:', {
      gameId,
      gameStatus: game.status,
      hasReportDraft: !!game.reportDraft,
      reportDraftType: typeof game.reportDraft,
    });

    // Priority 1: Check for draft
    if (game.reportDraft && typeof game.reportDraft === 'object') {
      const draft = game.reportDraft;
      console.log('📋 [useReportDraftManager] Loading report draft:', {
        hasTeamSummary: !!draft.teamSummary,
        hasFinalScore: !!draft.finalScore,
        hasMatchDuration: !!draft.matchDuration,
        hasPlayerReports: !!draft.playerReports,
        hasPlayerMatchStats: !!draft.playerMatchStats,
        teamSummaryKeys: draft.teamSummary ? Object.keys(draft.teamSummary) : [],
        playerReportsCount: draft.playerReports ? Object.keys(draft.playerReports).length : 0,
        playerMatchStatsCount: draft.playerMatchStats
          ? Object.keys(draft.playerMatchStats).length
          : 0,
      });

      // Merge draft with existing state (draft overrides saved)
      if (draft.teamSummary) {
        setTeamSummary((prev) => {
          const merged = { ...prev, ...draft.teamSummary };
          console.log('✅ [useReportDraftManager] Merged teamSummary:', {
            prev,
            draft: draft.teamSummary,
            merged,
            defenseSummaryInDraft: draft.teamSummary.defenseSummary,
            defenseSummaryInMerged: merged.defenseSummary,
            allDraftKeys: Object.keys(draft.teamSummary),
          });
          return merged;
        });
      }

      if (draft.finalScore) {
        setFinalScore((prev) => {
          const merged = { ...prev, ...draft.finalScore };
          console.log('✅ [useReportDraftManager] Merged finalScore:', {
            prev,
            draft: draft.finalScore,
            merged,
          });
          return merged;
        });
      }

      if (draft.matchDuration) {
        setMatchDuration((prev) => {
          const merged = { ...prev, ...draft.matchDuration };
          console.log('✅ [useReportDraftManager] Merged matchDuration:', {
            prev,
            draft: draft.matchDuration,
            merged,
          });
          return merged;
        });
      }

      if (draft.playerReports) {
        setLocalPlayerReports((prev) => {
          const merged = { ...prev, ...draft.playerReports };
          console.log('✅ [useReportDraftManager] Merged playerReports:', {
            prevCount: Object.keys(prev).length,
            draftCount: Object.keys(draft.playerReports).length,
            mergedCount: Object.keys(merged).length,
          });
          return merged;
        });
      }

      if (draft.playerMatchStats) {
        setLocalPlayerMatchStats((prev) => {
          const merged = { ...prev, ...draft.playerMatchStats };
          console.log('✅ [useReportDraftManager] Merged playerMatchStats:', {
            prevCount: Object.keys(prev).length,
            draftCount: Object.keys(draft.playerMatchStats).length,
            mergedCount: Object.keys(merged).length,
            draftSample:
              Object.keys(draft.playerMatchStats).length > 0
                ? draft.playerMatchStats[Object.keys(draft.playerMatchStats)[0]]
                : null,
            mergedSample: Object.keys(merged).length > 0 ? merged[Object.keys(merged)[0]] : null,
          });
          return merged;
        });
      }

      console.log('✅ [useReportDraftManager] Report draft loaded and merged with saved data');
      console.log('🔍 [useReportDraftManager] === DRAFT LOADING END (draft path) ===');
      return; // Draft loaded
    }

    // Priority 2: For Done games, stats are loaded from PlayerMatchStat collection via loadPlayerMatchStats
    // For Played games without draft, stats will be loaded by loadPlayerMatchStats
    if (game.status === 'Done') {
      console.log(
        '✅ [useReportDraftManager] Done game - stats will be loaded from PlayerMatchStat collection'
      );
    } else {
      console.log(
        '⚠️ [useReportDraftManager] No draft found, stats will be loaded from PlayerMatchStat collection'
      );
    }
    console.log('🔍 [useReportDraftManager] === DRAFT LOADING END (no draft path) ===');
  }, [gameId, game]); // Note: setters not included to avoid infinite loops

  // === AUTOSAVE REPORT DRAFT ===
  // Memoize report data for autosave to prevent unnecessary re-renders
  const reportDataForAutosave = useMemo(
    () => ({
      teamSummary,
      finalScore,
      matchDuration,
      playerReports: localPlayerReports,
      playerMatchStats: localPlayerMatchStats,
    }),
    [teamSummary, finalScore, matchDuration, localPlayerReports, localPlayerMatchStats]
  );

  // Autosave for Played games (report draft)
  const { isAutosaving: isAutosavingReport, autosaveError: reportAutosaveError } = useAutosave({
    data: reportDataForAutosave,
    endpoint: `http://localhost:3001/api/games/${gameId}/draft`,
    enabled: game?.status === 'Played' && !isFinalizingGame,
    debounceMs: 2500,
    shouldSkip: (data) => {
      console.log('🔍 [useReportDraftManager] Autosave shouldSkip check:', {
        gameStatus: game?.status,
        isFinalizingGame,
        hasData: !!data,
      });

      // Skip if no meaningful data to save (use the data parameter passed to the hook)
      if (!data) {
        console.log('⏸️ [useReportDraftManager] Skipping autosave - no data');
        return true;
      }

      const hasTeamSummary =
        data.teamSummary && Object.values(data.teamSummary).some((v) => v && v.trim());
      if (data.teamSummary) {
        console.log('🔍 [useReportDraftManager] TeamSummary autosave check:', {
          teamSummary: data.teamSummary,
          values: Object.values(data.teamSummary),
          hasTeamSummary,
        });
      }
      const hasFinalScore =
        data.finalScore && (data.finalScore.ourScore > 0 || data.finalScore.opponentScore > 0);
      const hasMatchDuration =
        data.matchDuration &&
        (data.matchDuration.regularTime !== 90 ||
          data.matchDuration.firstHalfExtraTime > 0 ||
          data.matchDuration.secondHalfExtraTime > 0);
      const hasPlayerReports = data.playerReports && Object.keys(data.playerReports).length > 0;
      const hasPlayerMatchStats =
        data.playerMatchStats && Object.keys(data.playerMatchStats).length > 0;

      const shouldSkip =
        !hasTeamSummary &&
        !hasFinalScore &&
        !hasMatchDuration &&
        !hasPlayerReports &&
        !hasPlayerMatchStats;

      console.log('🔍 [useReportDraftManager] Autosave data check:', {
        hasTeamSummary,
        hasFinalScore,
        hasMatchDuration,
        hasPlayerReports,
        hasPlayerMatchStats,
        shouldSkip,
      });

      if (shouldSkip) {
        console.log('⏸️ [useReportDraftManager] Skipping autosave - no meaningful data to save');
      } else {
        console.log('💾 [useReportDraftManager] Autosave triggered - meaningful data found');
      }

      return shouldSkip;
    },
  });

  // Log autosave status changes
  useEffect(() => {
    if (isAutosavingReport) {
      console.log('💾 [useReportDraftManager] Autosaving report draft...');
    }
  }, [isAutosavingReport]);

  useEffect(() => {
    if (reportAutosaveError) {
      console.error('❌ [useReportDraftManager] Autosave error:', reportAutosaveError);
    }
  }, [reportAutosaveError]);

  return {
    isAutosavingReport,
    reportAutosaveError,
  };
}
