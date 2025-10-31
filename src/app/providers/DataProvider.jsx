
import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchAllTables } from '@/api/functions';

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

    const fetchData = async () => {
        console.log('📊 DataContext: Starting data fetch...');
        setIsLoading(true);
        setError(null);
        try {
            // Fetch all data in a single, rate-limited backend call
            console.log('📊 DataContext: Calling fetchAllTables...');
            const response = await fetchAllTables();

            console.log('📊 DataContext: Response received:', {
                hasError: !!response.error,
                hasData: !!response.data,
                dataKeys: response.data ? Object.keys(response.data) : 'none'
            });

            if (response.error || !response.data) {
                console.error("❌ DataContext fetch error:", response);
                throw new Error(response.error || "Failed to fetch data from backend.");
            }
            
            // The backend API returns: { success: true, data: { users: [], teams: [], ... } }
            // So we need to access response.data.data.* not response.data.*
            const apiData = response.data.data || response.data; // Fallback for different API structures
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
            
            // 🔍 DETAILED DEBUG: Let's see the actual data structure
            console.log('🔍 DETAILED DEBUG - Full response object:', response);
            console.log('🔍 DETAILED DEBUG - Response status:', response.status);
            console.log('🔍 DETAILED DEBUG - Response headers:', response.headers);
            console.log('🔍 DETAILED DEBUG - Raw response.data:', response.data);
            console.log('🔍 DETAILED DEBUG - typeof response.data:', typeof response.data);
            console.log('🔍 DETAILED DEBUG - response.data keys:', Object.keys(response.data || {}));
            
            // Check each property individually
            console.log('🔍 INDIVIDUAL CHECKS:');
            console.log('  - response.data.users:', response.data.users);
            console.log('  - response.data.teams:', response.data.teams);
            console.log('  - response.data.players:', response.data.players);
            console.log('  - response.data.games:', response.data.games);
            
            console.log('🔍 NESTED DATA CHECKS:');
            console.log('  - response.data.data?.users:', response.data.data?.users);
            console.log('  - response.data.data?.teams:', response.data.data?.teams);
            console.log('  - response.data.data?.players:', response.data.data?.players);
            console.log('  - apiData used:', apiData);
            
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

    useEffect(() => {
        console.log('📊 DataContext: Component mounted, starting initial data fetch...');
        fetchData();
    }, []);

    const value = { ...data, isLoading, error, refreshData: fetchData };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
