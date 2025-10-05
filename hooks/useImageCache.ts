import { useRef } from 'react';

/**
 * Provides a persistent, component-instance-specific cache Map.
 * Useful for storing data like generated image URLs to avoid re-fetching.
 * The cache persists across re-renders but is reset if the component unmounts.
 */
export const useImageCache = () => {
  const cache = useRef(new Map<string, string>());
  return cache.current;
};
