import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GeneratedIdea } from '../../types';
import { SparklesIcon, ChevronLeftIcon } from '../../components/icons';

interface PreflightCheckViewProps {
  idea: GeneratedIdea;
  onComplete: (finalPrompt: string, negativePrompt: string) => void;
  onBack: () => void;
}

export const PreflightCheckView: React.FC<PreflightCheckViewProps> = ({ idea, onComplete, onBack }) => {
  const initialPrompt = `${idea.title}: ${idea.concept}. Visual style: ${idea.styleAndAesthetics}. Materials: ${idea.suggestedMaterials.join(', ')}.`;
  const [finalPrompt, setFinalPrompt] = useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState('');

  const viewVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      key="preflight"
      className="w-full max-w-3xl mx-auto p-4"
      variants={viewVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          Pre-flight Check
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
          Review the prompt before we generate your visuals. Add exclusions for more precise results.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
        <div>
          <label htmlFor="final-prompt" className="block text-sm font-bold text-gray-700 mb-2">
            Final Prompt
          </label>
          <textarea
            id="final-prompt"
            value={finalPrompt}
            onChange={(e) => setFinalPrompt(e.target.value)}
            className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-y"
          />
        </div>

        <div>
          <label htmlFor="negative-prompt" className="block text-sm font-bold text-gray-700 mb-2">
            Negative Prompt (Exclusions)
          </label>
          <input
            id="negative-prompt"
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="e.g., no text, no people, blurry background"
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-4">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to Ideation
          </button>
          <button 
            onClick={() => onComplete(finalPrompt, negativePrompt)}
            className="w-full sm:w-auto mt-4 sm:mt-0 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center shadow-lg"
          >
            <SparklesIcon className="mr-2 h-5 w-5" />
            Generate Visuals
          </button>
        </div>
      </div>
    </motion.div>
  );
};
