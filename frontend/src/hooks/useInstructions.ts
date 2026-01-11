import { useState, useEffect } from 'react';
import { instructionUtils } from '@/utils/instructionUtils';

export const useInstructions = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if instructions have been shown before
    if (!instructionUtils.hasSeenInstructions()) {
      // Small delay to ensure the app has loaded
      const timer = setTimeout(() => {
        setShowInstructions(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const openInstructions = () => {
    setShowInstructions(true);
  };

  const closeInstructions = () => {
    setShowInstructions(false);
  };

  return {
    showInstructions,
    openInstructions,
    closeInstructions
  };
};