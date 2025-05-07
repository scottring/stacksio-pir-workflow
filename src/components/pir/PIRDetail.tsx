import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { PIR, PIRStatus, UserRole } from '../../types';
import PIRStatusBadge from './PIRStatusBadge';
import QuestionAnswerList from './QuestionAnswerList';
import AttachmentSection from '../attachment/AttachmentSection';

const PIRDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    selectedPIR, 
    fetchPIRById, 
    updatePIRStatus, 
    currentUser,
    isLoading,
    error,
    resetQuestionState,
    resetAttachmentState
  } = useStore();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset related states when component mounts or ID changes
    resetQuestionState();
    resetAttachmentState();
    
    // Fetch PIR data
    if (id) {
      fetchPIRById(id);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  
  // Handle status change
  const handleStatusChange = async (newStatus: PIRStatus) => {
    if (!id || !selectedPIR || !currentUser) return;
    
    setIsUpdating(true);
    setLocalError(null);
    
    try {
      const additionalData: Partial<PIR> = {};
      
      // Add user-specific data based on status
      switch (newStatus) {
        case PIRStatus.REVIEWED:
          additionalData.reviewerId = currentUser.id;
          additionalData.reviewerName = currentUser.displayName;
          break;
        case PIRStatus.ACCEPTED:
        case PIRStatus.REJECTED:
          // Only allow if the current user is the reviewer or an admin
          if (
            currentUser.role !== UserRole.ADMIN && 
            selectedPIR.reviewerId !== currentUser.id
          ) {
            throw new Error('You do not have permission to accept/reject this PIR');
          }
          break;
        default:
          break;
      }
      
      await updatePIRStatus(id, newStatus, additionalData);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle PIR edit
  const handleEdit = () => {
    if (id) {
      navigate(`/pirs/${id}/edit`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
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
            <h3 className="text-sm font-medium text-red-800">Error loading PIR details</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!selectedPIR) {
    return (
      <div className="rounded-md bg-gray-50 p-4 shadow">
        <p className="text-gray-700">No PIR found with ID: {id}</p>
        <button
          onClick={() => navigate('/pirs')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to PIR List
        </button>
      </div>
    );
  }
  
  // Determine available actions based on current status and user role
  const canEdit = currentUser && (
    currentUser.role === UserRole.ADMIN ||
    (currentUser.id === selectedPIR.requesterId && selectedPIR.status === PIRStatus.DRAFT)
  );
  
  const canRequest = currentUser && 
    selectedPIR.status === PIRStatus.DRAFT &&
    (currentUser.role === UserRole.ADMIN || currentUser.id === selectedPIR.requesterId);
  
  const canSubmit = currentUser && 
    selectedPIR.status === PIRStatus.REQUESTED &&
    (currentUser.role === UserRole.ADMIN || currentUser.id === selectedPIR.assignedResponderId);
    
  const canReview = currentUser && 
    selectedPIR.status === PIRStatus.SUBMITTED &&
    (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REVIEWER);
    
  const canAcceptReject = currentUser && 
    selectedPIR.status === PIRStatus.REVIEWED &&
    (currentUser.role === UserRole.ADMIN || currentUser.id === selectedPIR.reviewerId);
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* Header with PIR Title and Status */}
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{selectedPIR.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {selectedPIR.productCategory} • {selectedPIR.productName}
          </p>
        </div>
        <PIRStatusBadge status={selectedPIR.status} className="ml-2" />
      </div>
      
      {/* Error message if there was a local error */}
      {localError && (
        <div className="mx-4 my-2 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-red-700">{localError}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* PIR Details */}
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {selectedPIR.description}
            </dd>
          </div>
          
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Requester</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {selectedPIR.requesterName}
            </dd>
          </div>
          
          {selectedPIR.assignedResponderName && (
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Assigned Responder</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {selectedPIR.assignedResponderName}
              </dd>
            </div>
          )}
          
          {selectedPIR.reviewerName && (
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Reviewer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {selectedPIR.reviewerName}
              </dd>
            </div>
          )}
          
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {format(selectedPIR.createdAt, 'PPpp')}
            </dd>
          </div>
          
          {selectedPIR.submittedAt && (
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Submitted</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {format(selectedPIR.submittedAt, 'PPpp')}
              </dd>
            </div>
          )}
          
          {selectedPIR.reviewedAt && (
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Reviewed</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {format(selectedPIR.reviewedAt, 'PPpp')}
              </dd>
            </div>
          )}
          
          {selectedPIR.acceptedAt && (
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Accepted</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {format(selectedPIR.acceptedAt, 'PPpp')}
              </dd>
            </div>
          )}
          
          {selectedPIR.rejectedAt && (
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rejected</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {format(selectedPIR.rejectedAt, 'PPpp')}
              </dd>
            </div>
          )}
          
          {selectedPIR.tags.length > 0 && (
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tags</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <div className="flex flex-wrap gap-2">
                  {selectedPIR.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          )}
          
          {selectedPIR.comments && (
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Comments</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {selectedPIR.comments}
              </dd>
            </div>
          )}
          
          {selectedPIR.reviewNotes && (
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Review Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {selectedPIR.reviewNotes}
              </dd>
            </div>
          )}
        </dl>
      </div>
      
      {/* PIR Attachments */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md mt-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Attachments</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Documents attached to this PIR
          </p>
        </div>
        <AttachmentSection 
          parentId={selectedPIR.id} 
          parentType="pir" 
          attachmentIds={selectedPIR.attachmentIds}
          canUpload={canEdit}
        />
      </div>
      
      {/* Questions and Answers */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md mt-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Questions & Answers</h3>
        </div>
        <QuestionAnswerList 
          pirId={selectedPIR.id} 
          canAddQuestions={canEdit}
          canAnswerQuestions={canSubmit || selectedPIR.status === PIRStatus.SUBMITTED}
        />
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3 px-4 py-4 sm:px-6">
        <button
          onClick={() => navigate('/pirs')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back
        </button>
        
        {canEdit && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit
          </button>
        )}
        
        {canRequest && (
          <button
            onClick={() => handleStatusChange(PIRStatus.REQUESTED)}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isUpdating ? 'Processing...' : 'Request Information'}
          </button>
        )}
        
        {canSubmit && (
          <button
            onClick={() => handleStatusChange(PIRStatus.SUBMITTED)}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
          >
            {isUpdating ? 'Processing...' : 'Submit for Review'}
          </button>
        )}
        
        {canReview && (
          <button
            onClick={() => handleStatusChange(PIRStatus.REVIEWED)}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isUpdating ? 'Processing...' : 'Mark as Reviewed'}
          </button>
        )}
        
        {canAcceptReject && (
          <>
            <button
              onClick={() => handleStatusChange(PIRStatus.REJECTED)}
              disabled={isUpdating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isUpdating ? 'Processing...' : 'Reject'}
            </button>
            
            <button
              onClick={() => handleStatusChange(PIRStatus.ACCEPTED)}
              disabled={isUpdating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isUpdating ? 'Processing...' : 'Accept'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PIRDetail;