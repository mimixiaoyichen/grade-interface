import React from 'react';
import { WizardStep } from '../types';

interface StepMeta {
  id: WizardStep;
  label: string;
}

interface StepIndicatorProps {
  steps: StepMeta[];
  currentStep: WizardStep;
  isStepAvailable: (id: WizardStep) => boolean;
  onStepSelect: (id: WizardStep) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, isStepAvailable, onStepSelect }) => {
  const currentIndex = Math.max(steps.findIndex((s) => s.id === currentStep), 0);

  return (
    <div className="flex justify-between items-center max-w-4xl mx-auto mb-8 relative">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
      {steps.map((item, idx) => {
        const isActive = idx === currentIndex;
        const isCompleted = currentIndex > idx;
        const available = isStepAvailable(item.id);
        const baseClasses = isActive
          ? 'bg-blue-600 text-white'
          : isCompleted
            ? 'bg-green-500 text-white'
            : available
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-300 text-gray-600';

        return (
          <button
            key={item.id}
            onClick={() => available && !isActive && onStepSelect(item.id)}
            className="flex flex-col items-center bg-gray-50 px-2 focus:outline-none"
            disabled={!available}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${baseClasses}`}>
              {isCompleted ? '✓' : idx + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-blue-600' : available ? 'text-blue-700' : 'text-gray-400'}`}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default StepIndicator;
