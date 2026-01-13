import React from 'react';
import { SearchFilter } from '@/shared/ui/primitives/design-system-components';

export default function PlayerFilters({
  searchTerm,
  setSearchTerm,
  selectedPosition,
  setSelectedPosition,
  selectedTeam,
  setSelectedTeam,
  teams,
  currentUser,
}) {
  const teamOptions = [
    ...(currentUser?.role === 'admin' ? [{ value: 'all', label: 'All Teams' }] : []),
    ...teams.map((team) => ({
      value: team._id,
      label: team.teamName,
    })),
  ];

  return (
    <SearchFilter
      searchValue={searchTerm}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search players..."
      filters={[
        {
          value: selectedPosition,
          onChange: setSelectedPosition,
          placeholder: 'All Positions',
          options: [
            { value: 'all', label: 'All Positions' },
            { value: 'Goalkeeper', label: 'Goalkeeper' },
            { value: 'Defender', label: 'Defender' },
            { value: 'Midfielder', label: 'Midfielder' },
            { value: 'Forward', label: 'Forward' },
          ],
        },
        {
          value: selectedTeam,
          onChange: setSelectedTeam,
          placeholder: 'Select Team',
          options: teamOptions,
        },
      ]}
    />
  );
}
