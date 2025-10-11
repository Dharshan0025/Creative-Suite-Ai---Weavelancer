import React, { useCallback, useState } from 'react';
import { WardrobeItem } from '../../../types';
import { PlusIcon, SparklesIcon, TypeIcon, EditIcon } from '../../../components/icons';

interface WardrobePanelProps {
  onGarmentSelect: (file: File, garment: WardrobeItem) => void;
  onGarmentGenerated: (prompt: string) => Promise<void>;
  onRedesign: (item: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

// Helper to fetch a URL and convert it to a File object
const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
    const response = await fetch(url);
    const data = await response.blob();
    return new File([data], filename, { type: mimeType });
}

export const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, onGarmentGenerated, onRedesign, activeGarmentIds, isLoading, wardrobe }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelect = useCallback(async (item: WardrobeItem) => {
    try {
        const file = await urlToFile(item.url, item.name, 'image/png'); // Assuming png, adjust if needed
        onGarmentSelect(file, item);
    } catch (error) {
        console.error("Error converting URL to file:", error);
    }
  }, [onGarmentSelect]);

  const handleCustomUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const newItem: WardrobeItem = {
              id: `custom-${Date.now()}`,
              name: file.name,
              type: 'top', // default type for custom uploads
              // Fix: Added missing 'category' property with a default value.
              category: 'Clothing',
              url: URL.createObjectURL(file), // create a temporary URL for preview
          };
          onGarmentSelect(file, newItem);
          // Reset file input to allow uploading the same file again
          event.target.value = '';
      }
  }
  
  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading || isGenerating) return;
    setIsGenerating(true);
    try {
      await onGarmentGenerated(prompt);
      setPrompt(''); // Clear prompt on success
    } catch (error) {
      // Error is handled and displayed in the parent component
      console.error("Garment generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-xl font-serif tracking-wider text-gray-800 border-b border-gray-400/50 pb-2 mb-4">Create with AI</h2>
        <div className="space-y-3">
          <div className="relative">
            <TypeIcon className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g., a blue denim jacket"
              className="w-full bg-gray-50 border-gray-300 border rounded-lg pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              disabled={isLoading || isGenerating}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading || isGenerating}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Garment
              </>
            )}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-serif tracking-wider text-gray-800 border-b border-gray-400/50 pb-2 mb-4">Wardrobe</h2>
        <div className="grid grid-cols-3 gap-3">
          {wardrobe.map((item) => {
            const isActive = activeGarmentIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => !isLoading && handleSelect(item)}
                className={`relative aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 transition-all duration-200 group focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 ${
                  isActive ? 'border-indigo-500' : 'border-transparent hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={item.name}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className={`w-full h-full object-cover transition-transform group-hover:scale-110`}
                />
                {isActive && <div className="absolute inset-0 bg-indigo-500/30"></div>}
                 <button
                    onClick={(e) => { e.stopPropagation(); onRedesign(item); }}
                    disabled={isLoading}
                    className="absolute top-1.5 right-1.5 bg-white/60 backdrop-blur-sm p-1.5 rounded-full text-gray-700 hover:bg-white hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-0"
                    aria-label={`Redesign ${item.name}`}
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
              </div>
            )
          })}
          <label htmlFor="custom-garment-upload" className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
              <PlusIcon className="w-6 h-6 text-gray-500 mb-1" />
              <span className="text-xs text-center text-gray-500">Add Own</span>
              <input id="custom-garment-upload" type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
          </label>
        </div>
      </div>
    </div>
  );
};
