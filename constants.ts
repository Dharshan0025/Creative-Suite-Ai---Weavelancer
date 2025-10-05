import { InspirationCardData, Style } from './types';

// --- Ideaspark Constants ---
export const INSPIRATION_DATA: InspirationCardData[] = [
  {
    id: 1,
    title: 'Kinetic Sculpture Clock',
    description: 'A wall clock where the hands are moving sculptures that change form throughout the day.',
    imageUrl: 'https://picsum.photos/seed/clock/500/300',
  },
  {
    id: 2,
    title: 'Modular Bookshelf System',
    description: 'Interlocking hexagonal shelves that can be arranged in endless configurations on a wall.',
    imageUrl: 'https://picsum.photos/seed/bookshelf/500/300',
  },
  {
    id: 3,
    title: 'Self-Watering Vertical Garden',
    description: 'A sleek, stackable indoor planter system with an integrated water reservoir for low-maintenance greenery.',
    imageUrl: 'https://picsum.photos/seed/garden/500/300',
  },
  {
    id: 4,
    title: 'Art Deco Inspired Teapot',
    description: 'A ceramic teapot with geometric patterns, gold accents, and a bold, angular handle.',
    imageUrl: 'https://picsum.photos/seed/teapot/500/300',
  },
  {
    id: 5,
    title: 'Origami-Style Folding Kayak',
    description: 'A lightweight, portable kayak that folds down into a suitcase-sized package.',
    imageUrl: 'https://picsum.photos/seed/kayak/500/300',
  },
  {
    id: 6,
    title: 'Steampunk Mechanical Keyboard',
    description: 'A keyboard with vintage typewriter keys, brass fittings, and exposed gears.',
    imageUrl: 'https://picsum.photos/seed/keyboard/500/300',
  },
];

// --- Workbench Constants ---
export const STYLES: Style[] = [
    { name: 'Photorealistic', prompt: 'ultra photorealistic, 8k, sharp focus, professional photograph', thumbnailUrl: 'https://picsum.photos/seed/photorealistic/200' },
    { name: 'Watercolor', prompt: 'vibrant watercolor painting, soft edges, splashes of color', thumbnailUrl: 'https://picsum.photos/seed/watercolor/200' },
    { name: 'Art Deco', prompt: 'Art Deco style, geometric patterns, gold and black, luxurious', thumbnailUrl: 'https://picsum.photos/seed/artdeco/200' },
    { name: 'Cyberpunk', prompt: 'cyberpunk style, neon lights, dystopian city, high-tech, gritty', thumbnailUrl: 'https://picsum.photos/seed/cyberpunk/200' },
];

export const VIEWER_ANGLES = ["Front", "3/4 View", "Side View", "Back View"];


// --- FitCheck Constants ---
export const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
];