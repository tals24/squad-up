/**
 * SquadUp Players Page - Phase 4 Optimized
 * 
 * Demonstrates virtual scrolling, shared element transitions,
 * progressive loading, and advanced animations.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/api/entities";
import { Link, useNavigate } from "react-router-dom";
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
  Calendar,
  Filter,
  Grid3X3,
  List
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
  FormField
} from "@/components/ui/design-system-components";
import {
  SharedElement,
  AdvancedCard,
  ChoreographedList,
  ScrollReveal,
  AnimatedSVGIcon,
  AdvancedSpinner,
} from "@/components/ui/advanced-animated-components";
import {
  VirtualList,
  VirtualGrid,
  InfiniteVirtualList,
} from "@/components/ui/virtual-scrolling";
import {
  LazyLoad,
  ProgressiveImage,
  createLazyComponent,
} from "@/lib/progressive-loading";
import { useData } from "../components/DataContext";
import { getPlayersForTeam } from "@/api/functions";
import { createAriaProps } from "@/lib/accessibility";

const PLAYERS_PER_PAGE = 50; // Increased for virtual scrolling
const GRID_ITEM_HEIGHT = 280;
const LIST_ITEM_HEIGHT = 80;

// ===========================================
// LAZY LOADED COMPONENTS
// ===========================================

const LazyPlayerModal = createLazyComponent(
  () => import('../components/PlayerModal'),
  { delay: 100 }
);

const LazyPlayerStatsChart = createLazyComponent(
  () => import('../components/PlayerStatsChart'),
  { delay: 200 }
);

// ===========================================
// PLAYER CARD COMPONENTS
// ===========================================

const PlayerGridCard = React.memo(({ player, onSelect, layoutId }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(createPageUrl(`Player?id=${player.id}`));
  };

  return (
    <SharedElement
      layoutId={layoutId}
      type="card"
      onClick={handleClick}
      className="cursor-pointer"
    >
      <AdvancedCard
        interactive
        className="h-full hover:shadow-xl transition-all duration-300"
        animationDelay={Math.random() * 0.2}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative">
              <LazyLoad
                fallback={
                  <div className="w-16 h-16 bg-neutral-200 rounded-full animate-pulse" />
                }
              >
                <ProgressiveImage
                  src={player["Profile Image"]?.[0]?.url}
                  alt={player.FullName}
                  placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjMyIiBjeT0iMjQiIHI9IjgiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEyIDUyQzEyIDQyLjA1ODkgMjAuMDU4OSAzNCAzMCAzNEgzNEM0My45NDExIDM0IDUyIDQyLjA1ODkgNTIgNTJWNTZIMTJWNTJaIiBmaWxsPSIjRDFENURCIi8+Cjwvc3ZnPgo="
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary-500 shadow-lg"
                />
              </LazyLoad>
              
              <motion.div
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border border-neutral-200"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatedSVGIcon
                  animationType="scale"
                  duration={0.5}
                  trigger="hover"
                  size="sm"
                >
                  <Trophy className="w-3 h-3 text-primary-500" />
                </AnimatedSVGIcon>
              </motion.div>
            </div>
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold text-neutral-900 truncate">
                {player.FullName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="bg-secondary-100 text-secondary-700">
                  {player.Position}
                </Badge>
                {player.KitNumber && (
                  <Badge variant="outline" className="font-mono border-primary-500 text-primary-600">
                    #{player.KitNumber}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Users className="w-4 h-4" />
            <span className="font-medium truncate">Team Name</span>
          </div>
          
          {player.DateOfBirth && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date(player.DateOfBirth).toLocaleDateString()}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
            <div className="flex items-center gap-1 text-sm text-primary-600">
              <Target className="w-4 h-4" />
              <span>View Profile</span>
            </div>
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <TrendingUp className="w-4 h-4 text-neutral-500" />
            </motion.div>
          </div>
        </CardContent>
      </AdvancedCard>
    </SharedElement>
  );
});

PlayerGridCard.displayName = 'PlayerGridCard';

const PlayerListItem = React.memo(({ player, style, onSelect }) => {
  return (
    <motion.div
      style={style}
      className="flex items-center p-4 border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect(player)}
      whileHover={{ backgroundColor: '#f8fafc' }}
    >
      <div className="flex items-center gap-4 flex-1">
        <LazyLoad
          fallback={
            <div className="w-12 h-12 bg-neutral-200 rounded-full animate-pulse" />
          }
        >
          <ProgressiveImage
            src={player["Profile Image"]?.[0]?.url}
            alt={player.FullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-primary-500"
          />
        </LazyLoad>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">
            {player.FullName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" size="sm">
              {player.Position}
            </Badge>
            {player.KitNumber && (
              <Badge variant="outline" size="sm" className="font-mono">
                #{player.KitNumber}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-4 text-sm text-neutral-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {player.DateOfBirth && (
              <span>{new Date(player.DateOfBirth).toLocaleDateString()}</span>
            )}
          </div>
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

PlayerListItem.displayName = 'PlayerListItem';

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function PlayersOptimized() {
  const { users, teams, isLoading: isContextLoading, error: contextError } = useData();
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  
  // Virtual scrolling state
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const virtualListRef = useRef(null);

  // Load initial data
  useEffect(() => {
    if (!isContextLoading) {
      loadInitialPlayers();
    }
  }, [isContextLoading, selectedTeam, selectedPosition, searchTerm]);

  const loadInitialPlayers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getPlayersForTeam({
        teamId: selectedTeam,
        searchTerm,
        position: selectedPosition,
        pageSize: PLAYERS_PER_PAGE,
      });

      if (error) {
        console.error("Error fetching players:", error);
        setPlayers([]);
        setHasNextPage(false);
      } else if (data?.records) {
        setPlayers(data.records);
        setHasNextPage(data.records.length === PLAYERS_PER_PAGE);
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
  };

  const loadMorePlayers = useCallback(async () => {
    if (isLoadingMore || !hasNextPage) return;

    setIsLoadingMore(true);
    try {
      const { data, error } = await getPlayersForTeam({
        teamId: selectedTeam,
        searchTerm,
        position: selectedPosition,
        pageSize: PLAYERS_PER_PAGE,
        offset: players.length,
      });

      if (error) {
        console.error("Error loading more players:", error);
        setHasNextPage(false);
      } else if (data?.records) {
        setPlayers(prev => [...prev, ...data.records]);
        setHasNextPage(data.records.length === PLAYERS_PER_PAGE);
      } else {
        setHasNextPage(false);
      }
    } catch (err) {
      console.error("Failed to load more players:", err);
      setHasNextPage(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [players.length, selectedTeam, searchTerm, selectedPosition, isLoadingMore, hasNextPage]);

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  // Virtual list renderers
  const renderGridItem = useCallback(({ item, index, style }) => {
    return (
      <div style={style} className="p-2">
        <PlayerGridCard
          player={item.data}
          onSelect={handlePlayerSelect}
          layoutId={`player-card-${item.data.id}`}
        />
      </div>
    );
  }, []);

  const renderListItem = useCallback(({ item, index, style }) => {
    return (
      <PlayerListItem
        player={item.data}
        style={style}
        onSelect={handlePlayerSelect}
      />
    );
  }, []);

  // Prepare data for virtual scrolling
  const virtualItems = useMemo(() => 
    players.map((player, index) => ({
      id: player.id || index,
      data: player,
    })),
    [players]
  );

  if (isContextLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6"
      >
        <Container size="xl">
          <div className="text-center py-20">
            <AdvancedSpinner variant="dots" size="lg" className="mb-4" />
            <Text className="text-neutral-600">Loading players...</Text>
          </div>
        </Container>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6"
    >
      <Container size="xl" className="space-y-8">
        
        {/* Header */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Heading level={1} className="mb-2">
                My Players
              </Heading>
              <Text variant="large" className="text-neutral-600">
                Manage and track player development
              </Text>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {players.length} {players.length === 1 ? 'Player' : 'Players'}
                </Badge>
                <Badge variant="outline">
                  {viewMode === 'grid' ? 'Grid View' : 'List View'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center border border-neutral-300 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              
              <Link to={createPageUrl("AddPlayer")}>
                <Button variant="primary" size="md">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Player
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={0.1}>
          <AdvancedCard className="overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Search Players">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-4 h-4" />
                    <Input
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </FormField>
                
                <FormField label="Position">
                  <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Positions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                      <SelectItem value="Defender">Defender</SelectItem>
                      <SelectItem value="Midfielder">Midfielder</SelectItem>
                      <SelectItem value="Forward">Forward</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Team">
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.TeamName || team.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </AdvancedCard>
        </ScrollReveal>

        {/* Virtual Scrolling Content */}
        <ScrollReveal delay={0.2}>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <AdvancedSpinner variant="pulse" size="xl" className="mb-4" />
                <Text>Loading players...</Text>
              </div>
            ) : players.length === 0 ? (
              <AdvancedCard className="text-center py-16">
                <CardContent>
                  <Users className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <Heading level={3} className="mb-2">No Players Found</Heading>
                  <Text className="text-neutral-600 mb-6">
                    {searchTerm || selectedPosition !== "all" || selectedTeam !== "all"
                      ? "Try adjusting your filters to see more players."
                      : "No players match your current access permissions."
                    }
                  </Text>
                </CardContent>
              </AdvancedCard>
            ) : (
              <div className="h-[600px] border border-neutral-200 rounded-xl overflow-hidden bg-white">
                {viewMode === 'grid' ? (
                  <InfiniteVirtualList
                    items={virtualItems}
                    itemHeight={GRID_ITEM_HEIGHT}
                    renderItem={renderGridItem}
                    hasNextPage={hasNextPage}
                    isLoadingMore={isLoadingMore}
                    loadMore={loadMorePlayers}
                    enableAnimation
                    className="p-4"
                  />
                ) : (
                  <InfiniteVirtualList
                    items={virtualItems}
                    itemHeight={LIST_ITEM_HEIGHT}
                    renderItem={renderListItem}
                    hasNextPage={hasNextPage}
                    isLoadingMore={isLoadingMore}
                    loadMore={loadMorePlayers}
                    enableAnimation
                  />
                )}
              </div>
            )}
          </div>
        </ScrollReveal>
      </Container>

      {/* Lazy Loaded Player Modal */}
      <AnimatePresence>
        {showPlayerModal && selectedPlayer && (
          <React.Suspense fallback={<div>Loading...</div>}>
            <LazyPlayerModal
              player={selectedPlayer}
              isOpen={showPlayerModal}
              onClose={() => {
                setShowPlayerModal(false);
                setSelectedPlayer(null);
              }}
            />
          </React.Suspense>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
