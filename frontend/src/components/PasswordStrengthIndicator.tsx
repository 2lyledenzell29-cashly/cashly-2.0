import React from 'react';
import { getPasswordStrength } from '@/utils/auth';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className = '',
}) => {
  const { score, label, color } = getPasswordStrength(password);

  if (!password) return null;

  const getBarWidth = () => {
    return `${(score / 6) * 100}%`;
  };

  const getBarColor = () => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">Password strength:</span>
        <span className={`text-sm font-medium ${color}`}>{label}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: getBarWidth() }}
        ></div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;