import React, { useCallback, useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { UploadIcon } from '../../../components/icons';

interface ImageUploaderProps {
  id: string;
  label?: string;
  onFileSelect: (file: File) => void;
  imageUrl: string | null;
  isDropZone?: boolean;
  onProductDrop?: (position: {x: number, y: number}, relativePosition: { xPercent: number; yPercent: number; }) => void;
  persistedOrbPosition?: { x: number; y: number } | null;
  showDebugButton?: boolean;
  onDebugClick?: () => void;
  isTouchHovering?: boolean;
  touchOrbPosition?: { x: number; y: number } | null;
}

const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);


export const ImageUploader = forwardRef<HTMLImageElement, ImageUploaderProps>(({ id, label, onFileSelect, imageUrl, isDropZone = false, onProductDrop, persistedOrbPosition, showDebugButton, onDebugClick, isTouchHovering = false, touchOrbPosition = null }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [orbPosition, setOrbPosition] = useState<{x: number, y: number} | null>(null);
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);

  useImperativeHandle(ref, () => imgRef.current as HTMLImageElement);
  
  useEffect(() => {
    if (!imageUrl) {
      setFileTypeError(null);
    }
  }, [imageUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setFileTypeError('For best results, please use PNG, JPG, or JPEG formats.');
      } else {
        setFileTypeError(null);
      }
      onFileSelect(file);
    }
  };
  
  const handlePlacement = useCallback((clientX: number, clientY: number, currentTarget: HTMLDivElement) => {
    const img = imgRef.current;
    if (!img || !onProductDrop) return;

    const containerRect = currentTarget.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = img;
    const { width: containerWidth, height: containerHeight } = containerRect;

    const imageAspectRatio = naturalWidth / naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let renderedWidth, renderedHeight;
    if (imageAspectRatio > containerAspectRatio) {
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / imageAspectRatio;
    } else {
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * imageAspectRatio;
    }
    
    const offsetX = (containerWidth - renderedWidth) / 2;
    const offsetY = (containerHeight - renderedHeight) / 2;
    const pointX = clientX - containerRect.left;
    const pointY = clientY - containerRect.top;
    const imageX = pointX - offsetX;
    const imageY = pointY - offsetY;

    if (imageX < 0 || imageX > renderedWidth || imageY < 0 || imageY > renderedHeight) {
      console.warn("Action was outside the image boundaries.");
      return;
    }

    const xPercent = (imageX / renderedWidth) * 100;
    const yPercent = (imageY / renderedHeight) * 100;

    onProductDrop({ x: pointX, y: pointY }, { xPercent, yPercent });
  }, [onProductDrop]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDropZone && onProductDrop) {
      handlePlacement(event.clientX, event.clientY, event.currentTarget);
    } else {
      inputRef.current?.click();
    }
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(true);
      if (isDropZone && onProductDrop) {
          const rect = event.currentTarget.getBoundingClientRect();
          setOrbPosition({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
          });
      }
  }, [isDropZone, onProductDrop]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      setOrbPosition(null);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      setOrbPosition(null);

      if (isDropZone && onProductDrop) {
          handlePlacement(event.clientX, event.clientY, event.currentTarget);
      } else {
          const file = event.dataTransfer.files?.[0];
          if (file && file.type.startsWith('image/')) {
              const allowedTypes = ['image/jpeg', 'image/png'];
              if (!allowedTypes.includes(file.type)) {
                  setFileTypeError('For best results, please use PNG, JPG, or JPEG formats.');
              } else {
                  setFileTypeError(null);
              }
              onFileSelect(file);
          }
      }
  }, [isDropZone, onProductDrop, onFileSelect, handlePlacement]);
  
  const showHoverState = isDraggingOver || isTouchHovering;
  const currentOrbPosition = orbPosition || touchOrbPosition;
  const isActionable = isDropZone || !imageUrl;

  const uploaderClasses = `w-full aspect-video bg-zinc-100 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
      showHoverState ? 'border-blue-500 bg-blue-50'
    : isDropZone ? 'border-zinc-400 cursor-crosshair'
    : 'border-zinc-300 hover:border-blue-500 cursor-pointer'
  } ${!isActionable ? 'cursor-default' : ''}`;

  return (
    <div className="flex flex-col items-center w-full">
      {label && <h3 className="text-xl font-semibold mb-4 text-zinc-700">{label}</h3>}
      <div
        className={uploaderClasses}
        onClick={isActionable ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-dropzone-id={id}
      >
        <input
          type="file"
          id={id}
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg"
          className="hidden"
        />
        {imageUrl ? (
          <>
            <img 
              ref={imgRef}
              src={imageUrl} 
              alt={label || 'Uploaded Scene'} 
              className="w-full h-full object-contain" 
            />
            {showHoverState && currentOrbPosition && (
              <div 
                  className="absolute w-8 h-8 bg-blue-500/50 rounded-full border-2 border-white pointer-events-none transition-transform duration-75" 
                  style={{ 
                      left: currentOrbPosition.x, 
                      top: currentOrbPosition.y,
                      transform: 'translate(-50%, -50%)',
                  }}
              />
            )}
            {persistedOrbPosition && (
                <div 
                    className="absolute w-8 h-8 bg-blue-500/50 rounded-full border-2 border-white" 
                    style={{ 
                        left: persistedOrbPosition.x, 
                        top: persistedOrbPosition.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            )}
            {showDebugButton && onDebugClick && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDebugClick();
                    }}
                    className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-opacity-80 transition-all z-20 shadow-lg"
                    aria-label="Show debug view"
                >
                    Debug
                </button>
            )}
          </>
        ) : (
          <div className="text-center text-zinc-500 p-4">
            <UploadIcon className="h-12 w-12 text-zinc-500 mx-auto mb-2" />
            <p>Click to upload or drag & drop</p>
          </div>
        )}
      </div>
      {fileTypeError && (
        <div className="w-full mt-2 text-sm text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex items-center animate-fade-in" role="alert">
            <WarningIcon />
            <span>{fileTypeError}</span>
        </div>
      )}
    </div>
  );
});
