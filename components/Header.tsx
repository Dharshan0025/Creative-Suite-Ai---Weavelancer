import React from 'react';
import { SparklesIcon } from './icons';

interface HeaderProps {
    onStartOver: () => void;
}

const Header: React.FC<HeaderProps> = ({ onStartOver }) => {
  return (
    <header className="w-full max-w-7xl mx-auto flex justify-between items-center py-4 px-4 md:px-0">
      <div className="flex items-center gap-2">
        <SparklesIcon className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Creative Suite <span className="text-indigo-600">AI</span>
        </h1>
      </div>
      <button 
        onClick={onStartOver}
        className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm"
      >
        Start Over
      </button>
    </header>
  );
};

export default Header;
