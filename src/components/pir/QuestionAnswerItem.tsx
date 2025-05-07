import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Answer, Question } from '../../types';
import AnswerForm from './AnswerForm';
import AttachmentSection from '../attachment/AttachmentSection';
import { format } from 'date-fns';

interface QuestionAnswerItemProps {
  question: Question;
  canAnswer: boolean;
}

const QuestionAnswerItem: React.FC<QuestionAnswerItemProps> = ({ question, canAnswer }) => {
  const { 
    fetchAnswersByQuestionId, 
    answers, 
    isLoadingAnswers, 
    answerError,
    fetchAttachmentsByIds
  } = useStore();
  
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Answer[]>([]);
  
  useEffect(() => {
    // Load answers for this question
    fetchAnswersByQuestionId(question.id);
    
    // Load attachments for the question if any
    if (question.attachmentIds.length > 0) {
      fetchAttachmentsByIds(question.attachmentIds);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);
  
  // Filter answers for this question
  useEffect(() => {
    const filteredAnswers = answers.filter(answer => answer.questionId === question.id);
    setQuestionAnswers(filteredAnswers);
  }, [answers, question.id]);
  
  // Handle answer button click
  const handleAnswerClick = () => {
    setShowAnswerForm(!showAnswerForm);
  };
  
  return (
    <div className="bg-white overflow-hidden">
      <div className="px-4 py-4 sm:px-6">
        {/* Question header with category tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {question.category}
              </span>
              {question.required && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Required
                </span>
              )}
            </div>
            <div className="ml-4 text-xs text-gray-500">
              Asked on {format(question.createdAt, 'MMM d, yyyy')}
            </div>
          </div>
        </div>
        
        {/* Question text */}
        <div className="mt-2 text-base text-gray-900 font-medium">
          {question.text}
        </div>
        
        {/* Question attachments */}
        {question.attachmentIds.length > 0 && (
          <div className="mt-4">
            <AttachmentSection 
              parentId={question.id} 
              parentType="question" 
              attachmentIds={question.attachmentIds}
              canUpload={false}
            />
          </div>
        )}
        
        {/* Answers section */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {questionAnswers.length > 0 
              ? `Answers (${questionAnswers.length})` 
              : 'No answers yet'}
          </h4>
          
          {isLoadingAnswers ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : answerError ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-sm text-red-700">{answerError}</div>
                </div>
              </div>
            </div>
          ) : questionAnswers.length > 0 ? (
            <div className="space-y-4">
              {questionAnswers.map((answer) => (
                <div key={answer.id} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {answer.responderName}
                      </div>
                      <div className="ml-2 text-xs text-gray-500">
                        {format(answer.createdAt, 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-700">
                    {answer.text}
                  </div>
                  
                  {/* Answer attachments */}
                  {answer.attachmentIds.length > 0 && (
                    <div className="mt-4">
                      <AttachmentSection 
                        parentId={answer.id} 
                        parentType="answer" 
                        attachmentIds={answer.attachmentIds}
                        canUpload={false}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No answers have been provided yet.
            </div>
          )}
          
          {/* Answer form or button */}
          {canAnswer && (
            <div className="mt-4">
              {showAnswerForm ? (
                <AnswerForm 
                  questionId={question.id} 
                  pirId={question.pirId} 
                  onCancel={() => setShowAnswerForm(false)} 
                />
              ) : (
                <button
                  type="button"
                  onClick={handleAnswerClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {questionAnswers.length > 0 ? 'Add Another Answer' : 'Answer This Question'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionAnswerItem;