
import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchAllTables } from '@/shared/api';

const DataContext = createContext(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
};

export const DataProvider = ({ children }) => {
    const [data, setData] = useState({
        users: [],
        teams: [],
        players: [],
        games: [],
        reports: [],
        gameReports: [], // Add gameReports to initial state
        drills: [],
        gameRosters: [],
        trainingSessions: [], // Added new state for training sessions
        sessionDrills: [],     // Added new state for session drills
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [organizationConfig, setOrganizationConfig] = useState(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);

    const fetchData = async () => {
        console.log('📊 DataContext: Starting data fetch...');
        setIsLoading(true);
        setError(null);
        try {
            // Fetch all data in a single, rate-limited backend call
            console.log('📊 DataContext: Calling fetchAllTables...');
            const response = await fetchAllTables();

            console.log('📊 DataContext: Response received:', {
                hasData: !!response,
                success: response?.success,
                dataKeys: response?.data ? Object.keys(response.data) : 'none'
            });

            if (!response || !response.success) {
                console.error("❌ DataContext fetch error:", response);
                throw new Error("Failed to fetch data from backend.");
            }
            
            // Backend returns: { success: true, data: { users: [], teams: [], ... } }
            const apiData = response.data;
            const newData = {
                users: apiData.users || [],
                teams: apiData.teams || [],
                players: apiData.players || [],
                games: apiData.games || [],
                reports: apiData.reports || [],
                gameReports: apiData.gameReports || [], // Extract gameReports separately
                drills: apiData.drills || [],
                gameRosters: apiData.gameRosters || [],
                trainingSessions: apiData.trainingSessions || [], // Populating new state from response
                sessionDrills: apiData.sessionDrills || [],       // Populating new state from response
            };
            
            // If gameReports not provided, filter from reports
            if (!newData.gameReports || newData.gameReports.length === 0) {
                newData.gameReports = (apiData.reports || []).filter(report => report.reportType === 'GameReport');
            }
            
            setData(newData);
            
            console.log('✅ DataContext: Data loaded successfully:', {
                users: newData.users.length,
                teams: newData.teams.length,
                players: newData.players.length,
                games: newData.games.length,
                reports: newData.reports.length,
                gameReports: newData.gameReports.length,
                drills: newData.drills.length,
                gameRosters: newData.gameRosters.length,
                trainingSessions: newData.trainingSessions.length,
                sessionDrills: newData.sessionDrills.length
            });
            
            // Debug logging
            console.log('🔍 Data structure:', {
                users: apiData.users?.length || 0,
                teams: apiData.teams?.length || 0,
                players: apiData.players?.length || 0,
                games: apiData.games?.length || 0
            });
            
            console.log('🔍 DETAILED DEBUG - newData structure:', newData);
            console.log('🔍 DETAILED DEBUG - First few players:', newData.players.slice(0, 3));
            console.log('🔍 DETAILED DEBUG - First few teams:', newData.teams.slice(0, 2));

        } catch (err) {
            console.error("Error fetching data for context:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrganizationConfig = async () => {
        try {
            setIsLoadingConfig(true);
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                console.warn('⚠️ No auth token found, skipping config fetch');
                const defaultConfig = {
                    features: {
                        shotTrackingEnabled: false,
                        positionSpecificMetricsEnabled: false,
                        detailedDisciplinaryEnabled: true,
                        goalInvolvementEnabled: true,
                        gameDifficultyAssessmentEnabled: true
                    },
                    ageGroupOverrides: []
                };
                setOrganizationConfig(defaultConfig);
                console.log('🔍 [DEBUG] Using default config (no token):', defaultConfig.features);
                console.log('🔍 [DEBUG] gameDifficultyAssessmentEnabled in default:', defaultConfig.features.gameDifficultyAssessmentEnabled);
                setIsLoadingConfig(false);
                return;
            }

            const response = await fetch('http://localhost:3001/api/organizations/default/config', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch organization config');
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                setOrganizationConfig(result.data);
                console.log('✅ Organization config loaded:', result.data.isDefault ? '(default)' : '(saved)');
                console.log('🔍 [DEBUG] Organization config features:', result.data.features);
                console.log('🔍 [DEBUG] gameDifficultyAssessmentEnabled enabled?', result.data.features?.gameDifficultyAssessmentEnabled);
            }
        } catch (error) {
            console.error('❌ Failed to fetch organization config:', error);
            // Set default config on error
            const fallbackConfig = {
                features: {
                    shotTrackingEnabled: false,
                    positionSpecificMetricsEnabled: false,
                    detailedDisciplinaryEnabled: true,
                    goalInvolvementEnabled: true,
                    gameDifficultyAssessmentEnabled: true
                },
                ageGroupOverrides: []
            };
            setOrganizationConfig(fallbackConfig);
            console.log('🔍 [DEBUG] Using fallback config (error):', fallbackConfig.features);
            console.log('🔍 [DEBUG] gameDifficultyAssessmentEnabled in fallback:', fallbackConfig.features.gameDifficultyAssessmentEnabled);
        } finally {
            setIsLoadingConfig(false);
        }
    };

    useEffect(() => {
        console.log('📊 DataContext: Component mounted, starting initial data fetch...');
        fetchData();
        fetchOrganizationConfig();
    }, []);

    /**
     * Update a single game in the global cache
     * Used to sync local state changes with global state without full refresh
     * @param {Object} updatedGame - The updated game object (must have _id)
     */
    const updateGameInCache = (updatedGame) => {
        if (!updatedGame || !updatedGame._id) {
            console.warn('⚠️ [DataProvider] updateGameInCache called without valid game _id');
            return;
        }

        setData((prev) => {
            const gameIndex = prev.games.findIndex(g => g._id === updatedGame._id);
            
            if (gameIndex === -1) {
                console.warn(`⚠️ [DataProvider] Game ${updatedGame._id} not found in cache, cannot update`);
                return prev;
            }

            // Deep merge: preserve existing game fields, update with new ones
            const existingGame = prev.games[gameIndex];
            const mergedGame = {
                ...existingGame,
                ...updatedGame,
                // Ensure nested objects are merged correctly
                matchDuration: updatedGame.matchDuration || existingGame.matchDuration,
            };

            const updatedGames = [...prev.games];
            updatedGames[gameIndex] = mergedGame;

            console.log('✅ [DataProvider] Game cache updated:', {
                gameId: updatedGame._id,
                oldStatus: existingGame.status,
                newStatus: updatedGame.status,
                hasLineupDraft: !!updatedGame.lineupDraft
            });

            return {
                ...prev,
                games: updatedGames
            };
        });
    };

    /**
     * Update game rosters in the global cache
     * Used when rosters are saved/updated without full refresh
     * @param {Array} newRosters - Array of roster objects (must have game field)
     * @param {String} gameId - The game ID these rosters belong to
     */
    const updateGameRostersInCache = (newRosters, gameId) => {
        if (!newRosters || !Array.isArray(newRosters) || !gameId) {
            console.warn('⚠️ [DataProvider] updateGameRostersInCache called with invalid parameters');
            return;
        }

        setData((prev) => {
            // Remove old rosters for this game
            const filteredRosters = prev.gameRosters.filter(roster => {
                const rosterGameId = typeof roster.game === "object" && roster.game !== null ? roster.game._id : roster.game;
                return rosterGameId !== gameId;
            });

            // Add new rosters
            const updatedRosters = [...filteredRosters, ...newRosters];

            console.log('✅ [DataProvider] Game rosters cache updated:', {
                gameId,
                removedCount: prev.gameRosters.length - filteredRosters.length,
                addedCount: newRosters.length,
                totalRosters: updatedRosters.length
            });

            return {
                ...prev,
                gameRosters: updatedRosters
            };
        });
    };

    const value = { 
        ...data, 
        isLoading, 
        error, 
        refreshData: fetchData,
        updateGameInCache,
        updateGameRostersInCache,
        organizationConfig,
        isLoadingConfig,
        refreshConfig: fetchOrganizationConfig
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
