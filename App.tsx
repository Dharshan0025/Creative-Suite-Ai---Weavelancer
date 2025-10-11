import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Stage, GeneratedIdea } from './types';
import Header from './components/Header';
import { StageNavigator } from './components/StageNavigator';
import { IdeasparkView } from './views/ideaspark/IdeasparkView';
import { PreflightCheckView } from './views/preflight/PreflightCheckView';
import { WorkbenchView } from './views/workbench/WorkbenchView';
import { ChooserScreen } from './views/chooser/ChooserScreen';
import { FitCheckView } from './views/fitcheck/FitCheckView';
import { HomeCanvasView } from './views/homecanvas/HomeCanvasView';


const App: React.FC = () => {
  const [stage, setStage] = useState<Stage>(Stage.IDEASPARK);
  const [generatedIdea, setGeneratedIdea] = useState<GeneratedIdea | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  
  // New state for redesign flow
  const [workbenchSource, setWorkbenchSource] = useState<Stage | null>(null);
  const [redesignInput, setRedesignInput] = useState<{ imageUrl: string; onComplete: (newImageUrl: string) => void; } | null>(null);


  const handleStartOver = () => {
    // Clear workbench state from local storage before resetting state
    if (generatedIdea?.title) {
        try {
            localStorage.removeItem(`workbench-state-${generatedIdea.title}`);
        } catch (e) {
            console.error("Failed to remove workbench state from local storage:", e);
        }
    }
    setStage(Stage.IDEASPARK);
    setGeneratedIdea(null);
    setFinalImageUrl(null);
    setFinalPrompt('');
    setNegativePrompt('');
    setWorkbenchSource(null);
    setRedesignInput(null);
  };

  const handleIdeaGenerated = (idea: GeneratedIdea) => {
    setGeneratedIdea(idea);
    setStage(Stage.PREFLIGHT_CHECK);
  };
  
  const handlePreflightComplete = (finalPrompt: string, negativePrompt: string) => {
    setFinalPrompt(finalPrompt);
    setNegativePrompt(negativePrompt);
    setStage(Stage.WORKBENCH);
  }
  
  const handlePreflightBack = () => {
      setStage(Stage.IDEASPARK);
  }

  const handleDesignFinalized = (newImageUrl: string) => {
    if (workbenchSource && redesignInput) {
      // This was a redesign session, call the specific updater
      redesignInput.onComplete(newImageUrl);
      setStage(workbenchSource); // Go back to the source stage
      setWorkbenchSource(null);
      setRedesignInput(null);
    } else {
      // This was the initial design session
      setFinalImageUrl(newImageUrl);
      setStage(Stage.CHOOSER);
    }
  };
  
  const handleRequestRedesign = (imageUrl: string, onComplete: (newImageUrl: string) => void) => {
    setStage(stage); // Store where we came from
    setWorkbenchSource(stage);
    setRedesignInput({ imageUrl, onComplete });
    setStage(Stage.WORKBENCH);
  };
  
  const handleWorkbenchBack = () => {
      if (workbenchSource) {
          setStage(workbenchSource);
          setWorkbenchSource(null);
          setRedesignInput(null);
      }
  };

  const handleBackToChooser = () => {
    setStage(Stage.CHOOSER);
  };

  const handleSelectFitCheck = () => {
    setStage(Stage.FITCHECK);
  };

  const handleSelectHomeCanvas = () => {
    setStage(Stage.HOMECANVAS);
  };

  const renderStage = () => {
    switch (stage) {
      case Stage.IDEASPARK:
        return <IdeasparkView onIdeaGenerated={handleIdeaGenerated} />;
      case Stage.PREFLIGHT_CHECK:
        if (!generatedIdea) {
          handleStartOver();
          return null;
        }
        return <PreflightCheckView idea={generatedIdea} onComplete={handlePreflightComplete} onBack={handlePreflightBack} />;
      case Stage.WORKBENCH:
         if (redesignInput) {
            // Redesign flow
            return <WorkbenchView 
                sessionKey={redesignInput.imageUrl.slice(-20) + redesignInput.imageUrl.length} // Create a unique-ish key
                initialImageUrl={redesignInput.imageUrl}
                onDesignFinalized={handleDesignFinalized}
                onBack={handleWorkbenchBack}
            />
        }
        if (!generatedIdea || !finalPrompt) {
          handleStartOver();
          return null;
        }
        // Original generation flow
        return <WorkbenchView 
            sessionKey={generatedIdea.title.replace(/\s+/g, '-')}
            idea={generatedIdea} 
            finalPrompt={finalPrompt} 
            negativePrompt={negativePrompt} 
            onDesignFinalized={handleDesignFinalized} 
        />;
      case Stage.CHOOSER:
        if (!finalImageUrl) {
          handleStartOver();
          return null;
        }
        return <ChooserScreen finalImageUrl={finalImageUrl} onSelectFitCheck={handleSelectFitCheck} onSelectHomeCanvas={handleSelectHomeCanvas} />;
      case Stage.FITCHECK:
        if (!finalImageUrl || !generatedIdea) {
            handleStartOver();
            return null;
        }
        return <FitCheckView onBack={handleBackToChooser} idea={generatedIdea} designImageUrl={finalImageUrl} onRequestRedesign={handleRequestRedesign} />;
      case Stage.HOMECANVAS:
        if (!finalImageUrl) {
            handleStartOver();
            return null;
        }
        return <HomeCanvasView onBack={handleBackToChooser} designImageUrl={finalImageUrl} onRequestRedesign={handleRequestRedesign} />;
      default:
        return <IdeasparkView onIdeaGenerated={handleIdeaGenerated} />;
    }
  };

  const backgroundClass = stage === Stage.WORKBENCH ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${backgroundClass}`}>
      <Header onStartOver={handleStartOver} />
      <div className="flex-grow flex flex-col items-center w-full">
        {stage !== Stage.IDEASPARK && <StageNavigator currentStage={stage} />}
        <AnimatePresence mode="wait">
          <div className="w-full flex-grow flex items-center justify-center p-4">
            {renderStage()}
          </div>
        </AnimatePresence>
      </div>
      <footer className="w-full text-center py-4 text-xs text-gray-400">
        Creative Suite AI - Powered by Weavelancer
      </footer>
    </div>
  );
};

export default App;