import React from 'react';
import Spinner from '../../../components/Spinner';
import { AnimatePresence, motion } from 'framer-motion';
import { PoseSelector } from './PoseSelector';

interface CanvasProps {
  displayImageUrl: string | null;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  availablePoseKeys: string[];
}

export const Canvas: React.FC<CanvasProps> = ({ displayImageUrl, isLoading, loadingMessage, onSelectPose, poseInstructions, currentPoseIndex, availablePoseKeys }) => {
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative group">
      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <img
            key={displayImageUrl}
            src={displayImageUrl}
            alt="Virtual try-on model"
            className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg"
          />
        ) : (
            <div className="w-[400px] h-[600px] bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-md font-serif text-gray-600 mt-4">Loading Model...</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
              >
                  <Spinner />
                  {loadingMessage && (
                      <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>

      {displayImageUrl && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xl opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
          <PoseSelector 
            poses={poseInstructions}
            currentPoseIndex={currentPoseIndex}
            onSelectPose={onSelectPose}
            availablePoseKeys={availablePoseKeys}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};