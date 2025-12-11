import React from 'react';

/**
 * Player ratings form component
 * Displays 4 rating dimensions (Physical, Technical, Tactical, Mental)
 * Each rated 1-5 stars
 */
export function PlayerRatingsForm({ data, onDataChange, isReadOnly }) {
  const renderRatingInput = (label, fieldName, value) => (
    <div>
      <label className="text-sm font-semibold text-slate-400 mb-2 block">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !isReadOnly && onDataChange({ ...data, [fieldName]: star })}
            disabled={isReadOnly}
            className={`
              text-2xl transition-all
              ${(value || 3) >= star ? "text-yellow-400" : "text-slate-600"}
              ${!isReadOnly ? "hover:text-yellow-400 hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
            `}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-slate-400">
          {value || 3}/5
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {renderRatingInput("Physical Rating", "rating_physical", data.rating_physical)}
      {renderRatingInput("Technical Rating", "rating_technical", data.rating_technical)}
      {renderRatingInput("Tactical Rating", "rating_tactical", data.rating_tactical)}
      {renderRatingInput("Mental Rating", "rating_mental", data.rating_mental)}
      
      {/* Average Rating */}
      <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-400">Average Rating:</span>
          <span className="text-xl font-bold text-cyan-400">
            {(
              ((data.rating_physical || 3) +
                (data.rating_technical || 3) +
                (data.rating_tactical || 3) +
                (data.rating_mental || 3)) /
              4
            ).toFixed(1)}
            /5
          </span>
        </div>
      </div>
    </div>
  );
}

