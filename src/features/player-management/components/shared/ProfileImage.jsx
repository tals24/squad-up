import React from 'react';

const ProfileImage = ({ player, className = "w-28 h-28" }) => {
  return (
    <div className="relative inline-block">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-50 animate-pulse"></div>
      <img
        src={player.profileImage || ''}
        alt={player.fullName}
        className={`relative ${className} rounded-full object-cover border-4 border-slate-600 shadow-lg`}
        onError={(e) => {
          const self = e.target;
          self.style.display = 'none';
          const fallback = self.nextSibling;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      <div
        className={`relative ${className} bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center border-4 border-slate-600 shadow-lg`}
        style={{ display: 'none' }}
      >
        <span className="text-slate-100 font-bold text-4xl">
          {player.fullName?.charAt(0) || 'P'}
        </span>
      </div>
    </div>
  );
};

export default ProfileImage;
