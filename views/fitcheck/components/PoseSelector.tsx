import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PoseSelectorProps {
    poses: string[];
    currentPoseIndex: number;
    onSelectPose: (index: number) => void;
    availablePoseKeys: string[];
    isLoading: boolean;
}

export const PoseSelector: React.FC<PoseSelectorProps> = ({ poses, currentPoseIndex, onSelectPose, availablePoseKeys, isLoading }) => {
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentElement = listRef.current?.children[currentPoseIndex] as HTMLElement;
        if (currentElement) {
            currentElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [currentPoseIndex]);
    
    return (
        <div className="bg-white/70 backdrop-blur-lg rounded-xl p-2 border border-gray-300/50 shadow-md">
            <div ref={listRef} className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {poses.map((pose, index) => {
                    const isAvailable = availablePoseKeys.includes(pose);
                    const isActive = index === currentPoseIndex;

                    return (
                        <button
                            key={pose}
                            onClick={() => onSelectPose(index)}
                            disabled={isLoading && !isActive}
                            className={`flex-shrink-0 h-auto min-h-[2.5rem] px-4 py-2 flex items-center justify-center text-center rounded-lg transition-all duration-200 border-2 ${
                                isActive 
                                ? 'bg-indigo-600 text-white border-indigo-700' 
                                : isAvailable 
                                ? 'bg-white text-gray-700 border-gray-300 hover:border-indigo-500' 
                                : 'bg-gray-100 text-gray-400 border-gray-200 hover:border-gray-400'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            aria-label={`Select pose: ${pose}`}
                        >
                            <span className="text-sm font-semibold whitespace-nowrap">{pose}</span>
                            {!isAvailable && !isActive && (
                                <span className="text-xs ml-1.5 text-gray-500/80">(Generate)</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
