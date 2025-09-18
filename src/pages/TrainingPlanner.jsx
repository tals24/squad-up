
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../components/DataContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Loader2, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from '@/api/entities'; // Updated import path
import WeeklyCalendar from '../components/WeeklyCalendar';
import DrillLibrarySidebar from '../components/DrillLibrarySidebar';
import { saveTrainingPlan } from '@/api/functions'; // Updated import path
import { loadTrainingPlan } from '@/api/functions'; // Updated import path
import ConfirmationToast from '../components/ConfirmationToast';

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
  const { users, teams } = useData();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [trainingPlan, setTrainingPlan] = useState(initialPlanStructure()); // Renamed from weeklyPlan
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  const weekId = getWeekId(currentDate);
  const localStorageKey = `trainingPlan_${selectedTeamId}_${weekId}`;

  const managedTeams = useMemo(() => {
    if (!currentUser || !users.length || !teams.length) {
      return [];
    }
    
    if (userRole === 'Admin' || userRole === 'Department Manager') {
      return teams;
    }
    
    if (userRole === 'Division Manager') {
      const airtableUser = users.find(u => u.Email?.toLowerCase() === currentUser.email.toLowerCase());
      return teams.filter(team => team.Division === airtableUser?.Department);
    }
    
    if (userRole === 'Coach') {
      const airtableUser = users.find(u => u.Email?.toLowerCase() === currentUser.email.toLowerCase());
      return teams.filter(team => {
        return team.Coach?.includes(airtableUser?.UserID || airtableUser?.id);
      });
    }
    
    return [];
  }, [currentUser, users, teams, userRole]);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await User.me();
      setCurrentUser(user);
      
      const airtableUser = users.find(u => u.Email?.toLowerCase() === user.email.toLowerCase());
      setUserRole(airtableUser?.Role || 'Coach');
    };
    if (users.length > 0) fetchUser();
  }, [users]);
  
  useEffect(() => {
    if (managedTeams.length > 0 && !selectedTeamId) {
      const firstTeamId = managedTeams[0].id;
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
      if (savedDraft) {
        console.log('Found localStorage draft, loading...');
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
        const response = await loadTrainingPlan({ teamId: selectedTeamId, weekIdentifier: weekId });
        if (response.data?.success) {
          setTrainingPlan(response.data.weeklyPlan); // Renamed from setWeeklyPlan
          setHasSavedData(response.data.hasSavedData);
          console.log('Loaded plan from database:', response.data.hasSavedData ? 'with saved data' : 'empty plan');
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
    if (selectedTeamId && !isLoadingPlan) {
      console.log('Saving to localStorage:', localStorageKey);
      localStorage.setItem(localStorageKey, JSON.stringify(trainingPlan)); // Renamed from weeklyPlan
    }
  }, [trainingPlan, localStorageKey, selectedTeamId, isLoadingPlan]); // Renamed from weeklyPlan

  const handleDrop = useCallback((day, slot, drill) => {
    setTrainingPlan(prevPlan => { // Renamed from setWeeklyPlan
      const newPlan = { ...prevPlan };
      const currentDrills = newPlan[day][slot].drills;
      // Prevent adding duplicates
      if (!currentDrills.some(d => d.id === drill.id)) {
        newPlan[day][slot].drills = [...currentDrills, drill];
      }
      return newPlan;
    });
  }, []);

  const handleRemoveDrill = useCallback((day, slot, drillId) => {
    setTrainingPlan(prevPlan => { // Renamed from setWeeklyPlan
      const newPlan = { ...prevPlan };
      newPlan[day][slot].drills = newPlan[day][slot].drills.filter(d => d.id !== drillId);
      return newPlan;
    });
  }, []);

  const handleNotesChange = useCallback((day, notes) => {
    setTrainingPlan(prevPlan => ({ // Renamed from setWeeklyPlan
      ...prevPlan,
      [day]: {
        ...prevPlan[day],
        "Small Game": { ...prevPlan[day]["Small Game"], notes }
      }
    }));
  }, []);
  
  const handleSavePlan = async () => {
    if (!selectedTeamId) {
        setConfirmationConfig({ type: 'error', title: 'No Team Selected', message: 'Please select a team before saving the plan.' });
        setShowConfirmation(true);
        return;
    }
    
    setIsSaving(true);
    try {
        const response = await saveTrainingPlan({ weeklyPlan: trainingPlan, teamId: selectedTeamId, weekIdentifier: weekId }); // Pass trainingPlan as weeklyPlan
        if (response.data?.success) {
            // Clear localStorage draft since it's now saved to database
            localStorage.removeItem(localStorageKey);
            setHasSavedData(true);
            setConfirmationConfig({ type: 'success', title: 'Plan Saved!', message: 'The weekly training plan has been successfully saved to Airtable.' });
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
    <div className="h-screen bg-bg-primary text-text-primary flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b border-border-custom bg-bg-secondary/70 backdrop-blur-sm flex items-center justify-between z-10">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Training Planner</h1>
          <div className="flex items-center gap-4 text-text-primary mt-1">
            <div className="flex items-center gap-2 bg-bg-secondary border border-border-custom rounded-lg p-1">
              <Button onClick={() => handleWeekChange(subWeeks(currentDate, 1))} variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:bg-bg-secondary hover:text-accent-primary">
                <ChevronLeft className="w-5 h-5"/>
              </Button>
              <span className="font-bold text-lg text-text-primary tabular-nums tracking-tighter">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </span>
              <Button onClick={() => handleWeekChange(addWeeks(currentDate, 1))} variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:bg-bg-secondary hover:text-accent-primary">
                <ChevronRight className="w-5 h-5"/>
              </Button>
            </div>
            <Select value={selectedTeamId} onValueChange={handleTeamChange}>
              <SelectTrigger className="w-48 bg-bg-secondary border-border-custom hover:border-accent-primary/50">
                <SelectValue placeholder={managedTeams.length > 0 ? "Select Team..." : "No Teams Available"} />
              </SelectTrigger>
              <SelectContent className="bg-bg-secondary border-border-custom text-text-primary">
                {managedTeams.length > 0 ? (
                  managedTeams.map(team => (
                    <SelectItem key={team.id} value={team.id} className="focus:bg-bg-secondary">
                      {team.TeamName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-teams" disabled>No Teams Available</SelectItem>
                )}
              </SelectContent>
            </Select>
            {hasSavedData && (
              <div className="flex items-center gap-2 text-success text-sm bg-success/10 border border-green-500/30 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Plan Saved</span>
              </div>
            )}
          </div>
        </div>
        <Button onClick={handleSavePlan} disabled={isSaving} className="bg-accent-primary text-slate-900 font-bold hover:bg-cyan-400 shadow-lg shadow-accent-primary/20">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
            {isSaving ? 'Saving...' : 'Save Weekly Plan'}
        </Button>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {isLoadingPlan ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-accent-primary" />
              <p className="text-text-secondary">Loading training plan...</p>
            </div>
          </div>
        ) : selectedTeamId && selectedTeamId !== "no-teams" ? (
            <>
                <WeeklyCalendar 
                    plan={trainingPlan} // Renamed from weeklyPlan
                    onDrop={handleDrop}
                    onRemoveDrill={handleRemoveDrill}
                    onNotesChange={handleNotesChange}
                />
                <DrillLibrarySidebar />
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-center p-4">
                <div className="p-8 bg-bg-secondary/50 rounded-2xl shadow-2xl border border-border-custom max-w-sm">
                    <Info className="w-12 h-12 text-accent-primary mx-auto mb-4"/>
                    <h2 className="text-xl font-bold text-text-primary">Select a Team to Begin</h2>
                    <p className="text-text-secondary mt-2">Please select a team from the dropdown above to start planning your training week.</p>
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
