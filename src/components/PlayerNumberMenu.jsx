import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerNumberMenu({ position, onSelectNumber, onClose }) {
  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed z-50 bg-card/98 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-border"
        style={{
          left: Math.min(position.x - 60, window.innerWidth - 140),
          top: Math.max(position.y - 100, 10),
        }}
        // עצירת כל האירועים כדי שהתפריט יישאר יציב
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDrag={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-5 gap-2">
          {numbers.map(number => (
            <button
              key={number}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNumber(number.toString());
              }}
              className="w-8 h-8 bg-brand-blue hover:bg-brand-blue-600 text-brand-blue-foreground font-bold rounded-full text-sm flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
            >
              {number}
            </button>
          ))}
        </div>
        
        {/* כפתור סגירה */}
        <div className="flex justify-center mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-3 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs rounded-md transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}