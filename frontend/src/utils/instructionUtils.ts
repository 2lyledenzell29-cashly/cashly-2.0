/**
 * Utility functions for managing instruction modal state
 */

const INSTRUCTION_STORAGE_KEY = 'cashly-instructions-shown';

export const instructionUtils = {
  /**
   * Check if user has seen instructions before
   */
  hasSeenInstructions: (): boolean => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(INSTRUCTION_STORAGE_KEY) === 'true';
  },

  /**
   * Mark instructions as seen
   */
  markInstructionsAsSeen: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(INSTRUCTION_STORAGE_KEY, 'true');
  },

  /**
   * Reset instruction state (for testing or admin purposes)
   */
  resetInstructionState: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(INSTRUCTION_STORAGE_KEY);
  },

  /**
   * Force show instructions on next app load
   */
  forceShowInstructions: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(INSTRUCTION_STORAGE_KEY);
    window.location.reload();
  }
};