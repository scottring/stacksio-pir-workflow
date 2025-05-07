import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store';
import { PIR, PIRStatus, UserRole } from '../../types';

interface PIRFormProps {
  mode: 'create' | 'edit';
}

const PIRForm: React.FC<PIRFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    currentUser, 
    selectedPIR, 
    fetchPIRById, 
    createPIR, 
    updatePIR, 
    isLoading, 
    error,
    fetchTags,
    tags
  } = useStore();
  
  // Local form state
  const [formData, setFormData] = useState<Partial<PIR>>({
    title: '',
    description: '',
    productName: '',
    productCategory: '',
    status: PIRStatus.DRAFT,
    tags: [],
    questionIds: [],
    attachmentIds: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  // Load PIR data when editing
  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchPIRById(id);
    }
    
    fetchTags(); // Load available tags
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id]);
  
  // Set form data when selectedPIR changes
  useEffect(() => {
    if (mode === 'edit' && selectedPIR) {
      setFormData({
        title: selectedPIR.title,
        description: selectedPIR.description,
        productName: selectedPIR.productName,
        productCategory: selectedPIR.productCategory,
        status: selectedPIR.status,
        tags: [...selectedPIR.tags],
        questionIds: [...selectedPIR.questionIds],
        attachmentIds: [...selectedPIR.attachmentIds],
        comments: selectedPIR.comments
      });
    }
  }, [selectedPIR, mode]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle tag selection
  const handleTagSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTag(e.target.value);
  };
  
  // Add selected tag
  const addTag = () => {
    if (selectedTag && !formData.tags?.includes(selectedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), selectedTag]
      }));
      setSelectedTag('');
    }
  };
  
  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setFormError('You must be logged in to submit a PIR');
      return;
    }
    
    // Validate form
    if (!formData.title || !formData.description || !formData.productName || !formData.productCategory) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      if (mode === 'create') {
        // Create new PIR
        const newPIR: Omit<PIR, 'id'> = {
          ...formData as Required<Omit<PIR, 'id'>>,
          requesterName: currentUser.displayName,
          requesterId: currentUser.id,
          status: PIRStatus.DRAFT,
          createdAt: new Date(),
          updatedAt: new Date(),
          questionIds: formData.questionIds || [],
          attachmentIds: formData.attachmentIds || [],
          tags: formData.tags || []
        };
        
        const createdPIR = await createPIR(newPIR);
        navigate(`/pirs/${createdPIR.id}`);
      } else if (mode === 'edit' && id) {
        // Update existing PIR
        await updatePIR(id, {
          ...formData,
          updatedAt: new Date()
        });
        navigate(`/pirs/${id}`);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Check permissions
  const canEdit = (mode === 'create') || 
    (mode === 'edit' && selectedPIR && currentUser && (
      currentUser.role === UserRole.ADMIN ||
      (currentUser.id === selectedPIR.requesterId && selectedPIR.status === PIRStatus.DRAFT)
    ));
  
  if (mode === 'edit' && isLoading) {
    return <div>Loading PIR data...</div>;
  }
  
  if (mode === 'edit' && !selectedPIR) {
    return <div>No PIR found with ID: {id}</div>;
  }
  
  if (mode === 'edit' && !canEdit) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              You do not have permission to edit this PIR. Only the requester can edit draft PIRs.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {mode === 'create' ? 'Create New PIR' : 'Edit PIR'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'create' 
              ? 'Create a new Product Information Request' 
              : 'Edit the details of this Product Information Request'}
          </p>
        </div>
        
        <div className="mt-5 md:mt-0 md:col-span-2">
          {(error || formError) && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{formError || error}</div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 bg-white sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title || ''}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description || ''}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="productName"
                      id="productName"
                      value={formData.productName || ''}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700">
                      Product Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="productCategory"
                      id="productCategory"
                      value={formData.productCategory || ''}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="col-span-6">
                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                      Comments
                    </label>
                    <textarea
                      id="comments"
                      name="comments"
                      rows={3}
                      value={formData.comments || ''}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    ></textarea>
                  </div>
                  
                  {/* Tags Section */}
                  <div className="col-span-6">
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    
                    <div className="flex mb-2">
                      <select
                        id="tag-select"
                        value={selectedTag}
                        onChange={handleTagSelect}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select a tag to add</option>
                        {tags.map(tag => (
                          <option
                            key={tag.id}
                            value={tag.name}
                            disabled={formData.tags?.includes(tag.name)}
                          >
                            {tag.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addTag}
                        disabled={!selectedTag}
                        className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-400 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <span className="sr-only">Remove {tag}</span>
                            <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                              <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mr-2 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create PIR' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PIRForm;