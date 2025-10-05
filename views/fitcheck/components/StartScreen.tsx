import React, { useState, useCallback } from 'react';
import { generateModelImage } from '../../../services/geminiService';
import Spinner from '../../../components/Spinner';

interface StartScreenProps {
  onModelFinalized: (url: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!imageFile) {
      setError('Please select an image file first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const modelImageUrl = await generateModelImage(imageFile);
      onModelFinalized(modelImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, onModelFinalized]);

  if (isLoading) {
    return (
      <div className="text-center p-8 w-full max-w-md">
        <Spinner />
        <p className="text-lg font-serif text-gray-700 mt-6">Creating your model...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a minute. The AI is preparing a professional shot for your try-on session.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold font-serif tracking-wide text-gray-800">Create Your Model</h1>
        <p className="text-gray-500 mt-2">Upload a full-body photo of yourself to begin.</p>
      </div>
      
      <div className="mt-6">
        <label
          htmlFor="file-upload"
          className="relative block w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="mt-2 text-sm">Click to upload an image</p>
            </div>
          )}
          <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={!imageFile || isLoading}
          className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate Model'}
        </button>
      </div>
    </div>
  );
};
