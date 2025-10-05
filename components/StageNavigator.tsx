import React from 'react';
import { Stage } from '../types';

interface StageNavigatorProps {
  currentStage: Stage;
}

const STAGE_CONFIG = [
  { id: Stage.IDEASPARK, name: 'Idea Spark' },
  { id: Stage.PREFLIGHT_CHECK, name: 'Pre-flight Check'},
  { id: Stage.WORKBENCH, name: 'Workbench' },
  { id: Stage.CHOOSER, name: 'Choose Path' },
  { id: Stage.FITCHECK, name: 'FitCheck' },
  { id: Stage.HOMECANVAS, name: 'Home Canvas' },
];

export const StageNavigator: React.FC<StageNavigatorProps> = ({ currentStage }) => {
  
  // Special handling for the split path at the CHOOSER stage
  const relevantStages = currentStage === Stage.HOMECANVAS 
    ? STAGE_CONFIG.filter(s => s.id !== Stage.FITCHECK)
    : STAGE_CONFIG.filter(s => s.id !== Stage.HOMECANVAS);

  const finalIndex = relevantStages.findIndex(s => s.id === currentStage);

  return (
    <nav className="w-full max-w-4xl mx-auto my-4 md:my-8 px-4" aria-label="Progress">
      <ol className="flex items-center">
        {relevantStages.map((stage, index) => {
          const isCompleted = index < finalIndex;
          const isCurrent = index === finalIndex;
          
          let textColor = 'text-gray-500';
          let circleColor = 'text-gray-400';
          let borderColor = 'border-gray-300';
          
          if (isCurrent) {
            textColor = 'text-indigo-600 dark:text-cyan-400';
            circleColor = 'text-indigo-600 dark:text-cyan-400';
            borderColor = 'border-indigo-600 dark:border-cyan-400';
          } else if (isCompleted) {
            textColor = 'text-gray-900 dark:text-gray-100';
            circleColor = 'text-gray-900 dark:text-gray-100';
            borderColor = 'border-gray-500 dark:border-gray-400';
          }

          const isLast = index === relevantStages.length - 1;

          return (
            <React.Fragment key={stage.id}>
              <li className="relative">
                <div className="flex flex-col items-center text-center w-24">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 border-2 ${borderColor} rounded-full flex items-center justify-center`}>
                    {isCompleted ? (
                        <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${circleColor}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    ) : (
                        <span className={`${circleColor} font-bold text-sm sm:text-base`}>{index + 1}</span>
                    )}
                    </div>
                    <p className={`mt-2 text-xs sm:text-sm font-medium ${textColor}`}>{stage.name}</p>
                </div>
              </li>
              {!isLast && (
                 <li className={`flex-auto border-t-2 transition-colors duration-300 ${isCompleted ? borderColor : 'border-gray-300'}`}>
                 </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};