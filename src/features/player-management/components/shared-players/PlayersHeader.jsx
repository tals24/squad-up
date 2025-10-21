import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader, StandardButton } from '@/shared/ui/primitives/design-system-components';
import { createPageUrl } from '@/utils';

export default function PlayersHeader() {
  return (
    <PageHeader
      title="My"
      accentWord="Players"
      subtitle="Manage and track player development"
      actionButton={
        <Link to={createPageUrl('AddPlayer')}>
          <StandardButton variant="primary" icon={<Plus className="w-5 h-5" />}>Add Player</StandardButton>
        </Link>
      }
    />
  );
}



