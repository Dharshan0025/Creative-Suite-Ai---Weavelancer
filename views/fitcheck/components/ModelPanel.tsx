import React from 'react';
import { Model } from '../../../types';
import { PlusIcon } from '../../../components/icons';

interface ModelPanelProps {
  models: Model[];
  activeModelId: string | null;
  onSelectModel: (modelId: string) => void;
  onImportModel: (file: File) => void;
  isLoading: boolean;
}

export const ModelPanel: React.FC<ModelPanelProps> = ({ models, activeModelId, onSelectModel, onImportModel, isLoading }) => {

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportModel(file);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div>
      <h2 className="text-xl font-serif tracking-wider text-gray-800 border-b border-gray-400/50 pb-2 mb-4">Models</h2>
      <div className="grid grid-cols-3 gap-3">
        {models.map((model) => {
          const isActive = activeModelId === model.id;
          return (
            <div
              key={model.id}
              onClick={() => !isLoading && onSelectModel(model.id)}
              className={`relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
                isActive ? 'border-indigo-500' : 'border-transparent hover:border-gray-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={model.name}
            >
              <img
                src={model.url}
                alt={model.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              {isActive && <div className="absolute inset-0 bg-indigo-500/30"></div>}
            </div>
          );
        })}
        <label htmlFor="model-import-upload" className="aspect-[3/4] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
          <PlusIcon className="w-6 h-6 text-gray-500 mb-1" />
          <span className="text-xs text-center text-gray-500">Import Model</span>
          <input id="model-import-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
    </div>
  );
};
