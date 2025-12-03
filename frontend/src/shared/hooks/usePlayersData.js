import { useEffect, useMemo, useState } from 'react';

// Client-side Players data hook: filtering, sorting, pagination
export function usePlayersData({
  players,
  teams,
  currentUser,
  searchTerm,
  selectedPosition,
  selectedTeam,
  pageSize = 12,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPosition, selectedTeam]);

  const filteredPlayers = useMemo(() => {
    let list = players || [];

    // Team filter (supports populated object or id)
    if (selectedTeam && selectedTeam !== 'all') {
      list = list.filter(p => {
        if (!p.team) return false;
        if (typeof p.team === 'object') return p.team._id === selectedTeam;
        return p.team === selectedTeam;
      });
    }

    // Position filter
    if (selectedPosition && selectedPosition !== 'all') {
      list = list.filter(p => p.position === selectedPosition);
    }

    // Search by name
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => (p.fullName || '').toLowerCase().includes(q));
    }

    return list;
  }, [players, selectedTeam, selectedPosition, searchTerm]);

  const total = filteredPlayers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(currentPage, totalPages);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagePlayers = filteredPlayers.slice(start, end);

  return {
    pagePlayers,
    total,
    totalPages,
    currentPage: page,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    nextPage: () => setCurrentPage(p => Math.min(totalPages, p + 1)),
    prevPage: () => setCurrentPage(p => Math.max(1, p - 1)),
  };
}



