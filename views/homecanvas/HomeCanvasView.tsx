import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { generateCompositeImage } from '../../services/geminiService';
import { Product } from '../../types';
import { ImageUploader } from './components/ImageUploader';
import { ObjectCard } from './components/ObjectCard';
import Spinner from '../../components/Spinner';
import { DebugModal } from './components/DebugModal';
import { TouchGhost } from './components/TouchGhost';
import { ChevronLeftIcon } from '../../components/icons';

const dataURLtoFile = async (dataurl: string, filename: string): Promise<File> => {
    const res = await fetch(dataurl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
}

const loadingMessages = [
    "Analyzing your product...",
    "Surveying the scene...",
    "Describing placement location with AI...",
    "Crafting the perfect composition prompt...",
    "Generating photorealistic options...",
    "Assembling the final scene..."
];

interface HomeCanvasViewProps {
    designImageUrl: string;
    onRequestRedesign: (imageUrl: string, onComplete: (newImageUrl: string) => void) => void;
    onBack?: () => void;
}

export const HomeCanvasView: React.FC<HomeCanvasViewProps> = ({ designImageUrl, onRequestRedesign, onBack }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [sceneImage, setSceneImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [persistedOrbPosition, setPersistedOrbPosition] = useState<{x: number, y: number} | null>(null);
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);
  const [debugPrompt, setDebugPrompt] = useState<string | null>(null);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);

  const [isTouchDragging, setIsTouchDragging] = useState<boolean>(false);
  const [touchGhostPosition, setTouchGhostPosition] = useState<{x: number, y: number} | null>(null);
  const [isHoveringDropZone, setIsHoveringDropZone] = useState<boolean>(false);
  const [touchOrbPosition, setTouchOrbPosition] = useState<{x: number, y: number} | null>(null);
  const sceneImgRef = useRef<HTMLImageElement>(null);
  
  const sceneImageUrl = sceneImage ? URL.createObjectURL(sceneImage) : null;
  
  useEffect(() => {
    if (designImageUrl && !selectedProduct) {
        const product: Product = {
            id: Date.now(),
            name: 'Your Generated Design',
            imageUrl: designImageUrl,
        };
        const initialize = async () => {
            const file = await dataURLtoFile(designImageUrl, 'design.png');
            setProductImageFile(file);
            setSelectedProduct(product);
        };
        initialize();
    }
  }, [designImageUrl, selectedProduct]);

  const handleProductDrop = useCallback(async (position: {x: number, y: number}, relativePosition: { xPercent: number; yPercent: number; }) => {
    if (!productImageFile || !sceneImage || !selectedProduct) {
      setError('An unexpected error occurred. Please try again.');
      return;
    }
    setPersistedOrbPosition(position);
    setIsLoading(true);
    setError(null);
    try {
      const { finalImageUrl, debugImageUrl, finalPrompt } = await generateCompositeImage(
        productImageFile, 
        selectedProduct.name,
        sceneImage,
        sceneImage.name,
        relativePosition
      );
      setDebugImageUrl(debugImageUrl);
      setDebugPrompt(finalPrompt);
      const newSceneFile = await dataURLtoFile(finalImageUrl, `generated-scene-${Date.now()}.jpeg`);
      setSceneImage(newSceneFile);

    } catch (err)
 {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the image. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setPersistedOrbPosition(null);
    }
  }, [productImageFile, sceneImage, selectedProduct]);


  const handleChangeScene = useCallback(() => {
    setSceneImage(null);
    setPersistedOrbPosition(null);
    setDebugImageUrl(null);
    setDebugPrompt(null);
  }, []);

  useEffect(() => {
    return () => {
        if (sceneImageUrl) URL.revokeObjectURL(sceneImageUrl);
    };
  }, [sceneImageUrl]);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
        setLoadingMessageIndex(0);
        interval = setInterval(() => {
            setLoadingMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
        }, 3000);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!selectedProduct) return;
    e.preventDefault();
    setIsTouchDragging(true);
    const touch = e.touches[0];
    setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchDragging) return;
      const touch = e.touches[0];
      setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });
      
      const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementUnderTouch?.closest<HTMLDivElement>('[data-dropzone-id="scene-uploader"]');

      if (dropZone) {
          const rect = dropZone.getBoundingClientRect();
          setTouchOrbPosition({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
          setIsHoveringDropZone(true);
      } else {
          setIsHoveringDropZone(false);
          setTouchOrbPosition(null);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTouchDragging) return;
      
      const touch = e.changedTouches[0];
      const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementUnderTouch?.closest<HTMLDivElement>('[data-dropzone-id="scene-uploader"]');

      if (dropZone && sceneImgRef.current) {
          const img = sceneImgRef.current;
          const containerRect = dropZone.getBoundingClientRect();
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
          const dropX = touch.clientX - containerRect.left;
          const dropY = touch.clientY - containerRect.top;
          const imageX = dropX - offsetX;
          const imageY = dropY - offsetY;
          
          if (!(imageX < 0 || imageX > renderedWidth || imageY < 0 || imageY > renderedHeight)) {
            const xPercent = (imageX / renderedWidth) * 100;
            const yPercent = (imageY / renderedHeight) * 100;
            
            handleProductDrop({ x: dropX, y: dropY }, { xPercent, yPercent });
          }
      }

      setIsTouchDragging(false);
      setTouchGhostPosition(null);
      setIsHoveringDropZone(false);
      setTouchOrbPosition(null);
    };

    if (isTouchDragging) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouchDragging, handleProductDrop]);
  
  const transparentDragImage = new Image();
  transparentDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  const handleRedesignRequest = () => {
    if (!selectedProduct) return;
    const onComplete = (newImageUrl: string) => {
        const updatedProduct = { ...selectedProduct, imageUrl: newImageUrl };
        setSelectedProduct(updatedProduct);
        dataURLtoFile(newImageUrl, 'design.png').then(setProductImageFile);
    };
    onRequestRedesign(selectedProduct.imageUrl, onComplete);
  };

  const viewVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      key="homecanvas"
      className="w-full flex flex-col"
      variants={viewVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
        <TouchGhost 
            imageUrl={isTouchDragging && selectedProduct ? selectedProduct.imageUrl : null} 
            position={touchGhostPosition}
        />
        <div className="text-center mb-8 px-4 relative">
             {onBack && (
                 <button 
                    onClick={onBack}
                    className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors"
                    aria-label="Go back"
                 >
                    <ChevronLeftIcon className="w-6 h-6" />
                    <span className="hidden md:inline">Back</span>
                 </button>
             )}
             <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                Home Canvas
             </h1>
             <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Place your product in a new scene. Upload a scene and drag your product onto it.
             </p>
        </div>

      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          <div className="md:col-span-1 flex flex-col">
            <h2 className="text-2xl font-extrabold text-center mb-5 text-zinc-800">Product</h2>
            <div className="flex-grow flex items-center justify-center">
              <div 
                  draggable={!!sceneImage}
                  onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
                  }}
                  onTouchStart={handleTouchStart}
                  className={sceneImage ? 'cursor-move w-full max-w-xs' : 'w-full max-w-xs'}
              >
                  {selectedProduct && (
                    <ObjectCard 
                      product={selectedProduct} 
                      isSelected={true}
                      onRedesign={handleRedesignRequest}
                    />
                  )}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 flex flex-col">
            <h2 className="text-2xl font-extrabold text-center mb-5 text-zinc-800">Scene</h2>
            <div className="flex-grow flex items-center justify-center">
              <ImageUploader 
                  ref={sceneImgRef}
                  id="scene-uploader" 
                  onFileSelect={setSceneImage} 
                  imageUrl={sceneImageUrl}
                  productName={selectedProduct?.name || 'scene'}
                  isDropZone={!!sceneImage && !isLoading}
                  onProductDrop={handleProductDrop}
                  persistedOrbPosition={persistedOrbPosition}
                  showDebugButton={!!debugImageUrl && !isLoading}
                  onDebugClick={() => setIsDebugModalOpen(true)}
                  isTouchHovering={isHoveringDropZone}
                  touchOrbPosition={touchOrbPosition}
              />
            </div>
            <div className="text-center mt-4">
              <div className="h-5 flex items-center justify-center">
                {sceneImage && !isLoading && (
                  <button
                      onClick={handleChangeScene}
                      className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                  >
                      Change Scene
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-10 min-h-[8rem] flex flex-col justify-center items-center">
           {isLoading ? (
             <div className="animate-fade-in">
                <Spinner />
                <p className="text-xl mt-4 text-zinc-600 transition-opacity duration-500">{loadingMessages[loadingMessageIndex]}</p>
             </div>
           ) : (
             <p className="text-zinc-500 animate-fade-in">
                {!sceneImage ? "Upload a scene to get started." : "Drag the product onto a location in the scene, or simply click where you want it."}
             </p>
           )}
        </div>
      </div>
      <DebugModal 
        isOpen={isDebugModalOpen} 
        onClose={() => setIsDebugModalOpen(false)}
        imageUrl={debugImageUrl}
        prompt={debugPrompt}
      />
    </motion.div>
  );
};