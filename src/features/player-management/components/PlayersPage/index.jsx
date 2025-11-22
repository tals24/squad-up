
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trophy,
  Target,
  TrendingUp,
  Calendar
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Button,
  Badge,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Container,
  Section,
  Heading,
  Text,
  FormField,
  Grid
} from "@/shared/ui/primitives/design-system-components";
import { PageLayout } from "@/shared/ui/primitives/design-system-components";
import PageLoader from "@/components/PageLoader";
import { 
  AnimatedButton, 
  AnimatedCard, 
  AnimatedInput,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  LoadingSpinner
} from "@/shared/ui/primitives/animated-components";
import { theme } from "@/shared/lib/theme";
import { createAriaProps, createFormFieldProps } from "@/shared/lib/accessibility";
import { useData } from "@/app/providers/DataProvider";
import { getPlayersForTeam } from "@/api/functions"; // Changed from airtableSync
import PlayersHeader from "../shared-players/PlayersHeader";
import PlayerFilters from "../shared-players/PlayerFilters";
import PlayerGrid from "../shared-players/PlayerGrid";
import { usePlayersData } from "@/shared/hooks";

const PLAYERS_PER_PAGE = 12;

export default function Players() {
  const { users, teams, players: contextPlayers, isLoading: isContextLoading, error: contextError } = useData();
  
  // 🔍 DEBUG: Let's see what data we actually have
  console.log('🔍 Players Component Debug:');
  console.log('  - isContextLoading:', isContextLoading);
  console.log('  - contextPlayers length:', contextPlayers ? contextPlayers.length : 'null');
  console.log('  - users length:', users ? users.length : 'null');
  console.log('  - teams length:', teams ? teams.length : 'null');
  console.log('  - contextPlayers sample:', contextPlayers ? contextPlayers.slice(0, 2) : 'null');
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state for player fetch

  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");

  // pagination handled by usePlayersData hook

  useEffect(() => {
    User.me().then(setCurrentUser).catch(console.error);
  }, []);

  const { filteredTeamsForDropdown, defaultTeamId } = useMemo(() => {
    if (!currentUser || !users.length || !teams.length) {
      return { filteredTeamsForDropdown: [], defaultTeamId: null };
    }

    if (currentUser.role === 'admin') {
      // Admins can see all teams, and their default selection can be "all" if teams exist, or the first team
      return { filteredTeamsForDropdown: teams, defaultTeamId: teams.length > 0 ? "all" : null };
    }

    const airtableUser = users.find(u => u.Email && u.Email.toLowerCase() === currentUser.email.toLowerCase());
    if (!airtableUser) {
      // If the current authenticated user has no corresponding Airtable user, they have no access.
      return { filteredTeamsForDropdown: [], defaultTeamId: null };
    }

    const airtableRole = airtableUser.Role;
    let fTeams = [];

    if (airtableRole === 'Coach' && airtableUser.id) {
      fTeams = teams.filter(team => team.Coach && team.Coach.includes(airtableUser.id));
    } else if (airtableRole === 'Division Manager' && airtableUser.Department) {
      fTeams = teams.filter(team => team.Division === airtableUser.Department);
    }
    
    // Default to the first team if any are found for the coach/DM, otherwise null
    return { filteredTeamsForDropdown: fTeams, defaultTeamId: fTeams[0]?.id || null };
  }, [currentUser, users, teams]);
  
  // Effect to set the default team selection based on user role and available teams
  useEffect(() => {
    // Only set default if a defaultTeamId is determined and no team is currently selected
    // and if the user is not an admin (admins might prefer to see "all" first)
    if (defaultTeamId && selectedTeam === 'all' && currentUser?.role !== 'admin') {
      setSelectedTeam(defaultTeamId);
    }
    // For admins, if they have no default selected, and there are teams, set to "all"
    if (currentUser?.role === 'admin' && selectedTeam === 'all' && teams.length > 0) {
      setSelectedTeam("all");
    }
  }, [defaultTeamId, currentUser, selectedTeam, teams]);


  // server-side pagination fetch function removed in favor of context + client filtering


  // 🔄 SIMPLIFIED: Use players directly from DataContext
  useEffect(() => {
    if (!isContextLoading && contextPlayers) {
      console.log('🔄 Using players from DataContext:', contextPlayers.length);
      setPlayers(contextPlayers);
      setIsLoading(false);
    }
  }, [isContextLoading, contextPlayers]);

  // Original complex fetch logic (commented out for debugging)
  /*
  useEffect(() => {
    // Wait until initial user/team data from DataContext is loaded
    if (!isContextLoading) {
      fetchPlayers(currentPage);
    }
  }, [currentPage, fetchPlayers, isContextLoading]);
  */

  // Pagination reset handled by usePlayersData hook


  // Pagination helpers provided by usePlayersData hook

  const getPlayerAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getTeamName = (team) => {
    // MongoDB structure: team is a populated object with _id and teamName
    if (!team) return "No Team";
    
    // If team is already populated (has teamName), return it directly
    if (typeof team === 'object' && team.teamName) {
      return team.teamName;
    }
    
    // If team is just an ObjectId, find the team in the teams array
    const teamObj = teams.find(t => t._id === team);
    return teamObj?.teamName || "Unknown Team";
  };

  const { pagePlayers, hasNext, hasPrev, nextPage, prevPage, currentPage } = usePlayersData({
    players,
    teams,
    currentUser,
    searchTerm,
    selectedPosition,
    selectedTeam,
    pageSize: PLAYERS_PER_PAGE,
  });

  if (isContextLoading || !currentUser) {
    return <PageLoader message="Loading players..." />;
  }

  return (
    <PageTransition>
      <PageLayout>
        {/* Header */}
        <PlayersHeader />

        {/* Filters */}
        <PlayerFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          teams={teams}
          currentUser={currentUser}
        />

        {/* Players Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <StaggerContainer key="loading">
                <Grid cols={4} gap="md">
                  {Array.from({ length: PLAYERS_PER_PAGE }).map((_, i) => (
                    <StaggerItem key={i}>
                      <div className="h-64 bg-neutral-200 rounded-xl animate-pulse" />
                    </StaggerItem>
                  ))}
                </Grid>
              </StaggerContainer>
            ) : (
              <PlayerGrid players={pagePlayers} teams={teams} />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pagination Controls */}
        <motion.div 
          className="flex items-center justify-center gap-4 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
        >
          <AnimatedButton
            variant="outline"
            size="md"
            onClick={prevPage}
            disabled={!hasPrev || isLoading}
            loading={isLoading}
            {...createAriaProps({
              label: 'Go to previous page',
              disabled: !hasPrev || isLoading
            })}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </AnimatedButton>
          
          <Text variant="body" className="font-medium px-4">
            Page {currentPage}
          </Text>
          
          <AnimatedButton
            variant="outline"
            size="md"
            onClick={nextPage}
            disabled={!hasNext || isLoading}
            loading={isLoading}
            {...createAriaProps({
              label: 'Go to next page',
              disabled: !hasNext || isLoading
            })}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </AnimatedButton>
        </motion.div>
      </PageLayout>
    </PageTransition>
  );
}
