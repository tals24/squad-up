
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../components/DataContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Loader2, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StandardButton } from "@/components/ui/design-system-components";
import { User } from '@/api/entities'; // Updated import path
import WeeklyCalendar from '../components/WeeklyCalendar';
import DrillLibrarySidebar from '../components/DrillLibrarySidebar';
import { saveTrainingPlan } from '@/api/functions'; // Updated import path
import { loadTrainingPlan } from '@/api/functions'; // Updated import path
import ConfirmationToast from '../components/ConfirmationToast';
import { useSearchParams } from 'react-router-dom';

// Date helpers
import { startOfWeek, endOfWeek, addWeeks, subWeeks, getYear, getISOWeek, format } from 'date-fns'; // Reordered date-fns imports

const getWeekId = (date) => `${getYear(date)}-${getISOWeek(date)}`;

const initialPlanStructure = () => ({
  Sunday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
  Monday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
  Tuesday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
  Wednesday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
  Thursday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
  Friday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
  Saturday: { "Warm-up": { drills: [], notes: "" }, "Main Part": { drills: [], notes: "" }, "Small Game": { drills: [], notes: "" } },
});

export default function TrainingPlanner() {
  const { users, teams, refreshData } = useData();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [searchParams] = useSearchParams();
  
  // Handle week offset from URL parameter
  const weekOffset = parseInt(searchParams.get('weekOffset') || '0', 10);
  const [currentDate, setCurrentDate] = useState(() => addWeeks(new Date(), weekOffset));
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [trainingPlan, setTrainingPlan] = useState(initialPlanStructure()); // Renamed from weeklyPlan
  
  // Debug logging for trainingPlan
  console.log('🔍 TrainingPlanner trainingPlan state:', trainingPlan);
  
  // Clear any existing localStorage drafts on component mount
  useEffect(() => {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('trainingPlan_')) {
        console.log('🧹 Clearing localStorage draft on mount:', key);
        localStorage.removeItem(key);
      }
    });
  }, []);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  const weekId = getWeekId(currentDate);
  const localStorageKey = `trainingPlan_${selectedTeamId}_${weekId}`;

  const managedTeams = useMemo(() => {
    console.log('🔍 TrainingPlanner Debug:', {
      currentUser: currentUser?.email,
      usersLength: users.length,
      teamsLength: teams.length,
      userRole
    });
    
    if (!currentUser || !users.length || !teams.length) {
      console.log('❌ Missing data:', { currentUser: !!currentUser, users: users.length, teams: teams.length });
      return [];
    }
    
    if (userRole === 'Admin' || userRole === 'Department Manager') {
      console.log('✅ Admin/Dept Manager - returning all teams:', teams.length);
      return teams;
    }
    
    if (userRole === 'Division Manager') {
      const mongoUser = users.find(u => u.email?.toLowerCase() === currentUser.email.toLowerCase());
      console.log('🔍 Division Manager - mongoUser:', mongoUser);
      const filteredTeams = teams.filter(team => team.division === mongoUser?.department);
      console.log('✅ Division Manager - filtered teams:', filteredTeams.length);
      return filteredTeams;
    }
    
    if (userRole === 'Coach') {
      const mongoUser = users.find(u => u.email?.toLowerCase() === currentUser.email.toLowerCase());
      console.log('🔍 Coach - mongoUser:', mongoUser);
      console.log('🔍 Coach - all teams:', teams.map(t => ({ id: t._id, name: t.teamName, coach: t.coach })));
      
      const filteredTeams = teams.filter(team => {
        const isCoach = team.coach?._id === mongoUser?._id || team.coach === mongoUser?._id;
        console.log(`🔍 Team ${team.teamName} - coach match:`, { 
          teamCoach: team.coach, 
          userID: mongoUser?._id, 
          isCoach 
        });
        return isCoach;
      });
      
      console.log('✅ Coach - filtered teams:', filteredTeams.length, filteredTeams.map(t => t.teamName));
      return filteredTeams;
    }
    
    console.log('❌ No matching role');
    return [];
  }, [currentUser, users, teams, userRole]);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await User.me();
      setCurrentUser(user);
      
      const mongoUser = users.find(u => u.email?.toLowerCase() === user.email.toLowerCase());
      setUserRole(mongoUser?.role || 'Coach');
    };
    if (users.length > 0) fetchUser();
  }, [users]);
  
  useEffect(() => {
    if (managedTeams.length > 0 && !selectedTeamId) {
      const firstTeamId = managedTeams[0]._id || managedTeams[0].id;
      setSelectedTeamId(firstTeamId);
    }
  }, [managedTeams, selectedTeamId]);

  // Load plan data when team or week changes
  useEffect(() => {
    const loadPlanData = async () => {
      if (!selectedTeamId) return;

      console.log('Loading plan data for:', { selectedTeamId, weekId, localStorageKey });
      
      // First, check localStorage for existing draft
      const savedDraft = localStorage.getItem(localStorageKey);
      console.log('🔍 Checking localStorage for draft:', localStorageKey, savedDraft ? 'Found' : 'Not found');
      if (savedDraft) {
        console.log('Found localStorage draft, loading...', Object.keys(JSON.parse(savedDraft)));
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setTrainingPlan(parsedDraft); // Renamed from setWeeklyPlan
          setHasSavedData(false); // This is a draft, not saved data
          return;
        } catch (error) {
          console.error('Error parsing localStorage draft:', error);
          localStorage.removeItem(localStorageKey); // Remove corrupted data
        }
      }

      // No localStorage draft found, try loading from database
      console.log('No localStorage draft found, loading from database...');
      setIsLoadingPlan(true);
      try {
        console.log('🔍 Loading training plan for:', { teamId: selectedTeamId, weekIdentifier: weekId });
        console.log('🔍 Current date for week calculation:', currentDate);
        console.log('🔍 Week ID calculation:', getWeekId(currentDate));
        const response = await loadTrainingPlan({ teamId: selectedTeamId, weekIdentifier: weekId });
        console.log('🔍 Load response:', response);
        console.log('🔍 Response data structure:', {
          success: response.data?.success,
          hasSavedData: response.data?.data?.hasSavedData,
          weeklyPlanKeys: response.data?.data?.weeklyPlan ? Object.keys(response.data.data.weeklyPlan) : 'undefined',
          mondayDrills: response.data?.data?.weeklyPlan?.Monday?.["Warm-up"]?.drills?.length || 0
        });
        if (response.data?.success) {
          // Use the loaded plan if it exists, otherwise use initial structure
          const loadedPlan = response.data.data?.weeklyPlan || initialPlanStructure();
          console.log('🔍 Setting training plan to:', loadedPlan);
          setTrainingPlan(loadedPlan);
          setHasSavedData(response.data.data?.hasSavedData || false);
          console.log('Loaded plan from database:', response.data.data?.hasSavedData ? 'with saved data' : 'empty plan');
        } else {
          console.error('Failed to load training plan:', response.data?.error);
          setTrainingPlan(initialPlanStructure()); // Renamed from setWeeklyPlan
          setHasSavedData(false);
        }
      } catch (error) {
        console.error('Error loading training plan:', error);
        setTrainingPlan(initialPlanStructure()); // Renamed from setWeeklyPlan
        setHasSavedData(false);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    loadPlanData();
  }, [selectedTeamId, weekId, localStorageKey]);

  // Save to localStorage whenever trainingPlan changes (but not when loading from database)
  useEffect(() => {
    if (selectedTeamId && !isLoadingPlan && !hasSavedData) {
      console.log('Saving to localStorage:', localStorageKey);
      localStorage.setItem(localStorageKey, JSON.stringify(trainingPlan)); // Renamed from weeklyPlan
    } else if (hasSavedData) {
      console.log('🧹 Not saving to localStorage - data is saved to database');
    }
  }, [trainingPlan, localStorageKey, selectedTeamId, isLoadingPlan, hasSavedData]); // Renamed from weeklyPlan

  const handleDrop = useCallback((day, slot, drill) => {
    setTrainingPlan(prevPlan => { // Renamed from setWeeklyPlan
      const newPlan = { ...prevPlan };
      const currentDrills = newPlan[day][slot].drills;
      // Prevent adding duplicates
      if (!currentDrills.some(d => d.id === drill.id)) {
        newPlan[day][slot].drills = [...currentDrills, drill];
        
        // If this was saved data, mark it as modified (draft)
        if (hasSavedData) {
          console.log('📝 Modified saved plan - marking as draft');
          setHasSavedData(false);
        }
      }
      return newPlan;
    });
  }, [hasSavedData]);

  const handleRemoveDrill = useCallback((day, slot, drillId) => {
    setTrainingPlan(prevPlan => { // Renamed from setWeeklyPlan
      const newPlan = { ...prevPlan };
      newPlan[day][slot].drills = newPlan[day][slot].drills.filter(d => d.id !== drillId);
      
      // If this was saved data, mark it as modified (draft)
      if (hasSavedData) {
        console.log('📝 Modified saved plan - marking as draft');
        setHasSavedData(false);
      }
      
      return newPlan;
    });
  }, [hasSavedData]);

  const handleNotesChange = useCallback((day, notes) => {
    setTrainingPlan(prevPlan => ({ // Renamed from setWeeklyPlan
      ...prevPlan,
      [day]: {
        ...prevPlan[day],
        "Small Game": { ...prevPlan[day]["Small Game"], notes }
      }
    }));
    
    // If this was saved data, mark it as modified (draft)
    if (hasSavedData) {
      console.log('📝 Modified saved plan - marking as draft');
      setHasSavedData(false);
    }
  }, [hasSavedData]);
  
  const handleSavePlan = async () => {
    if (!selectedTeamId) {
        setConfirmationConfig({ type: 'error', title: 'No Team Selected', message: 'Please select a team before saving the plan.' });
        setShowConfirmation(true);
        return;
    }
    
    setIsSaving(true);
    try {
        console.log('🔍 Saving training plan:', { 
            teamId: selectedTeamId, 
            weekIdentifier: weekId, 
            planStructure: Object.keys(trainingPlan),
            sundayDrills: trainingPlan.Sunday?.["Warm-up"]?.drills?.length || 0
        });
        const response = await saveTrainingPlan({ weeklyPlan: trainingPlan, teamId: selectedTeamId, weekIdentifier: weekId }); // Pass trainingPlan as weeklyPlan
        console.log('🔍 Save response:', response);
        if (response.data?.success) {
            // Clear localStorage draft since it's now saved to database
            console.log('🧹 Clearing localStorage draft:', localStorageKey);
            localStorage.removeItem(localStorageKey);
            // Also clear any other training plan drafts for this team
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
              if (key.startsWith(`trainingPlan_${selectedTeamId}_`)) {
                console.log('🧹 Clearing additional draft:', key);
                localStorage.removeItem(key);
              }
            });
            // Clear ALL training plan drafts to be extra sure
            allKeys.forEach(key => {
              if (key.startsWith('trainingPlan_')) {
                console.log('🧹 Clearing ALL training plan drafts:', key);
                localStorage.removeItem(key);
              }
            });
            setHasSavedData(true);
            
            // Refresh dashboard data to show new training sessions
            console.log('🔄 Refreshing dashboard data after training plan save...');
            await refreshData();
            
            setConfirmationConfig({ type: 'success', title: 'Plan Saved!', message: 'The weekly training plan has been successfully saved and dashboard updated.' });
        } else {
            throw new Error(response.data?.error || "An unknown error occurred.");
        }
    } catch (error) {
        setConfirmationConfig({ type: 'error', title: 'Save Failed', message: `Could not save the plan: ${error.message}` });
    } finally {
        setIsSaving(false);
        setShowConfirmation(true);
    }
  };

  const handleTeamChange = (teamId) => {
    setSelectedTeamId(teamId);
    // The useEffect will handle loading the new team's data
  };

  const handleWeekChange = (newDate) => {
    setCurrentDate(newDate);
    // The useEffect will handle loading the new week's data
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b border-slate-700 bg-slate-800/70 backdrop-blur-sm flex items-center justify-between z-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Training <span className="text-cyan-400">Planner</span></h1>
          <div className="flex items-center gap-4 text-white mt-1">
            <div className="flex items-center gap-2 bg-slate-700/50 border border-slate-600 rounded-lg p-1">
              <Button onClick={() => handleWeekChange(subWeeks(currentDate, 1))} variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-600 hover:text-cyan-400">
                <ChevronLeft className="w-5 h-5"/>
              </Button>
              <span className="font-bold text-lg text-white tabular-nums tracking-tighter">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </span>
              <Button onClick={() => handleWeekChange(addWeeks(currentDate, 1))} variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-600 hover:text-cyan-400">
                <ChevronRight className="w-5 h-5"/>
              </Button>
            </div>
            <Select value={selectedTeamId} onValueChange={handleTeamChange}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600 text-white hover:border-cyan-400/50">
                <SelectValue placeholder={managedTeams.length > 0 ? "Select Team..." : "No Teams Available"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                {managedTeams.length > 0 ? (
                  managedTeams.map(team => (
                    <SelectItem key={team._id || team.id} value={team._id || team.id} className="focus:bg-slate-700 hover:bg-slate-700">
                      {team.teamName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-teams" disabled>No Teams Available</SelectItem>
                )}
              </SelectContent>
            </Select>
            {hasSavedData && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 border border-green-500/30 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Plan Saved</span>
              </div>
            )}
          </div>
        </div>
        <Button onClick={handleSavePlan} disabled={isSaving} className="bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/20 flex items-center gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
            {isSaving ? 'Saving...' : 'Save Weekly Plan'}
        </Button>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {isLoadingPlan ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
              <p className="text-slate-400">Loading training plan...</p>
            </div>
          </div>
        ) : selectedTeamId && selectedTeamId !== "no-teams" ? (
            <>
                <WeeklyCalendar 
                    plan={trainingPlan} // Renamed from weeklyPlan
                    onDrop={handleDrop}
                    onRemoveDrill={handleRemoveDrill}
                    onNotesChange={handleNotesChange}
                    currentDate={currentDate}
                    onViewDrillDetails={(drill) => {
                        console.log('🔍 Viewing drill details:', drill);
                        // The drill details modal is handled within the WeeklyCalendar component
                    }}
                />
                <DrillLibrarySidebar context="training-planner" />
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-center p-4">
                <div className="p-8 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 max-w-sm">
                    <Info className="w-12 h-12 text-cyan-400 mx-auto mb-4"/>
                    <h2 className="text-xl font-bold text-white">Select a Team to Begin</h2>
                    <p className="text-slate-400 mt-2">Please select a team from the dropdown above to start planning your training week.</p>
                </div>
            </div>
        )}
      </div>

      <ConfirmationToast
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        type={confirmationConfig.type}
      />
    </div>
  );
}
