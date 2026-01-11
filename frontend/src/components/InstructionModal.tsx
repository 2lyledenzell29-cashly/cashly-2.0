'use client';

import React, { useState, useEffect } from 'react';
import { instructionSteps, InstructionStep } from '@/data/instructionData';
import { instructionUtils } from '@/utils/instructionUtils';
import Button from './Button';

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  showOnFirstVisit?: boolean;
}

const InstructionModal: React.FC<InstructionModalProps> = ({
  isOpen,
  onClose,
  showOnFirstVisit = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      if (showOnFirstVisit) {
        instructionUtils.markInstructionsAsSeen();
      }
    }, 300);
  };

  const handleNext = () => {
    if (currentStep < instructionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const currentInstruction: InstructionStep = instructionSteps[currentStep];
  const isLastStep = currentStep === instructionSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentInstruction.header}
                </h2>
                <p className="text-sm text-gray-500">
                  Step {currentStep + 1} of {instructionSteps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-6 pt-4 flex-shrink-0">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / instructionSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Special layout for tall images (category and family wallets) */}
              {currentInstruction.image && (currentInstruction.image.includes('category.png') || currentInstruction.image.includes('Family Wallets.png')) ? (
                <div className="space-y-4">
                  {/* Image on top */}
                  <div className="flex items-center justify-center">
                    <div className="w-full max-w-lg">
                      <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 inline-block">
                        <img
                          src={currentInstruction.image}
                          alt={`${currentInstruction.header} illustration`}
                          className="max-w-full h-auto object-contain block"
                          style={{ maxHeight: '400px' }}
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300">
                                  <div class="text-center text-gray-500">
                                    <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p class="text-sm">Image not found</p>
                                    <p class="text-xs text-gray-400 mt-1">${currentInstruction.image}</p>
                                  </div>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Text below, centered */}
                  <div className="flex items-center justify-center min-h-[100px]">
                    <p className="text-gray-700 leading-relaxed text-base text-center max-w-lg">
                      {currentInstruction.body}
                    </p>
                  </div>
                </div>
              ) : (
                /* Default layout for other images */
                <div className={`${currentInstruction.image ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
                  {/* Text content */}
                  <div className={`${currentInstruction.image ? 'flex items-center' : 'text-center'}`}>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {currentInstruction.body}
                    </p>
                  </div>

                  {/* Image content */}
                  {currentInstruction.image && (
                    <div className="flex items-center justify-center">
                      <div className="w-full max-w-md">
                        <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 min-h-[250px] max-h-[500px] flex items-center justify-center">
                          <img
                            src={currentInstruction.image}
                            alt={`${currentInstruction.header} illustration`}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300">
                                    <div class="text-center text-gray-500">
                                      <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <p class="text-sm">Image not found</p>
                                      <p class="text-xs text-gray-400 mt-1">${currentInstruction.image}</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex space-x-2">
              {showOnFirstVisit && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="text-gray-600"
                >
                  Skip Tutorial
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleNext}
              >
                {isLastStep ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionModal;