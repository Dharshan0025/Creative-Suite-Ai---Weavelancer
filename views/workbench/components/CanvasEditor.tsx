import React, { useRef, useEffect, useState } from 'react';

type EditMode = 'replace' | 'add';

interface CanvasEditorProps {
  imageUrl: string;
  onConfirm: (maskDataUrl: string, editPrompt: string, mode: EditMode) => void;
  onCancel: () => void;
}

const ModeButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            isActive ? 'bg-cyan-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
        }`}
    >
        {label}
    </button>
);

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ imageUrl, onConfirm, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [editPrompt, setEditPrompt] = useState('');
  const [editMode, setEditMode] = useState<EditMode>('replace');

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => {
      const { clientWidth, clientHeight } = container;
      const aspectRatio = image.naturalWidth / image.naturalHeight;
      let width = clientWidth;
      let height = clientWidth / aspectRatio;

      if (height > clientHeight) {
        height = clientHeight;
        width = clientHeight * aspectRatio;
      }
      canvas.width = width;
      canvas.height = height;
    };
  }, [imageUrl]);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getMousePos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };
  
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !editPrompt.trim()) return;
    const maskDataUrl = canvas.toDataURL();
    onConfirm(maskDataUrl, editPrompt.trim(), editMode);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0,0, canvas.width, canvas.height);
  }

  const modeDescriptions = {
      replace: 'Completely replaces the masked area with your description.',
      add: 'Adds or modifies a detail within the masked area, preserving the underlying content.'
  };

  return (
    <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div ref={containerRef} className="relative w-full h-[calc(100%-180px)] flex items-center justify-center">
        <img src={imageUrl} className="max-w-full max-h-full object-contain pointer-events-none" alt="background for editing" />
        <canvas
          ref={canvasRef}
          className="absolute cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      <div className="absolute bottom-4 left-4 right-4 bg-gray-800/80 backdrop-blur-md p-4 rounded-lg flex flex-col gap-4 text-white">
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-shrink-0">
                <p className="text-sm font-semibold mb-2 text-gray-300">Edit Mode</p>
                <div className="flex items-center gap-2">
                    <ModeButton label="Replace Region" isActive={editMode === 'replace'} onClick={() => setEditMode('replace')} />
                    <ModeButton label="Add Detail" isActive={editMode === 'add'} onClick={() => setEditMode('add')} />
                </div>
            </div>
            <div className="flex-grow">
                <p className="text-sm font-semibold mb-2 text-gray-300">Describe Your Edit</p>
                <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g., 'a gold zipper' or 'make this wood'"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
            </div>
        </div>
        <p className="text-xs text-center text-gray-400 h-4">{modeDescriptions[editMode]}</p>
        <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <label className="text-sm">Brush:</label>
                <input
                    type="range"
                    min="10"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-32"
                />
                <button onClick={handleClear} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 text-sm rounded-md transition-colors">Clear</button>
            </div>
          
            <div className="flex gap-2">
                <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">Cancel</button>
                <button onClick={handleConfirm} disabled={!editPrompt.trim()} className="bg-cyan-500 hover:bg-cyan-400 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Apply Edit
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
