import React from 'react';
import { OutfitLayer } from '../../../types';
import { Trash2Icon } from '../../../components/icons';
import { AnimatePresence, motion } from 'framer-motion';

interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  onRemoveLastGarment: () => void;
}

export const OutfitStack: React.FC<OutfitStackProps> = ({ outfitHistory, onRemoveLastGarment }) => {
  return (
    <div>
      <h2 className="text-xl font-serif tracking-wider text-gray-800 border-b border-gray-400/50 pb-2 mb-4">Outfit Stack</h2>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {outfitHistory.map((layer, index) => (
            <motion.div
              key={layer.garment?.id || 'base'}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-sm"
            >
              <div className="flex items-center overflow-hidden gap-4">
                  {layer.garment ? (
                      <img src={layer.garment.url} alt={layer.garment.name} className="flex-shrink-0 w-14 h-14 object-cover rounded-lg" />
                  ) : (
                      <div className="flex-shrink-0 w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                  )}
                  <span className="font-semibold text-gray-800 truncate" title={layer.garment?.name}>
                    {layer.garment ? layer.garment.name : 'Base Model'}
                  </span>
              </div>
              {index > 0 && index === outfitHistory.length - 1 && (
                 <button
                  onClick={onRemoveLastGarment}
                  className="flex-shrink-0 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                  aria-label={`Remove ${layer.garment?.name}`}
                >
                  <Trash2Icon className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {outfitHistory.length <= 1 && (
            <p className="text-center text-sm text-gray-500 pt-4">Your stacked items will appear here. Start by adding a garment from your wardrobe.</p>
        )}
      </div>
    </div>
  );
};