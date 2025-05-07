// Answer State Management
import { StateCreator } from 'zustand';
import { Answer } from '../types';
import * as answerRepository from '../integrations/firebase/repositories/answerRepository';

export interface AnswerSlice {
  // State
  answers: Answer[];
  selectedAnswer: Answer | null;
  isLoadingAnswers: boolean;
  answerError: string | null;
  
  // Actions
  fetchAnswersByQuestionId: (questionId: string) => Promise<void>;
  fetchAnswersByPIRId: (pirId: string) => Promise<void>;
  fetchAnswersByResponderId: (responderId: string) => Promise<void>;
  fetchAnswerById: (id: string) => Promise<void>;
  createAnswer: (answer: Omit<Answer, 'id'>) => Promise<Answer>;
  updateAnswer: (id: string, updates: Partial<Answer>) => Promise<Answer>;
  resetAnswerState: () => void;
}

export const createAnswerSlice: StateCreator<AnswerSlice> = (set, get) => ({
  // Initial state
  answers: [],
  selectedAnswer: null,
  isLoadingAnswers: false,
  answerError: null,
  
  // Fetch answers for a specific question
  fetchAnswersByQuestionId: async (questionId: string) => {
    set({ isLoadingAnswers: true, answerError: null });
    try {
      const answers = await answerRepository.getAnswersByQuestionId(questionId);
      set({ answers, isLoadingAnswers: false });
    } catch (error) {
      console.error(`Error fetching answers for question ${questionId}:`, error);
      set({ 
        answerError: error instanceof Error ? error.message : `Failed to fetch answers for question ${questionId}`, 
        isLoadingAnswers: false 
      });
    }
  },
  
  // Fetch answers for a specific PIR
  fetchAnswersByPIRId: async (pirId: string) => {
    set({ isLoadingAnswers: true, answerError: null });
    try {
      const answers = await answerRepository.getAnswersByPIRId(pirId);
      set({ answers, isLoadingAnswers: false });
    } catch (error) {
      console.error(`Error fetching answers for PIR ${pirId}:`, error);
      set({ 
        answerError: error instanceof Error ? error.message : `Failed to fetch answers for PIR ${pirId}`, 
        isLoadingAnswers: false 
      });
    }
  },
  
  // Fetch answers by responder
  fetchAnswersByResponderId: async (responderId: string) => {
    set({ isLoadingAnswers: true, answerError: null });
    try {
      const answers = await answerRepository.getAnswersByResponderId(responderId);
      set({ answers, isLoadingAnswers: false });
    } catch (error) {
      console.error(`Error fetching answers for responder ${responderId}:`, error);
      set({ 
        answerError: error instanceof Error ? error.message : `Failed to fetch answers for responder`, 
        isLoadingAnswers: false 
      });
    }
  },
  
  // Fetch a single answer by ID
  fetchAnswerById: async (id: string) => {
    set({ isLoadingAnswers: true, answerError: null });
    try {
      const answer = await answerRepository.getAnswerById(id);
      set({ selectedAnswer: answer, isLoadingAnswers: false });
    } catch (error) {
      console.error(`Error fetching answer ${id}:`, error);
      set({ 
        answerError: error instanceof Error ? error.message : `Failed to fetch answer ${id}`, 
        isLoadingAnswers: false 
      });
    }
  },
  
  // Create a new answer
  createAnswer: async (answer: Omit<Answer, 'id'>) => {
    set({ isLoadingAnswers: true, answerError: null });
    try {
      const newAnswer = await answerRepository.createAnswer(answer);
      set(state => ({
        answers: [newAnswer, ...state.answers],
        isLoadingAnswers: false
      }));
      return newAnswer;
    } catch (error) {
      console.error('Error creating answer:', error);
      set({ 
        answerError: error instanceof Error ? error.message : 'Failed to create answer', 
        isLoadingAnswers: false 
      });
      throw error;
    }
  },
  
  // Update an existing answer
  updateAnswer: async (id: string, updates: Partial<Answer>) => {
    set({ isLoadingAnswers: true, answerError: null });
    try {
      const updatedAnswer = await answerRepository.updateAnswer(id, updates);
      set(state => ({
        answers: state.answers.map(a => a.id === id ? updatedAnswer : a),
        selectedAnswer: state.selectedAnswer?.id === id ? updatedAnswer : state.selectedAnswer,
        isLoadingAnswers: false
      }));
      return updatedAnswer;
    } catch (error) {
      console.error(`Error updating answer ${id}:`, error);
      set({ 
        answerError: error instanceof Error ? error.message : `Failed to update answer ${id}`, 
        isLoadingAnswers: false 
      });
      throw error;
    }
  },
  
  // Reset answer state
  resetAnswerState: () => {
    set({
      answers: [],
      selectedAnswer: null,
      answerError: null
    });
  }
});