import React from 'react';
import type { DesignVersion, ActiveTool } from '../../../types';
import { CanvasEditor } from './CanvasEditor';

interface WorkbenchProps {
  currentVersion: DesignVersion | undefined;
  onMagicEdit: (maskDataUrl: string, editPrompt: string) => void;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  isLoading: boolean;
  loadingMessage: string;
}

const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 backdrop-blur-sm rounded-lg">
        <svg className="animate-spin h-10 w-10 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg text-gray-200">{message}</p>
    </div>
);


export const Workbench: React.FC<WorkbenchProps> = ({ currentVersion, onMagicEdit, activeTool, setActiveTool, isLoading, loadingMessage }) => {
  return (
    <div className="w-full h-full flex items-center justify-center relative aspect-square max-w-full max-h-full">
      {isLoading && <LoadingSpinner message={loadingMessage} />}
      {!currentVersion && !isLoading ? (
        <div className="text-center p-8 text-gray-400">
            <h2 className="text-2xl font-bold mb-2 text-white">Generating Concept...</h2>
            <p>Your idea from Ideaspark is being visualized.</p>
        </div>
      ) : currentVersion && (
        <div className="relative w-full h-full flex items-center justify-center">
            <img src={currentVersion.imageUrl} alt={currentVersion.prompt} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fade-in" />
            {activeTool === 'MAGIC_EDIT' && (
                <CanvasEditor 
                    imageUrl={currentVersion.imageUrl}
                    onConfirm={onMagicEdit}
                    onCancel={() => setActiveTool('NONE')}
                />
            )}
        </div>
      )}
    </div>
  );
};
