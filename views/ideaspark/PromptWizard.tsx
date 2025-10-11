import React, { useState } from 'react';
import { SparklesIcon } from '../../components/icons';
import { GeneratedIdea, AppError } from '../../types';
import { generateIdeaFromPrompt } from '../../services/geminiService';

interface PromptWizardProps {
  onIdeaGenerated: (idea: GeneratedIdea) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  setHomeView: () => void;
}

type Step = 1 | 2 | 3 | 4;

const categories = [
    'Accessory', 
    'Art', 
    'Bags', 
    'Clothing', 
    'Footwear', 
    'Furniture', 
    'Gadget', 
    'Home Decor', 
    'Jewelry', 
    'Kitchenware', 
    'Lighting', 
    'Print', 
    'Stationery', 
    'Toy'
];
const styles = ['Minimalist', 'Vintage', 'Modern', 'Luxury', 'Eco-Friendly', 'Gothic', 'Cultural'];
const materials = ['Wood', 'Metal', 'Fabric', 'Leather', 'Plastic', 'Glass', 'Stone'];

interface WizardStepProps {
  title: string;
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
  onNext: () => void;
  onBack?: () => void;
}

const WizardStep: React.FC<WizardStepProps> = ({ title, items, selected, onSelect, onNext, onBack }) => (
  <div>
    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{title}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
      {items.map(item => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${selected === item ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 hover:border-indigo-400'}`}
        >
          {item}
        </button>
      ))}
    </div>
    <div className="flex justify-between">
        {onBack ? (
             <button onClick={onBack} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Back</button>
        ) : <div />}
     <button onClick={onNext} disabled={!selected} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300">Next</button>
    </div>
  </div>
);


export const PromptWizard: React.FC<PromptWizardProps> = ({ onIdeaGenerated, setIsLoading, setError, setHomeView }) => {
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState('');
  const [style, setStyle] = useState('');
  const [material, setMaterial] = useState('');

  const handleGenerate = async () => {
    const prompt = `Generate an idea for a ${style} ${category} primarily made of ${material}.`;
    setIsLoading(true);
    setError(null);
    setHomeView();
    try {
      const idea = await generateIdeaFromPrompt(prompt, null);
      onIdeaGenerated(idea);
    } catch (err: any) {
      setError({ message: err.message, onRetry: handleGenerate });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return <WizardStep title="Choose a Category" items={categories} selected={category} onSelect={setCategory} onNext={() => setStep(2)} />;
      case 2:
        return <WizardStep title="Select a Style" items={styles} selected={style} onSelect={setStyle} onNext={() => setStep(3)} onBack={() => setStep(1)} />;
      case 3:
        return <WizardStep title="Pick a Primary Material" items={materials} selected={material} onSelect={setMaterial} onNext={() => setStep(4)} onBack={() => setStep(2)} />;
      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Review Your Idea</h2>
            <div className="bg-gray-100 p-6 rounded-lg space-y-4 mb-8 text-left">
              <p><strong>Category:</strong> {category}</p>
              <p><strong>Style:</strong> {style}</p>
              <p><strong>Material:</strong> {material}</p>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Back</button>
              <button onClick={handleGenerate} className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center shadow-lg">
                <SparklesIcon className="mr-2 h-5 w-5" />
                Spark Idea
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Idea Wizard
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Don't know where to start? Let's build your idea step-by-step.
            </p>
      </div>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        {renderStep()}
      </div>
    </div>
  );
};