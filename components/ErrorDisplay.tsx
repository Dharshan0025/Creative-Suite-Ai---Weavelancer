import React from 'react';
import { RotateCcwIcon } from './icons';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => (
  <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between animate-fade-in">
    <span>{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-200 text-red-800 font-semibold rounded-md hover:bg-red-300 transition-colors text-sm"
        aria-label="Retry action"
      >
        <RotateCcwIcon className="w-4 h-4" />
        Retry
      </button>
    )}
  </div>
);
