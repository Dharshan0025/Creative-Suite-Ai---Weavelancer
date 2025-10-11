import React from 'react';
import type { ActiveTool, Style, DesignVersion } from '../../../types';
import { STYLES } from '../../../constants';
import { MagicWandIcon, FeedbackIcon, RotateCcwIcon, RotateCwIcon, DownloadIcon } from '../../../components/icons';

interface ToolbarProps {
  activeTool: ActiveTool;
  onToolSelect: (tool: ActiveTool) => void;
  onStyleTransform: (style: Style) => void;
  onGetAIFeedback: () => void;
  isActionable: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentVersion: DesignVersion | undefined;
}

const ToolButton: React.FC<{ icon: React.ReactElement; label: string; isActive: boolean; onClick: () => void; disabled: boolean; }> = ({ icon, label, isActive, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-full ${
      isActive
        ? 'bg-cyan-500/20 text-cyan-400'
        : 'hover:bg-gray-700/50 text-gray-300'
    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
  >
    <div className="w-6 h-6">{icon}</div>
    <span className="text-xs font-medium">{label}</span>
  </button>
);


export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect, onStyleTransform, onGetAIFeedback, isActionable, onUndo, onRedo, canUndo, canRedo, currentVersion }) => {
  const handleDownload = () => {
    if (!currentVersion) return;
    const link = document.createElement('a');
    link.href = currentVersion.imageUrl;
    // Sanitize the prompt to create a valid filename
    const fileName = `${currentVersion.prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2 px-1">History</h3>
        <div className="grid grid-cols-2 gap-2">
          <ToolButton
            label="Undo"
            icon={<RotateCcwIcon />}
            isActive={false}
            onClick={onUndo}
            disabled={!canUndo}
          />
          <ToolButton
            label="Redo"
            icon={<RotateCwIcon />}
            isActive={false}
            onClick={onRedo}
            disabled={!canRedo}
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2 px-1">Editing Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          <ToolButton
            label="Magic Edit"
            icon={<MagicWandIcon />}
            isActive={activeTool === 'MAGIC_EDIT'}
            onClick={() => onToolSelect(activeTool === 'MAGIC_EDIT' ? 'NONE' : 'MAGIC_EDIT')}
            disabled={!isActionable}
          />
           <ToolButton
            label="Get Feedback"
            icon={<FeedbackIcon />}
            isActive={false}
            onClick={onGetAIFeedback}
            disabled={!isActionable}
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2 px-1">Instant Styles</h3>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map(style => (
            <button
              key={style.name}
              onClick={() => onStyleTransform(style)}
              disabled={!isActionable}
              className="relative rounded-lg overflow-hidden aspect-square group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img src={style.thumbnailUrl} alt={style.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white font-semibold text-sm">{style.name}</span>
              </div>
               <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-center">
                <span className="text-white font-semibold text-xs">{style.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2 px-1">Export</h3>
        <div className="grid grid-cols-2 gap-2">
          <ToolButton
            label="Download"
            icon={<DownloadIcon />}
            isActive={false}
            onClick={handleDownload}
            disabled={!isActionable}
          />
        </div>
      </div>
    </div>
  );
};