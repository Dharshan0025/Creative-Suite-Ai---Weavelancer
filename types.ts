// --- Generic & App Flow ---
export enum View {
  Home = 'HOME',
  Wizard = 'WIZARD',
  Inspiration = 'INSPIRATION',
}

export enum Stage {
  IDEASPARK,
  PREFLIGHT_CHECK,
  WORKBENCH,
  CHOOSER,
  FITCHECK,
  HOMECANVAS,
}

export interface AppError {
    message: string;
    onRetry?: () => void;
}

// --- Ideaspark Types ---
export interface GeneratedIdea {
  title: string;
  concept: string;
  keyFeatures: string[];
  styleAndAesthetics: string;
  suggestedMaterials: string[];
  targetAudience: string;
}

export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

export interface InspirationCardData {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

// --- Workbench Types ---
export interface DesignVersion {
  id: string;
  imageUrl: string;
  prompt: string;
  parentId: string | null;
}

export type ActiveTool = 'NONE' | 'MAGIC_EDIT';

export interface Style {
  name: string;
  prompt: string;
  thumbnailUrl: string;
}

// --- FitCheck Types ---
export interface WardrobeItem {
  id: string;
  name: string;
  type: 'top' | 'bottom' | 'outerwear' | 'accessory' | 'shoes';
  url: string;
}

export interface OutfitLayer {
  garment: WardrobeItem | null;
  poseImages: { [poseInstruction: string]: string };
}

// --- Home Canvas Types ---
export interface Product {
  id: number;
  name: string;
  imageUrl: string;
}