import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StartScreen } from './components/StartScreen';
import { Canvas } from './components/Canvas';
import { WardrobePanel } from './components/WardrobeModal';
import { OutfitStack } from './components/OutfitStack';
import { generateModelImage, generateVirtualTryOnImage, generatePoseVariation, generateGarmentFromPrompt } from '../../services/geminiService';
import { OutfitLayer, WardrobeItem, Model, GeneratedIdea } from '../../types';
import { ChevronDownIcon, ChevronUpIcon } from '../../components/icons';
import { POSE_INSTRUCTIONS } from '../../constants';
import { useImageCache } from '../../hooks/useImageCache';
import { ModelPanel } from './components/ModelPanel';

// Helper to convert a data URL string to a File object asynchronously
const dataURLtoFile = async (dataurl: string, filename: string): Promise<File> => {
    const res = await fetch(dataurl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
}


interface FitCheckViewProps {
    idea: GeneratedIdea | null;
    designImageUrl: string;
    onRequestRedesign: (imageUrl: string, onComplete: (newImageUrl: string) => void) => void;
}

const TabButton: React.FC<{ name: string; active: boolean; onClick: () => void; }> = ({ name, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'text-indigo-600 border-b-2 border-indigo-600'
          : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      {name}
    </button>
  );

export const FitCheckView: React.FC<FitCheckViewProps> = ({ idea, designImageUrl, onRequestRedesign }) => {
  const [savedModels, setSavedModels] = useState<Model[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'models'>('wardrobe');
  
  const imageCache = useImageCache();
  
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(() => {
    if (!idea) return [];
    return [{
      id: 'generated-design',
      name: 'Your Generated Design',
      type: 'top', // This is for layering, can be refined
      category: idea.category,
      url: designImageUrl,
    }];
  });

  const modelImageUrl = useMemo(() => {
    if (!activeModelId) return null;
    return savedModels.find(m => m.id === activeModelId)?.url || null;
  }, [activeModelId, savedModels]);

  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);
  
  const handleModelGenerated = (url: string, sourceFile: File) => {
    const newModel: Model = {
      id: `model-${Date.now()}`,
      name: sourceFile.name,
      url: url,
    };

    setSavedModels(prev => [...prev, newModel]);
    setActiveModelId(newModel.id);
    setOutfitHistory([{
      garment: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: url }
    }]);
    setCurrentOutfitIndex(0);
    setCurrentPoseIndex(0);
    setActiveTab('wardrobe');
  };
  
  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!displayImageUrl || isLoading) return;

    const existingLayerIndex = outfitHistory.findIndex(layer => layer.garment?.id === garmentInfo.id);
    if (existingLayerIndex > -1 && existingLayerIndex <= currentOutfitIndex) {
        setCurrentOutfitIndex(existingLayerIndex);
        setCurrentPoseIndex(0);
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Adding ${garmentInfo.name}...`);

    try {
      const newImageUrl = await generateVirtualTryOnImage(displayImageUrl, garmentFile, garmentInfo.category);
      const currentPoseInstruction = POSE_INSTRUCTIONS[0];
      setCurrentPoseIndex(0);
      
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl } 
      };

      const newHistory = [...outfitHistory.slice(0, currentOutfitIndex + 1), newLayer];
      setOutfitHistory(newHistory);
      setCurrentOutfitIndex(newHistory.length - 1);
      
      setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) return prev;
        return [...prev, garmentInfo];
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply garment. The model might not support this item.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, outfitHistory, currentOutfitIndex]);

  const handleGarmentGenerated = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setLoadingMessage(`Generating "${prompt}"...`);
    setError(null);
    try {
        const garmentImageUrl = await generateGarmentFromPrompt(prompt);
        const newGarment: WardrobeItem = {
            id: `ai-${Date.now()}`,
            name: prompt,
            type: 'top',
            // Defaulting category for now, could be improved with a category selection UI
            category: 'Clothing', 
            url: garmentImageUrl,
        };
        const garmentFile = await dataURLtoFile(garmentImageUrl, `${prompt.replace(/\s+/g, '-')}.png`);
        
        await handleGarmentSelect(garmentFile, newGarment);

    } catch(err) {
        // Fix: Make error handling more robust to satisfy strict type checking for the `setError` state.
        const message = err instanceof Error ? err.message : "Failed to generate garment.";
        setError(message);
        setIsLoading(false);
        throw err;
    }
  }, [handleGarmentSelect]);

  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0) {
      setCurrentOutfitIndex(prevIndex => prevIndex - 1);
      setCurrentPoseIndex(0);
    }
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    if (currentLayer.poseImages[poseInstruction]) {
      setCurrentPoseIndex(newIndex);
      return;
    }

    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return;
    
    const cacheKey = `pose-${baseImageForPoseChange}-${poseInstruction}`;
    if (imageCache.has(cacheKey)) {
        const newImageUrl = imageCache.get(cacheKey)!;
        setOutfitHistory(prev => {
            const newHistory = [...prev];
            newHistory[currentOutfitIndex].poseImages[poseInstruction] = newImageUrl;
            return newHistory;
        });
        setCurrentPoseIndex(newIndex);
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Changing pose...`);
    
    const prevPoseIndex = currentPoseIndex;

    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      imageCache.set(cacheKey, newImageUrl);
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const updatedLayer = newHistory[currentOutfitIndex];
        updatedLayer.poseImages[poseInstruction] = newImageUrl;
        return newHistory;
      });
      setCurrentPoseIndex(newIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change pose. Try another.');
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex, imageCache]);

  const handleRedesign = (item: WardrobeItem) => {
    const onComplete = (newImageUrl: string) => {
        setWardrobe(currentWardrobe => 
            currentWardrobe.map(wItem => 
                wItem.id === item.id ? { ...wItem, url: newImageUrl } : wItem
            )
        );
    };
    onRequestRedesign(item.url, onComplete);
  };

  const handleImportModel = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingMessage('Importing and preparing model...');
    setError(null);

    try {
      const newModelUrl = await generateModelImage(file);
      handleModelGenerated(newModelUrl, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import model.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectModel = useCallback((modelId: string) => {
    if (modelId === activeModelId || isLoading) return;

    setActiveModelId(modelId);
    const model = savedModels.find(m => m.id === modelId);
    if (model) {
      setOutfitHistory([{
        garment: null,
        poseImages: { [POSE_INSTRUCTIONS[0]]: model.url }
      }]);
      setCurrentOutfitIndex(0);
      setCurrentPoseIndex(0);
    }
  }, [activeModelId, isLoading, savedModels]);

  const viewVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      key="fitcheck"
      className="font-sans w-full"
      variants={viewVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
        <div className="text-center mb-8 px-4">
             <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                FitCheck Studio
             </h1>
             <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Virtually try on your design, or create new apparel with AI.
             </p>
        </div>
      <AnimatePresence mode="wait">
        {savedModels.length === 0 ? (
          <motion.div
            key="start-screen"
            className="w-full max-w-lg mx-auto flex items-start sm:items-center justify-center bg-gray-50 p-4"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onModelFinalized={handleModelGenerated} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-[80vh] bg-white overflow-hidden border rounded-xl shadow-lg"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white relative">
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={Object.keys(outfitHistory[currentOutfitIndex]?.poseImages || {})}
                />
              </div>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-gray-200/60 transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-8 flex items-center justify-center bg-gray-100/50"
                    aria-label={isSheetCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >
                    {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-500" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500" />}
                  </button>
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex-shrink-0 p-2 border-b border-gray-200/60">
                        <div className="flex">
                            <TabButton name="Wardrobe" active={activeTab === 'wardrobe'} onClick={() => setActiveTab('wardrobe')} />
                            <TabButton name="Models" active={activeTab === 'models'} onClick={() => setActiveTab('models')} />
                        </div>
                    </div>
                    <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow">
                        {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                        )}
                        <AnimatePresence mode="wait">
                            {activeTab === 'wardrobe' ? (
                                <motion.div
                                    key="wardrobe-content"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col gap-8"
                                >
                                    <OutfitStack 
                                    outfitHistory={activeOutfitLayers}
                                    onRemoveLastGarment={handleRemoveLastGarment}
                                    />
                                    <WardrobePanel
                                    onGarmentSelect={handleGarmentSelect}
                                    onGarmentGenerated={handleGarmentGenerated}
                                    onRedesign={handleRedesign}
                                    activeGarmentIds={activeGarmentIds}
                                    isLoading={isLoading}
                                    wardrobe={wardrobe}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="models-content"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <ModelPanel 
                                        models={savedModels}
                                        activeModelId={activeModelId}
                                        onSelectModel={handleSelectModel}
                                        onImportModel={handleImportModel}
                                        isLoading={isLoading}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                  </div>
              </aside>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
