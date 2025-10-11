import React from 'react';
import Spinner from '../../../components/Spinner';
import { AnimatePresence, motion } from 'framer-motion';
import { PoseSelector } from './PoseSelector';
import { DownloadIcon } from '../../../components/icons';

interface CanvasProps {
  displayImageUrl: string | null;
  productName: string;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  availablePoseKeys: string[];
}

export const Canvas: React.FC<CanvasProps> = ({ displayImageUrl, productName, isLoading, loadingMessage, onSelectPose, poseInstructions, currentPoseIndex, availablePoseKeys }) => {
  
  const handleDownload = () => {
    if (!displayImageUrl) return;
    const link = document.createElement('a');
    link.href = displayImageUrl;
    const fileName = `${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tryon.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative group">
      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <>
            <img
              key={displayImageUrl}
              src={displayImageUrl}
              alt="Virtual try-on model"
              className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg"
            />
             <button 
                onClick={handleDownload}
                className="absolute top-3 right-3 bg-white/60 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-white hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Download Image"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
          </>
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