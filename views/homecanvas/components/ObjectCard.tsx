import React from 'react';
import { Product } from '../../../types';
import { EditIcon } from '../../../components/icons';

interface ObjectCardProps {
    product: Product;
    isSelected: boolean;
    onClick?: () => void;
    onRedesign?: () => void;
}

export const ObjectCard: React.FC<ObjectCardProps> = ({ product, isSelected, onClick, onRedesign }) => {
    const cardClasses = `
        bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105' : ''}
        ${isSelected ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-zinc-200'}
    `;

    return (
        <div className={cardClasses} onClick={onClick}>
            <div className="aspect-square w-full bg-zinc-100 flex items-center justify-center relative group">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                 {onRedesign && isSelected && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRedesign(); }}
                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all z-10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Redesign this product"
                    >
                        <EditIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            <div className="p-3 text-center">
                <h4 className="text-sm font-semibold text-zinc-700 truncate">{product.name}</h4>
            </div>
        </div>
    );
};
