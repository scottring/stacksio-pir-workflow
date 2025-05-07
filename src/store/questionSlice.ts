// Question State Management
import { StateCreator } from 'zustand';
import { Question } from '../types';
import * as questionRepository from '../integrations/firebase/repositories/questionRepository';

export interface QuestionSlice {
  // State
  questions: Question[];
  selectedQuestion: Question | null;
  isLoadingQuestions: boolean;
  questionError: string | null;
  
  // Actions
  fetchQuestionsByPIRId: (pirId: string) => Promise<void>;
  fetchQuestionById: (id: string) => Promise<void>;
  createQuestion: (question: Omit<Question, 'id'>) => Promise<Question>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<Question>;
  createMultipleQuestions: (questions: Array<Omit<Question, 'id'>>) => Promise<Question[]>;
  resetQuestionState: () => void;
}

export const createQuestionSlice: StateCreator<QuestionSlice> = (set, get) => ({
  // Initial state
  questions: [],
  selectedQuestion: null,
  isLoadingQuestions: false,
  questionError: null,
  
  // Fetch questions for a specific PIR
  fetchQuestionsByPIRId: async (pirId: string) => {
    set({ isLoadingQuestions: true, questionError: null });
    try {
      const questions = await questionRepository.getQuestionsByPIRId(pirId);
      set({ questions, isLoadingQuestions: false });
    } catch (error) {
      console.error(`Error fetching questions for PIR ${pirId}:`, error);
      set({ 
        questionError: error instanceof Error ? error.message : `Failed to fetch questions for PIR ${pirId}`, 
        isLoadingQuestions: false 
      });
    }
  },
  
  // Fetch a single question by ID
  fetchQuestionById: async (id: string) => {
    set({ isLoadingQuestions: true, questionError: null });
    try {
      const question = await questionRepository.getQuestionById(id);
      set({ selectedQuestion: question, isLoadingQuestions: false });
    } catch (error) {
      console.error(`Error fetching question ${id}:`, error);
      set({ 
        questionError: error instanceof Error ? error.message : `Failed to fetch question ${id}`, 
        isLoadingQuestions: false 
      });
    }
  },
  
  // Create a new question
  createQuestion: async (question: Omit<Question, 'id'>) => {
    set({ isLoadingQuestions: true, questionError: null });
    try {
      const newQuestion = await questionRepository.createQuestion(question);
      set(state => ({
        questions: [...state.questions, newQuestion],
        isLoadingQuestions: false
      }));
      return newQuestion;
    } catch (error) {
      console.error('Error creating question:', error);
      set({ 
        questionError: error instanceof Error ? error.message : 'Failed to create question', 
        isLoadingQuestions: false 
      });
      throw error;
    }
  },
  
  // Update an existing question
  updateQuestion: async (id: string, updates: Partial<Question>) => {
    set({ isLoadingQuestions: true, questionError: null });
    try {
      const updatedQuestion = await questionRepository.updateQuestion(id, updates);
      set(state => ({
        questions: state.questions.map(q => q.id === id ? updatedQuestion : q),
        selectedQuestion: state.selectedQuestion?.id === id ? updatedQuestion : state.selectedQuestion,
        isLoadingQuestions: false
      }));
      return updatedQuestion;
    } catch (error) {
      console.error(`Error updating question ${id}:`, error);
      set({ 
        questionError: error instanceof Error ? error.message : `Failed to update question ${id}`, 
        isLoadingQuestions: false 
      });
      throw error;
    }
  },
  
  // Create multiple questions at once
  createMultipleQuestions: async (questions: Array<Omit<Question, 'id'>>) => {
    set({ isLoadingQuestions: true, questionError: null });
    try {
      const newQuestions = await questionRepository.createMultipleQuestions(questions);
      set(state => ({
        questions: [...state.questions, ...newQuestions],
        isLoadingQuestions: false
      }));
      return newQuestions;
    } catch (error) {
      console.error('Error creating multiple questions:', error);
      set({ 
        questionError: error instanceof Error ? error.message : 'Failed to create multiple questions', 
        isLoadingQuestions: false 
      });
      throw error;
    }
  },
  
  // Reset question state
  resetQuestionState: () => {
    set({
      questions: [],
      selectedQuestion: null,
      questionError: null
    });
  }
});