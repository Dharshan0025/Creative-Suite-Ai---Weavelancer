import React, { useState, useEffect, useCallback } from 'react';
import { UploadIcon, MicIcon, SparklesIcon } from '../../components/icons';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { generateIdeaFromPrompt } from '../../services/geminiService';
import { GeneratedIdea, ImageFile, AppError } from '../../types';
import { ErrorDisplay } from '../../components/ErrorDisplay';

interface HomeProps {
    onIdeaGenerated: (idea: GeneratedIdea) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: AppError | null;
    setError: (error: AppError | null) => void;
    initialPrompt: string;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const Home: React.FC<HomeProps> = ({ onIdeaGenerated, isLoading, setIsLoading, error, setError, initialPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);

  const { text: voiceText, setText: setVoiceText, isListening, startListening, stopListening, error: speechError, hasRecognitionSupport } = useSpeechRecognition();
  
  useEffect(() => {
      if(initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);
  
  useEffect(() => {
    if (voiceText) {
      setPrompt(voiceText);
    }
  }, [voiceText]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setImageFile({
            base64,
            mimeType: file.type,
            name: file.name
        });
      } catch (error) {
        console.error("Error converting file to base64:", error);
        setError({ message: "Failed to process image file." });
      }
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError({ message: "Please enter a description or upload an image." });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const idea = await generateIdeaFromPrompt(prompt, imageFile);
      onIdeaGenerated(idea); // Callback to parent
    } catch (err: any) {
      setError({
        message: err.message,
        onRetry: handleGenerate
      });
    } finally {
      setIsLoading(false);
    }
  }, [prompt, imageFile, onIdeaGenerated, setIsLoading, setError]);
  
  const handleMicClick = () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
  }

  const clearInput = () => {
      setPrompt('');
      setImageFile(null);
      setError(null);
      setVoiceText('');
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
                 <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                    Describe Your Idea
                 </h1>
                 <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                    Use text, upload a sketch, or even describe it with your voice.
                 </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'a wooden chair that looks like a leaf', 'a minimalist wallet', or 'a sci-fi movie poster'..."
                        className="w-full h-32 p-4 pr-32 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-none"
                        disabled={isListening}
                    />
                     <div className="absolute top-3 right-3 flex items-center space-x-2">
                        <label htmlFor="image-upload" className="cursor-pointer p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors">
                            <UploadIcon className="h-6 w-6" />
                            <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        {hasRecognitionSupport && (
                            <button onClick={handleMicClick} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-indigo-600'}`}>
                                <MicIcon className="h-6 w-6" />
                            </button>
                        )}
                    </div>
                </div>

                {imageFile && (
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                       <div className="flex items-center">
                        <img src={`data:${imageFile.mimeType};base64,${imageFile.base64}`} alt="preview" className="h-12 w-12 rounded-md object-cover mr-3" />
                        <span className="text-sm text-gray-700 font-medium">{imageFile.name}</span>
                       </div>
                        <button onClick={() => setImageFile(null)} className="text-gray-500 hover:text-red-500 font-bold text-xl">&times;</button>
                    </div>
                )}
                 {(speechError || (hasRecognitionSupport && isListening)) && (
                    <p className={`mt-2 text-sm ${speechError ? 'text-red-500' : 'text-gray-500'}`}>
                        {speechError ? speechError : "Listening... Click the mic again to stop."}
                    </p>
                )}

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                    <button onClick={clearInput} className="text-sm text-gray-500 hover:text-gray-800">Clear</button>
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center shadow-lg disabled:bg-indigo-300 disabled:cursor-not-allowed">
                        <SparklesIcon className="mr-2 h-5 w-5" />
                        {isLoading ? 'Generating...' : 'Spark Idea'}
                    </button>
                </div>
            </div>

            {error && <ErrorDisplay message={error.message} onRetry={error.onRetry} />}

            {isLoading && (
                 <div className="mt-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">AI is thinking... this may take a moment.</p>
                 </div>
            )}
        </div>
    </div>
  );
};