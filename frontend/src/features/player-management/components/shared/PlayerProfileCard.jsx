import React from 'react';
import { Card, CardContent, CardTitle } from '@/shared/ui/primitives/card';
import { Badge } from '@/shared/ui/primitives/badge';
import { Users, Calendar, Phone, Hash } from 'lucide-react';
import ProfileImage from './ProfileImage';
import { useData } from '@/app/providers/DataProvider';
import { getPositionBadgeClasses } from '@/shared/utils';

const PlayerProfileCard = ({ player }) => {
  const { teams } = useData();

  const getTeamName = (team) => {
    // MongoDB structure: team is a populated object with _id and teamName
    if (!team) return 'No Team';

    // If team is already populated (has teamName), return it directly
    if (typeof team === 'object' && team.teamName) {
      return team.teamName;
    }

    // If team is just an ObjectId, find the team in the teams array
    const teamObj = teams.find((t) => t._id === team);
    return teamObj?.teamName || 'Unknown Team';
  };
  return (
    <Card className="shadow-2xl border-slate-700 bg-slate-800/70 backdrop-blur-sm">
      <CardContent className="p-6 text-center">
        <div className="mb-4">
          <ProfileImage player={player} />
        </div>

        <CardTitle className="text-2xl font-bold text-slate-100">{player.fullName}</CardTitle>

        <Badge
          variant="outline"
          className={`mt-2 ${getPositionBadgeClasses(player.position)} hover:bg-transparent`}
        >
          {player.position}
        </Badge>

        <div className="mt-6 space-y-4 text-left">
          <div className="flex items-center gap-4 text-sm">
            <Users className="w-5 h-5 text-cyan-400" />
            <span className="text-slate-400">Team:</span>
            <span className="font-medium text-slate-100">{getTeamName(player.team)}</span>
          </div>

          {player.dateOfBirth && (
            <div className="flex items-center gap-4 text-sm">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-400">Born:</span>
              <span className="font-medium text-slate-100">
                {new Date(player.dateOfBirth).toLocaleDateString()}
              </span>
            </div>
          )}

          {player.phoneNumber && (
            <div className="flex items-center gap-4 text-sm">
              <Phone className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-400">Phone:</span>
              <span className="font-medium text-slate-100">{player.phoneNumber}</span>
            </div>
          )}

          {player.nationalID && (
            <div className="flex items-center gap-4 text-sm">
              <Hash className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-400">ID:</span>
              <span className="font-medium text-slate-100 font-mono text-xs">
                {player.nationalID}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerProfileCard;
