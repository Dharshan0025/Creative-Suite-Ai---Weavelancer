import React from 'react';
import { INSPIRATION_DATA } from '../../constants';
import { InspirationCardData } from '../../types';

interface CardProps {
    item: InspirationCardData;
    onRemix: (item: InspirationCardData) => void;
}

const Card: React.FC<CardProps> = ({ item, onRemix }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
    <img className="h-48 w-full object-cover" src={item.imageUrl} alt={item.title} />
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
      <p className="text-gray-600 text-sm mb-4">{item.description}</p>
      <button 
        onClick={() => onRemix(item)}
        className="w-full px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-200 transition-colors"
      >
        Remix this Idea
      </button>
    </div>
  </div>
);

interface InspirationBoardProps {
    onRemix: (item: InspirationCardData) => void;
}

export const InspirationBoard: React.FC<InspirationBoardProps> = ({ onRemix }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          Community Inspiration
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
          Browse trending ideas from the community. Click 'Remix' to use one as a starting point.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {INSPIRATION_DATA.map((item) => (
          <Card key={item.id} item={item} onRemix={onRemix} />
        ))}
      </div>
    </div>
  );
};
