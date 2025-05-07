import React, { useState } from 'react';
import { useStore } from '../../store';
import { Answer } from '../../types';

interface AnswerFormProps {
  questionId: string;
  pirId: string;
  onCancel: () => void;
}

const AnswerForm: React.FC<AnswerFormProps> = ({ questionId, pirId, onCancel }) => {
  const { createAnswer, currentUser, isLoadingAnswers } = useStore();
  
  const [text, setText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setFormError('You must be logged in to submit an answer');
      return;
    }
    
    if (!text.trim()) {
      setFormError('Answer text cannot be empty');
      return;
    }
    
    try {
      // Create the answer
      const newAnswer: Omit<Answer, 'id'> = {
        questionId,
        pirId,
        text,
        responderId: currentUser.id,
        responderName: currentUser.displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
        attachmentIds: []
      };
      
      await createAnswer(newAnswer);
      
      // Reset form and close
      setText('');
      onCancel();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md">
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        Your Answer
      </h4>
      
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
      
      <div className="mb-4">
        <textarea
          rows={4}
          value={text}
          onChange={handleTextChange}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Type your answer here..."
          required
        />
      </div>
      
      {/* Future enhancement: Add attachment upload functionality here */}
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoadingAnswers}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoadingAnswers ? 'Submitting...' : 'Submit Answer'}
        </button>
      </div>
    </form>
  );
};

export default AnswerForm;