import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Attachment } from '../../types';
import { formatFileSize } from '../../utils/formatters';

interface AttachmentSectionProps {
  parentId: string;
  parentType: 'pir' | 'question' | 'answer';
  attachmentIds: string[];
  canUpload: boolean;
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  parentId,
  parentType,
  attachmentIds,
  canUpload
}) => {
  const { 
    fetchAttachmentsByIds, 
    uploadAttachment, 
    deleteAttachment, 
    attachments, 
    isLoadingAttachments, 
    attachmentError,
    currentUser
  } = useStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [displayedAttachments, setDisplayedAttachments] = useState<Attachment[]>([]);
  
  // Fetch attachments when component mounts or attachmentIds change
  useEffect(() => {
    if (attachmentIds.length > 0) {
      fetchAttachmentsByIds(attachmentIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachmentIds]);
  
  // Filter attachments for this parent
  useEffect(() => {
    const filteredAttachments = attachments.filter(
      attachment => attachmentIds.includes(attachment.id)
    );
    setDisplayedAttachments(filteredAttachments);
  }, [attachments, attachmentIds]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!file || !currentUser) {
      setUploadError('No file selected or user is not logged in');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      await uploadAttachment(file, currentUser.id, parentId, parentType);
      // Reset file input
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle attachment deletion
  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else if (fileType.startsWith('application/pdf')) {
      return (
        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M8 10a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else if (
      fileType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
      fileType.startsWith('application/msword')
    ) {
      return (
        <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M8 10a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else if (
      fileType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml') ||
      fileType.startsWith('application/vnd.ms-excel')
    ) {
      return (
        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M8 10a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };
  
  return (
    <div className="px-4 py-4 sm:px-6">
      {/* Attachments list */}
      {isLoadingAttachments ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ) : attachmentError ? (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-red-700">{attachmentError}</div>
            </div>
          </div>
        </div>
      ) : displayedAttachments.length > 0 ? (
        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
          {displayedAttachments.map((attachment) => (
            <li key={attachment.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
              <div className="w-0 flex-1 flex items-center">
                {getFileIcon(attachment.fileType)}
                <span className="ml-2 flex-1 w-0 truncate">
                  {attachment.fileName}
                </span>
              </div>
              <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                <span className="text-gray-500">
                  {formatFileSize(attachment.fileSize)}
                </span>
                <a
                  href={attachment.downloadUrl}
                  download={attachment.fileName}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Download
                </a>
                {canUpload && (
                  <button
                    type="button"
                    onClick={() => handleDelete(attachment.id)}
                    className="font-medium text-red-600 hover:text-red-500"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">
          No attachments.
        </p>
      )}
      
      {/* File upload section */}
      {canUpload && (
        <div className="mt-4">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
            Upload a file
          </label>
          
          {uploadError && (
            <div className="mt-2 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-sm text-red-700">{uploadError}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-2 flex items-center">
            <div className="flex-1">
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
              >
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <span>
                        {file ? file.name : 'Upload a file'}
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, Word, Excel, Images, etc.
                    </p>
                  </div>
                </div>
              </label>
            </div>
            
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentSection;