import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Question } from '../../types';
import QuestionAnswerItem from './QuestionAnswerItem';

interface QuestionAnswerListProps {
  pirId: string;
  canAddQuestions: boolean;
  canAnswerQuestions: boolean;
}

const QuestionAnswerList: React.FC<QuestionAnswerListProps> = ({ 
  pirId, 
  canAddQuestions, 
  canAnswerQuestions 
}) => {
  const { 
    questions, 
    fetchQuestionsByPIRId, 
    createQuestion, 
    isLoadingQuestions, 
    questionError,
    currentUser
  } = useStore();
  
  const [newQuestion, setNewQuestion] = useState<Partial<Omit<Question, 'id'>>>({
    text: '',
    category: '',
    required: true
  });
  
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  useEffect(() => {
    // Load questions when component mounts or pirId changes
    fetchQuestionsByPIRId(pirId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pirId]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'required') {
      setNewQuestion(prev => ({ ...prev, required: value === 'true' }));
    } else {
      setNewQuestion(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle question submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setFormError('You must be logged in to add a question');
      return;
    }
    
    // Validate form
    if (!newQuestion.text || !newQuestion.category) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Create the new question
      await createQuestion({
        pirId,
        text: newQuestion.text,
        category: newQuestion.category,
        required: newQuestion.required ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser.id,
        attachmentIds: []
      });
      
      // Reset form
      setNewQuestion({
        text: '',
        category: '',
        required: true
      });
      
      // Hide the form
      setShowQuestionForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state
  if (isLoadingQuestions) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-2">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (questionError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading questions</h3>
            <div className="mt-2 text-sm text-red-700">{questionError}</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-200">
      {/* Questions and Answers List */}
      {questions.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No questions have been added to this PIR yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {questions.map((question) => (
            <li key={question.id} className="p-4">
              <QuestionAnswerItem 
                question={question} 
                canAnswer={canAnswerQuestions} 
              />
            </li>
          ))}
        </ul>
      )}
      
      {/* Add Question Button */}
      {canAddQuestions && !showQuestionForm && (
        <div className="p-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowQuestionForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Question
          </button>
        </div>
      )}
      
      {/* Add Question Form */}
      {canAddQuestions && showQuestionForm && (
        <div className="p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Add New Question</h4>
          
          {formError && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-sm text-red-700">{formError}</div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="text" className="block text-sm font-medium text-gray-700">
                  Question <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="text"
                    name="text"
                    rows={3}
                    value={newQuestion.text || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={newQuestion.category || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="required" className="block text-sm font-medium text-gray-700">
                  Required
                </label>
                <div className="mt-1">
                  <select
                    id="required"
                    name="required"
                    value={newQuestion.required ? 'true' : 'false'}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowQuestionForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default QuestionAnswerList;