import React from 'react';
import { motion } from 'framer-motion';

interface ChooserScreenProps {
  finalImageUrl: string;
  onSelectFitCheck: () => void;
  onSelectHomeCanvas: () => void;
}

export const ChooserScreen: React.FC<ChooserScreenProps> = ({ finalImageUrl, onSelectFitCheck, onSelectHomeCanvas }) => {
  const viewVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };
  
  return (
    <motion.div
      key="chooser"
      className="w-full max-w-4xl mx-auto text-center p-4"
      variants={viewVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
        Design Finalized!
      </h1>
      <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
        Your visual concept is ready. What would you like to do next?
      </p>

      <div className="mt-10 mb-8">
        <img src={finalImageUrl} alt="Finalized design" className="max-w-sm mx-auto rounded-lg shadow-2xl" />
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
        <button 
          onClick={onSelectFitCheck}
          className="group w-full sm:w-64 p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 text-left"
        >
          <h2 className="text-xl font-bold text-gray-800">Virtual Try-On</h2>
          <p className="text-gray-500 mt-2">Use your design as a garment and try it on with FitCheck.</p>
          <span className="inline-block mt-4 font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
            Continue &rarr;
          </span>
        </button>
        <button 
          onClick={onSelectHomeCanvas}
          className="group w-full sm:w-64 p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 text-left"
        >
          <h2 className="text-xl font-bold text-gray-800">Scene Composition</h2>
          <p className="text-gray-500 mt-2">Place your design into a realistic scene with Home Canvas.</p>
           <span className="inline-block mt-4 font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
            Continue &rarr;
          </span>
        </button>
      </div>
    </motion.div>
  );
};