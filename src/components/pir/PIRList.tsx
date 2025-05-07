import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { PIR, PIRStatus, UserRole } from '../../types';
import PIRStatusBadge from './PIRStatusBadge';
import { format } from 'date-fns';

interface PIRListProps {
  title?: string;
  emptyMessage?: string;
  filterStatus?: PIRStatus;
  maxItems?: number;
}

const PIRList: React.FC<PIRListProps> = ({
  title = 'Product Information Requests',
  emptyMessage = 'No PIRs found',
  filterStatus,
  maxItems
}) => {
  const navigate = useNavigate();
  const { pirs, fetchPIRs, fetchPIRsByStatus, isLoading, error, currentUser } = useStore();
  const [filteredPIRs, setFilteredPIRs] = useState<PIR[]>([]);
  
  useEffect(() => {
    // Load PIRs based on filter
    if (filterStatus) {
      fetchPIRsByStatus(filterStatus);
    } else {
      fetchPIRs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);
  
  useEffect(() => {
    // Apply filter and limit
    let result = [...pirs];
    
    // If there's a role-based filter needed
    if (currentUser) {
      switch (currentUser.role) {
        case UserRole.REQUESTER:
          // Requesters can see all their own PIRs
          result = result.filter(pir => pir.requesterId === currentUser.id);
          break;
        case UserRole.RESPONDER:
          // Responders can see PIRs assigned to them
          result = result.filter(pir => pir.assignedResponderId === currentUser.id);
          break;
        case UserRole.REVIEWER:
          // Reviewers can see submitted PIRs or those assigned to them
          result = result.filter(pir => 
            pir.reviewerId === currentUser.id || 
            pir.status === PIRStatus.SUBMITTED
          );
          break;
        case UserRole.ADMIN:
          // Admins can see everything - no filter
          break;
        default:
          break;
      }
    }
    
    // Apply maximum items limit
    if (maxItems && result.length > maxItems) {
      result = result.slice(0, maxItems);
    }
    
    setFilteredPIRs(result);
  }, [pirs, currentUser, maxItems]);
  
  // Handler for clicking on a PIR
  const handlePIRClick = (pirId: string) => {
    navigate(`/pirs/${pirId}`);
  };
  
  if (isLoading) {
    return (
      <div className="rounded-md bg-white p-4 shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 shadow">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading PIRs</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        {maxItems && filteredPIRs.length === maxItems && (
          <button 
            onClick={() => navigate('/pirs')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all
          </button>
        )}
      </div>
      
      {filteredPIRs.length === 0 ? (
        <div className="text-center py-8 px-4 sm:px-6">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {filteredPIRs.map((pir) => (
            <li key={pir.id}>
              <div 
                className="block hover:bg-gray-50 cursor-pointer"
                onClick={() => handlePIRClick(pir.id)}
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <div className="flex text-sm">
                        <p className="font-medium text-indigo-600 truncate">{pir.title}</p>
                      </div>
                      <div className="mt-1 flex text-xs text-gray-500">
                        <p className="truncate">{pir.productName}</p>
                        <p className="ml-1 flex-shrink-0">
                          <span className="mx-1">•</span>
                          {pir.requesterName}
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <PIRStatusBadge status={pir.status} />
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="flex space-x-2">
                      {pir.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                      {pir.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          +{pir.tags.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-xs text-gray-500 sm:mt-0">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>
                        Created on <time dateTime={pir.createdAt.toISOString()}>
                          {format(pir.createdAt, 'MMM d, yyyy')}
                        </time>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PIRList;