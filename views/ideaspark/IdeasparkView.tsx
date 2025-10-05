import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { View, InspirationCardData, GeneratedIdea, AppError } from '../../types';
import { Home } from './Home';
import { InspirationBoard } from './InspirationBoard';
import { PromptWizard } from './PromptWizard';

interface IdeasparkHeaderProps {
    currentView: View;
    setView: (view: View) => void;
}

const IdeasparkHeader: React.FC<IdeasparkHeaderProps> = ({ currentView, setView }) => {
    const navItemClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors";
    const activeClasses = "bg-indigo-100 text-indigo-700";
    const inactiveClasses = "text-gray-500 hover:bg-gray-100 hover:text-gray-700";

    return (
        <header className="bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 mb-8">
            <nav className="max-w-4xl mx-auto flex justify-center items-center p-2 space-x-2">
                <button
                    onClick={() => setView(View.Home)}
                    className={`${navItemClasses} ${currentView === View.Home ? activeClasses : inactiveClasses}`}
                >
                    Generate
                </button>
                <button
                    onClick={() => setView(View.Wizard)}
                    className={`${navItemClasses} ${currentView === View.Wizard ? activeClasses : inactiveClasses}`}
                >
                    Wizard
                </button>
                <button
                    onClick={() => setView(View.Inspiration)}
                    className={`${navItemClasses} ${currentView === View.Inspiration ? activeClasses : inactiveClasses}`}
                >
                    Inspiration
                </button>
            </nav>
        </header>
    )
}


interface IdeasparkViewProps {
    onIdeaGenerated: (idea: GeneratedIdea) => void;
}

export const IdeasparkView: React.FC<IdeasparkViewProps> = ({ onIdeaGenerated }) => {
  const [currentView, setCurrentView] = useState<View>(View.Home);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [initialPrompt, setInitialPrompt] = useState('');

  const handleRemix = useCallback((item: InspirationCardData) => {
      setInitialPrompt(`${item.title}: ${item.description}`);
      setCurrentView(View.Home);
      setError(null);
  }, []);

  const setViewAndClear = (view: View) => {
    setInitialPrompt(''); // Clear initial prompt when navigating manually
    setCurrentView(view);
  }
  
  const viewVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const renderView = () => {
    switch (currentView) {
      case View.Home:
        return <Home 
                    onIdeaGenerated={onIdeaGenerated}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    error={error}
                    setError={setError}
                    initialPrompt={initialPrompt}
                />;
      case View.Wizard:
        return <PromptWizard 
                    onIdeaGenerated={onIdeaGenerated}
                    setIsLoading={setIsLoading}
                    setError={setError}
                    setHomeView={() => setCurrentView(View.Home)}
                />;
      case View.Inspiration:
        return <InspirationBoard onRemix={handleRemix} />;
      default:
        return <Home 
                    onIdeaGenerated={onIdeaGenerated}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    error={error}
                    setError={setError}
                    initialPrompt={initialPrompt}
                />;
    }
  };

  return (
    <motion.div
      key="ideaspark"
      className="w-full"
      variants={viewVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <IdeasparkHeader currentView={currentView} setView={setViewAndClear} />
      <main>
        {renderView()}
      </main>
    </motion.div>
  );
}