import React from 'react';
import { PIRStatus } from '../../types';

interface PIRStatusBadgeProps {
  status: PIRStatus;
  className?: string;
}

const PIRStatusBadge: React.FC<PIRStatusBadgeProps> = ({ status, className = '' }) => {
  // Define colors and styles for each status
  const getStatusStyles = (): { bgColor: string; textColor: string; label: string } => {
    switch (status) {
      case PIRStatus.DRAFT:
        return {
          bgColor: 'bg-gray-200',
          textColor: 'text-gray-800',
          label: 'Draft'
        };
      case PIRStatus.REQUESTED:
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          label: 'Requested'
        };
      case PIRStatus.SUBMITTED:
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          label: 'Submitted'
        };
      case PIRStatus.REVIEWED:
        return {
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          label: 'Reviewed'
        };
      case PIRStatus.ACCEPTED:
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          label: 'Accepted'
        };
      case PIRStatus.REJECTED:
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          label: 'Rejected'
        };
      default:
        return {
          bgColor: 'bg-gray-200',
          textColor: 'text-gray-800',
          label: 'Unknown'
        };
    }
  };

  const { bgColor, textColor, label } = getStatusStyles();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} ${className}`}
    >
      {label}
    </span>
  );
};

export default PIRStatusBadge;