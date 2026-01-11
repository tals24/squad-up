export const getCategoryColor = (category) => {
  const colorMap = {
    Physical: 'bg-purple-600/20 text-purple-300 border-purple-500/30',
    Goalkeeper: 'bg-red-600/20 text-red-300 border-red-500/30',
    Technical: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    Tactical: 'bg-green-600/20 text-green-300 border-green-500/30',
    'Warm-up': 'bg-orange-600/20 text-orange-300 border-orange-500/30',
    Conditioning: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30',
    'Small Game': 'bg-pink-600/20 text-pink-300 border-pink-500/30',
    Defending: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
    Attacking: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
    Passing: 'bg-teal-600/20 text-teal-300 border-teal-500/30',
    Shooting: 'bg-rose-600/20 text-rose-300 border-rose-500/30',
    Dribbling: 'bg-violet-600/20 text-violet-300 border-violet-500/30',
    Defense: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
    Goalkeeping: 'bg-red-600/20 text-red-300 border-red-500/30',
  };
  return colorMap[category] || 'bg-slate-600/20 text-slate-300 border-slate-500/30';
};

export const getAgeColor = () => {
  return 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30';
};
