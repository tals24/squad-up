import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, Calendar, Target, TrendingUp } from 'lucide-react';
import {
  AnimatedCard,
  StaggerContainer,
  StaggerItem,
} from '@/shared/ui/primitives/animated-components';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Grid,
  Heading,
  Text,
} from '@/shared/ui/primitives/design-system-components';
import { createPageUrl } from '@/shared/utils';

function getPlayerAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function PlayerGrid({ players, teams }) {
  const getTeamName = (team) => {
    if (!team) return 'No Team';
    if (typeof team === 'object' && team.teamName) return team.teamName;
    const teamObj = teams.find((t) => t._id === team);
    return teamObj?.teamName || 'Unknown Team';
  };

  if (!players || players.length === 0) {
    return (
      <StaggerContainer>
        <div className="col-span-full">
          <Card className="shadow-2xl border-slate-700 bg-slate-800/70">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <Heading level={3} className="mb-2 text-slate-100">
                No Players Found
              </Heading>
              <Text className="text-slate-400 mb-6">
                Try adjusting your filters to see more players.
              </Text>
            </CardContent>
          </Card>
        </div>
      </StaggerContainer>
    );
  }

  return (
    <StaggerContainer>
      <Grid cols={4} gap="md">
        {players.map((player) => (
          <StaggerItem key={player._id}>
            <Link to={createPageUrl(`Player?id=${player._id}`)}>
              <AnimatedCard
                interactive
                className="h-full bg-slate-800/70 border-slate-700 hover:bg-slate-800/90 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {player.profileImage ? (
                        <img
                          src={player.profileImage}
                          alt={player.fullName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500 shadow-lg"
                          onError={(e) => {
                            const self = e.target;
                            const nextSibling = self.nextSibling;
                            self.style.display = 'none';
                            if (nextSibling) nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-cyan-500 shadow-lg"
                        style={{ display: player.profileImage ? 'none' : 'flex' }}
                      >
                        <span className="text-white font-bold text-xl">
                          {player.fullName?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-800">
                        <Trophy className="w-3 h-3 text-cyan-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-slate-100 truncate group-hover:text-cyan-400 transition-colors">
                        {player.fullName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          {player.position}
                        </span>
                        {player.kitNumber && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-mono bg-slate-700 text-slate-300 border border-slate-600">
                            #{player.kitNumber}
                          </span>
                        )}
                        {player.dateOfBirth && (
                          <span className="text-sm text-slate-400 font-medium">
                            Age {getPlayerAge(player.dateOfBirth)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="font-medium text-slate-300">{getTeamName(player.team)}</span>
                  </div>
                  {player.dateOfBirth && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-300">
                        {new Date(player.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-700 group-hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-1 text-sm text-cyan-400 font-medium">
                      <Target className="w-4 h-4" />
                      <span>View Profile</span>
                    </div>
                    <TrendingUp className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors duration-200" />
                  </div>
                </CardContent>
              </AnimatedCard>
            </Link>
          </StaggerItem>
        ))}
      </Grid>
    </StaggerContainer>
  );
}
