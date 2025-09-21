
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
} from "@/components/ui/design-system-components";
import { PageLayout, PageHeader, SearchFilter, LoadingState, StandardButton } from "@/components/ui/design-system-components";
import { 
  AnimatedButton, 
  AnimatedCard, 
  AnimatedInput,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  LoadingSpinner
} from "@/components/ui/animated-components";
import { theme } from "@/lib/theme";
import { createAriaProps, createFormFieldProps } from "@/lib/accessibility";
import { useData } from "../components/DataContext";
import { getPlayersForTeam } from "@/api/functions"; // Changed from airtableSync

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

  const [currentPage, setCurrentPage] = useState(1);
  const offsets = useRef({}); // Use useRef instead of useState for offsets
  const [hasNextPage, setHasNextPage] = useState(false);

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


  const fetchPlayers = useCallback(async (page) => { // Removed 'formula' parameter
    // If a non-admin user has "all" teams selected (which means no specific team is chosen)
    // or if they have no teams assigned, prevent fetching all players.
    if (selectedTeam === 'all' && currentUser?.role !== 'admin' && filteredTeamsForDropdown.length === 0) {
      setPlayers([]);
      setIsLoading(false);
      return;
    }
      
    setIsLoading(true);
    // Determine the offset for the current page
    const offset = page > 1 ? offsets.current[page] : undefined;

    try {
      // Call the new server-side function
      const { data, error } = await getPlayersForTeam({
        teamId: selectedTeam,
        searchTerm,
        position: selectedPosition,
        pageSize: PLAYERS_PER_PAGE,
        offset,
      });

      if (error) {
        console.error("Server-side error fetching players:", error);
        throw new Error(error.details || 'Failed to fetch players');
      }
      
      if (data?.records) {
        setPlayers(data.records);
        if (data.offset) {
          // Store the offset for the *next* page
          offsets.current[page + 1] = data.offset;
          setHasNextPage(true);
        } else {
          setHasNextPage(false);
        }
      } else {
        setPlayers([]);
        setHasNextPage(false);
      }
    } catch (err) {
      console.error("Failed to fetch players:", err);
      setPlayers([]);
      setHasNextPage(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeam, searchTerm, selectedPosition, currentUser, filteredTeamsForDropdown]); // Added dependencies for selected filters and currentUser/filteredTeamsForDropdown


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

  // Effect to reset pagination when filters change (except for current page)
  useEffect(() => {
    setCurrentPage(1);
    offsets.current = {}; // Reset the ref object
  }, [searchTerm, selectedPosition, selectedTeam]); // Dependencies are filters and role formula


  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(p => p + 1);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(1, p - 1)); // Ensure page doesn't go below 1
  };

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

  if (isContextLoading || !currentUser) {
    return <LoadingState message="Loading players..." />;
  }

  return (
    <PageTransition>
      <PageLayout>
        {/* Header */}
        <PageHeader
          title="My"
          accentWord="Players"
          subtitle="Manage and track player development"
          actionButton={
            <Link to={createPageUrl("AddPlayer")}>
              <StandardButton 
                variant="primary"
                icon={<Plus className="w-5 h-5" />}
              >
                Add Player
              </StandardButton>
            </Link>
          }
        />

        {/* Filters */}
        <SearchFilter
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search players..."
          filters={[
            {
              value: selectedPosition,
              onChange: setSelectedPosition,
              placeholder: "All Positions",
              options: [
                { value: "all", label: "All Positions" },
                { value: "Goalkeeper", label: "Goalkeeper" },
                { value: "Defender", label: "Defender" },
                { value: "Midfielder", label: "Midfielder" },
                { value: "Forward", label: "Forward" }
              ]
            },
            {
              value: selectedTeam,
              onChange: setSelectedTeam,
              placeholder: "Select Team",
              options: [
                ...(currentUser?.role === 'admin' ? [{ value: "all", label: "All Teams" }] : []),
                ...filteredTeamsForDropdown.map(team => ({
                  value: team.id,
                  label: team.TeamName || team.Name
                })),
                ...(currentUser?.role !== 'admin' && filteredTeamsForDropdown.length === 0 ? 
                  [{ value: "no-teams", label: "No teams assigned", disabled: true }] : [])
              ]
            }
          ]}
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
              <StaggerContainer key="content">
                <Grid cols={4} gap="md">
                  {players.length > 0 ? (
            players.map((player) => (
                      <StaggerItem key={player._id}>
                        <Link to={createPageUrl(`Player?id=${player._id}`)}>
                          <AnimatedCard 
                            interactive={true}
                            className="h-full hover:shadow-lg transition-all duration-200"
                            tabIndex={0}
                            {...createAriaProps({
                              label: `View ${player.fullName} profile`,
                              role: 'link'
                            })}
                          >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {player.profileImage ? (
                          <img
                            src={player.profileImage}
                            alt={player.fullName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-lg"
                            onError={(e) => {
                              const self = e.target;
                              const nextSibling = self.nextSibling;
                              // Hide image on error
                              self.style.display = 'none';
                              // Show fallback div
                              if (nextSibling) {
                                nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-lg"
                          style={{ display: player.profileImage ? 'none' : 'flex' }}
                        >
                          <span className="text-white font-bold text-xl">
                            {player.fullName?.charAt(0) || 'P'}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card rounded-full flex items-center justify-center shadow-lg border border-border">
                          <Trophy className="w-3 h-3 text-blue-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-foreground truncate">
                          {player.fullName}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="bg-secondary text-secondary-foreground"
                          >
                            {player.position}
                          </Badge>
                          {player.kitNumber && (
                            <Badge variant="outline" className="font-mono border-blue-500 text-primary">#{player.kitNumber}</Badge>
                          )}
                          {player.dateOfBirth && (
                            <span className="text-sm text-muted-foreground font-medium">
                              Age {getPlayerAge(player.dateOfBirth)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{getTeamName(player.team)}</span>
                    </div>
                    {player.dateOfBirth && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(player.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <Target className="w-4 h-4" />
                        <span>View Profile</span>
                      </div>
                      <TrendingUp className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors duration-200" />
                    </div>
                  </CardContent>
                          </AnimatedCard>
              </Link>
                      </StaggerItem>
            ))
          ) : (
                    <StaggerItem key="no-results">
            <div className="col-span-full">
              <Card className="shadow-2xl border-border bg-card">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <Heading level={3} className="mb-2">No Players Found</Heading>
                            <Text className="text-neutral-600 mb-6">
                    {searchTerm || selectedPosition !== "all" || selectedTeam !== "all"
                      ? "Try adjusting your filters to see more players."
                                : "No players match your current access permissions or selected team."
                    }
                            </Text>
                </CardContent>
              </Card>
            </div>
                    </StaggerItem>
                  )}
                </Grid>
              </StaggerContainer>
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
            onClick={handlePrevPage}
            disabled={currentPage === 1 || isLoading}
            loading={isLoading}
            {...createAriaProps({
              label: 'Go to previous page',
              disabled: currentPage === 1 || isLoading
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
            onClick={handleNextPage}
            disabled={!hasNextPage || isLoading}
            loading={isLoading}
            {...createAriaProps({
              label: 'Go to next page',
              disabled: !hasNextPage || isLoading
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
