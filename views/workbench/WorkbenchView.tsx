import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DesignTree } from './components/DesignTree';
import { Toolbar } from './components/Toolbar';
import { MainDisplay } from './components/MainDisplay';
import { DesignVersion, ActiveTool, Style, GeneratedIdea, AppError } from '../../types';
import {
  generateInitialImages,
  editImageWithMask,
  applyStyleToImage,
  getAIFeedbackForImage,
} from '../../services/geminiService';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { SparklesIcon, ChevronLeftIcon } from '../../components/icons';

interface WorkbenchViewProps {
    sessionKey: string;
    idea?: GeneratedIdea;
    finalPrompt?: string;
    negativePrompt?: string;
    initialImageUrl?: string;
    onDesignFinalized: (imageUrl: string) => void;
    onBack?: () => void;
}


interface HistoryState {
    designHistory: DesignVersion[];
    historyStack: string[];
    historyIndex: number;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({ sessionKey, idea, finalPrompt, negativePrompt, initialImageUrl, onDesignFinalized, onBack }) => {
  const [historyState, setHistoryState] = useState<HistoryState>(() => {
      try {
          const storedState = localStorage.getItem(`workbench-state-${sessionKey}`);
          if (storedState) {
              return JSON.parse(storedState);
          }
      } catch (e) {
          console.error("Failed to parse stored state for workbench:", e);
      }
      return { designHistory: [], historyStack: [], historyIndex: -1 };
  });

  const { designHistory, historyStack, historyIndex } = historyState;

  const [initialConcepts, setInitialConcepts] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<ActiveTool>('NONE');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [error, setError] = useState<AppError | null>(null);
  
  useEffect(() => {
    try {
        localStorage.setItem(`workbench-state-${sessionKey}`, JSON.stringify(historyState));
    } catch (e) {
        console.error("Failed to save workbench state:", e);
    }
  }, [historyState, sessionKey]);

  const currentVersionId = historyIndex >= 0 ? historyStack[historyIndex] : null;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  const currentVersion = designHistory.find(v => v.id === currentVersionId);
  
  const handleSelectConcept = useCallback((imageUrl: string, prompt: string) => {
    const newVersion: DesignVersion = {
      id: `v${Date.now()}`,
      imageUrl,
      prompt,
      parentId: null,
    };
    setHistoryState({
        designHistory: [newVersion],
        historyStack: [newVersion.id],
        historyIndex: 0,
    });
    setInitialConcepts([]);
  }, []);

  const generateInitialConcepts = useCallback(async () => {
    if (!finalPrompt) return;
    setIsLoading(true);
    setLoadingMessage('Generating your design...');
    setError(null);
    setAiFeedback('');
    try {
      const imageDataUrls = await generateInitialImages(finalPrompt, negativePrompt);
      if (imageDataUrls && imageDataUrls.length > 0) {
        handleSelectConcept(imageDataUrls[0], `${idea?.title || 'Initial Concept'}`);
      } else {
        throw new Error('The AI failed to generate an image.');
      }
    } catch (err) {
      setError({
          message: err instanceof Error ? err.message : 'An unknown error occurred.',
          onRetry: generateInitialConcepts,
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [finalPrompt, negativePrompt, idea, handleSelectConcept]);

  useEffect(() => {
    if (designHistory.length === 0 && !isLoading) {
      if (initialImageUrl) {
        const newVersion: DesignVersion = {
          id: `v${Date.now()}`,
          imageUrl: initialImageUrl,
          prompt: 'Initial Design for Redesign',
          parentId: null,
        };
        setHistoryState({
            designHistory: [newVersion],
            historyStack: [newVersion.id],
            historyIndex: 0,
        });
        setInitialConcepts([]);
      } else if (finalPrompt) {
        generateInitialConcepts();
      }
    }
  }, [designHistory.length, isLoading, initialImageUrl, finalPrompt, generateInitialConcepts]);
  
  const updateHistory = (newVersion: DesignVersion) => {
      setHistoryState(prev => {
          const newHistoryStack = prev.historyStack.slice(0, prev.historyIndex + 1);
          newHistoryStack.push(newVersion.id);
          return {
              designHistory: [...prev.designHistory, newVersion],
              historyStack: newHistoryStack,
              historyIndex: newHistoryStack.length - 1
          };
      });
  };
  
  const handleMagicEdit = useCallback(async (maskDataUrl: string, editPrompt: string, mode: 'replace' | 'add') => {
    if (!currentVersion) return;
    setIsLoading(true);
    setLoadingMessage('Applying Magic Edit...');
    setError(null);
    setActiveTool('NONE');
    try {
      const newImageDataUrl = await editImageWithMask(currentVersion.imageUrl, maskDataUrl, editPrompt, mode);
      const newVersion: DesignVersion = {
        id: `v${Date.now()}`,
        imageUrl: newImageDataUrl,
        prompt: `Magic Edit (${mode}): ${editPrompt}`,
        parentId: currentVersion.id,
      };
      updateHistory(newVersion);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'An unknown error occurred.' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentVersion]);
  
  const handleStyleTransform = useCallback(async (style: Style) => {
    if (!currentVersion) return;
    setIsLoading(true);
    setLoadingMessage(`Applying ${style.name} style...`);
    setError(null);
    try {
      const newImageDataUrl = await applyStyleToImage(currentVersion.imageUrl, style.prompt);
      const newVersion: DesignVersion = {
        id: `v${Date.now()}`,
        imageUrl: newImageDataUrl,
        prompt: `Style: ${style.name}`,
        parentId: currentVersion.id,
      };
      updateHistory(newVersion);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'An unknown error occurred.' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentVersion]);

  const handleGetAIFeedback = useCallback(async () => {
    if (!currentVersion) return;
    setIsLoading(true);
    setLoadingMessage('Generating AI feedback...');
    setError(null);
    setAiFeedback('');
    try {
      const feedback = await getAIFeedbackForImage(currentVersion.imageUrl, currentVersion.prompt);
      setAiFeedback(feedback);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Failed to get AI feedback.' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentVersion]);

  const handleSelectVersion = useCallback((versionId: string) => {
    if (versionId === currentVersionId) return;
    setHistoryState(prev => {
        const newHistoryStack = prev.historyStack.slice(0, prev.historyIndex + 1);
        newHistoryStack.push(versionId);
        return {
            ...prev,
            historyStack: newHistoryStack,
            historyIndex: newHistoryStack.length - 1
        };
    });
  }, [currentVersionId]);

  const handleUndo = useCallback(() => {
    if (canUndo) setHistoryState(prev => ({...prev, historyIndex: prev.historyIndex - 1}));
  }, [canUndo]);

  const handleRedo = useCallback(() => {
    if (canRedo) setHistoryState(prev => ({...prev, historyIndex: prev.historyIndex + 1}));
  }, [canRedo]);

  const handleFinalize = () => {
      if (currentVersion) {
          onDesignFinalized(currentVersion.imageUrl);
      }
  }
  
  const viewVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const renderContent = () => {
    if (designHistory.length === 0) {
      return (
        <div className="text-center w-full max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Visualizing Your Idea</h2>
          <p className="text-gray-400 mb-8">The AI is creating your initial design. Please wait a moment.</p>
          {isLoading ? (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="mt-4 text-gray-400">{loadingMessage}</p>
            </div>
          ) : error ? (
            <ErrorDisplay message={error.message} onRetry={error.onRetry} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {initialConcepts.map((src, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectConcept(src, `${idea?.title || 'Concept'}: ${index + 1}`)}
                  className="bg-gray-900 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-cyan-500"
                >
                  <img src={src} alt={`Concept ${index + 1}`} className="w-full h-full object-cover aspect-square" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return (
        <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 w-full">
            <aside className="lg:col-span-3 bg-gray-900 rounded-lg p-4 flex flex-col h-[70vh] lg:h-auto">
              <DesignTree 
                history={designHistory}
                currentVersionId={currentVersionId}
                onSelectVersion={handleSelectVersion}
              />
            </aside>
            
            <div className="lg:col-span-6 flex items-center justify-center bg-gray-900 rounded-lg p-2 relative">
              <MainDisplay
                key={currentVersion?.id} // Force re-mount on version change
                currentVersion={currentVersion} 
                onMagicEdit={handleMagicEdit}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                isLoading={isLoading}
                loadingMessage={loadingMessage}
              />
            </div>
    
            <aside className="lg:col-span-3 bg-gray-900 rounded-lg p-4 flex flex-col gap-4">
              <Toolbar 
                activeTool={activeTool}
                onToolSelect={setActiveTool}
                onStyleTransform={handleStyleTransform}
                onGetAIFeedback={handleGetAIFeedback}
                isActionable={!!currentVersion && !isLoading}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
              {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-md text-sm">{error.message}</div>}
              {aiFeedback && (
                <div className="bg-gray-800 p-4 rounded-lg flex-grow overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-2 text-cyan-400">AI Feedback</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{aiFeedback}</p>
                </div>
              )}
               <div className="mt-auto pt-4">
                    <button 
                        onClick={handleFinalize}
                        disabled={!currentVersion || isLoading}
                        className="w-full px-8 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors duration-300 flex items-center justify-center shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="mr-2 h-5 w-5" />
                        {onBack ? 'Apply Changes' : 'Finalize & Continue'}
                    </button>
                </div>
            </aside>
        </main>
    );
  }


  return (
    <motion.div
      key="workbench"
      className="w-full flex flex-col"
      variants={viewVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
        <div className="text-center mb-8 px-4 relative">
             {onBack && (
                 <button 
                    onClick={onBack}
                    className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                    aria-label="Go back"
                 >
                    <ChevronLeftIcon className="w-6 h-6" />
                    <span className="hidden md:inline">Back</span>
                 </button>
             )}
             <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
                Visual Workbench
             </h1>
             <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
                Refine your concept. Use AI tools to edit, style, and evolve your design.
             </p>
        </div>
      {renderContent()}
    </motion.div>
  );
};