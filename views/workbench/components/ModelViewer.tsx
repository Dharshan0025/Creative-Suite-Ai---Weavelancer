import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { generateImageViewFromAngle } from '../../../services/geminiService';
import { VIEWER_ANGLES } from '../../../constants';

interface ModelViewerProps {
    baseImageUrl: string;
    prompt: string;
}

const AngleButton: React.FC<{
    angle: string;
    isActive: boolean;
    isLoading: boolean;
    onClick: () => void;
}> = ({ angle, isActive, isLoading, onClick }) => {
    return (
        <button 
            onClick={onClick}
            disabled={isLoading}
            className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive ? 'text-cyan-300' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
        >
            {angle}
            {isActive && (
                <motion.div 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" 
                    layoutId="underline"
                />
            )}
            {isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-200 rounded-full animate-spin"></div>
                 </div>
            )}
        </button>
    );
};

export const ModelViewer: React.FC<ModelViewerProps> = ({ baseImageUrl, prompt }) => {
    const [views, setViews] = useState<{ [angle: string]: string }>({ 'Front': baseImageUrl });
    const [activeAngle, setActiveAngle] = useState('Front');
    const [loadingAngle, setLoadingAngle] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const handleAngleSelect = useCallback(async (angle: string) => {
        setError(null);
        setActiveAngle(angle);

        if (views[angle]) {
            return; // Already have this view
        }

        setLoadingAngle(angle);
        try {
            const newImageUrl = await generateImageViewFromAngle(baseImageUrl, angle);
            setViews(prev => ({ ...prev, [angle]: newImageUrl }));
        } catch (err) {
            console.error(`Failed to generate view for angle: ${angle}`, err);
            setError(`Could not generate ${angle} view.`);
            setActiveAngle(prev => views[prev] ? prev : 'Front'); // Revert to a valid angle
        } finally {
            setLoadingAngle(null);
        }
    }, [baseImageUrl, views]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="relative w-full h-full flex-grow flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={views[activeAngle]}
                        src={views[activeAngle]}
                        alt={`${prompt} - ${activeAngle} view`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                </AnimatePresence>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex-shrink-0 bg-gray-950/50 backdrop-blur-sm p-1 rounded-lg border border-gray-700/50 flex items-center gap-1">
                {VIEWER_ANGLES.map(angle => (
                    <AngleButton
                        key={angle}
                        angle={angle}
                        isActive={activeAngle === angle}
                        isLoading={loadingAngle === angle}
                        onClick={() => handleAngleSelect(angle)}
                    />
                ))}
            </div>
        </div>
    );
};