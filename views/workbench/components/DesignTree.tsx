import React from 'react';
import type { DesignVersion } from '../../../types';

interface DesignTreeProps {
  history: DesignVersion[];
  currentVersionId: string | null;
  onSelectVersion: (id: string) => void;
}

const TreeNode: React.FC<{ version: DesignVersion; allVersions: DesignVersion[]; currentVersionId: string | null; onSelectVersion: (id: string) => void; level: number; }> = ({ version, allVersions, currentVersionId, onSelectVersion, level }) => {
  const children = allVersions.filter(v => v.parentId === version.id);
  const isSelected = version.id === currentVersionId;

  return (
    <div>
      <div 
        onClick={() => onSelectVersion(version.id)}
        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-cyan-500/20' : 'hover:bg-gray-700/50'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <img src={version.imageUrl} alt="version thumbnail" className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-gray-700" />
        <div className="truncate">
          <p className={`font-medium text-sm ${isSelected ? 'text-cyan-400' : 'text-gray-200'}`}>{version.id}</p>
          <p className="text-xs text-gray-400 truncate">{version.prompt}</p>
        </div>
      </div>
      {children.length > 0 && (
        <div className="border-l-2 border-gray-700 ml-5">
            {children.map(child => (
                <TreeNode key={child.id} version={child} allVersions={allVersions} currentVersionId={currentVersionId} onSelectVersion={onSelectVersion} level={level + 1} />
            ))}
        </div>
      )}
    </div>
  );
};


export const DesignTree: React.FC<DesignTreeProps> = ({ history, currentVersionId, onSelectVersion }) => {
  const rootVersions = history.filter(v => v.parentId === null);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4 text-white">Design Tree</h2>
      <div className="flex-grow overflow-y-auto space-y-1 pr-1">
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-8">Your design versions will appear here.</p>
        ) : (
          rootVersions.map(version => (
            <TreeNode 
              key={version.id} 
              version={version} 
              allVersions={history} 
              currentVersionId={currentVersionId}
              onSelectVersion={onSelectVersion}
              level={0} 
            />
          ))
        )}
      </div>
    </div>
  );
};
