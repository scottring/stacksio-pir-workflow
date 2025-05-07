// PIR State Management
import { StateCreator } from 'zustand';
import { PIR, PIRStatus } from '../types';
import * as pirRepository from '../integrations/firebase/repositories/pirRepository';

export interface PIRSlice {
  // State
  pirs: PIR[];
  selectedPIR: PIR | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPIRs: () => Promise<void>;
  fetchPIRsByStatus: (status: PIRStatus) => Promise<void>;
  fetchPIRsByRequesterId: (requesterId: string) => Promise<void>;
  fetchPIRsByResponderId: (responderId: string) => Promise<void>;
  fetchPIRsByReviewerId: (reviewerId: string) => Promise<void>;
  fetchPIRById: (id: string) => Promise<void>;
  createPIR: (pir: Omit<PIR, 'id'>) => Promise<PIR>;
  updatePIR: (id: string, updates: Partial<PIR>) => Promise<PIR>;
  updatePIRStatus: (id: string, status: PIRStatus, additionalData?: Partial<PIR>) => Promise<PIR>;
}

export const createPIRSlice: StateCreator<PIRSlice> = (set, get) => ({
  // Initial state
  pirs: [],
  selectedPIR: null,
  isLoading: false,
  error: null,
  
  // Fetch all PIRs
  fetchPIRs: async () => {
    set({ isLoading: true, error: null });
    try {
      const pirs = await pirRepository.getPIRs();
      set({ pirs, isLoading: false });
    } catch (error) {
      console.error('Error fetching PIRs:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch PIRs', 
        isLoading: false 
      });
    }
  },
  
  // Fetch PIRs by status
  fetchPIRsByStatus: async (status: PIRStatus) => {
    set({ isLoading: true, error: null });
    try {
      const pirs = await pirRepository.getPIRsByStatus(status);
      set({ pirs, isLoading: false });
    } catch (error) {
      console.error(`Error fetching PIRs with status ${status}:`, error);
      set({ 
        error: error instanceof Error ? error.message : `Failed to fetch PIRs with status ${status}`, 
        isLoading: false 
      });
    }
  },
  
  // Fetch PIRs by requester
  fetchPIRsByRequesterId: async (requesterId: string) => {
    set({ isLoading: true, error: null });
    try {
      const pirs = await pirRepository.getPIRsByRequesterId(requesterId);
      set({ pirs, isLoading: false });
    } catch (error) {
      console.error(`Error fetching PIRs for requester ${requesterId}:`, error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch PIRs for requester', 
        isLoading: false 
      });
    }
  },
  
  // Fetch PIRs by responder
  fetchPIRsByResponderId: async (responderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const pirs = await pirRepository.getPIRsByResponderId(responderId);
      set({ pirs, isLoading: false });
    } catch (error) {
      console.error(`Error fetching PIRs for responder ${responderId}:`, error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch PIRs for responder', 
        isLoading: false 
      });
    }
  },
  
  // Fetch PIRs by reviewer
  fetchPIRsByReviewerId: async (reviewerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const pirs = await pirRepository.getPIRsByReviewerId(reviewerId);
      set({ pirs, isLoading: false });
    } catch (error) {
      console.error(`Error fetching PIRs for reviewer ${reviewerId}:`, error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch PIRs for reviewer', 
        isLoading: false 
      });
    }
  },
  
  // Fetch a single PIR by ID
  fetchPIRById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const pir = await pirRepository.getPIRById(id);
      set({ selectedPIR: pir, isLoading: false });
    } catch (error) {
      console.error(`Error fetching PIR ${id}:`, error);
      set({ 
        error: error instanceof Error ? error.message : `Failed to fetch PIR ${id}`, 
        isLoading: false 
      });
    }
  },
  
  // Create a new PIR
  createPIR: async (pir: Omit<PIR, 'id'>) => {
    set({ isLoading: true, error: null });
    try {
      const newPIR = await pirRepository.createPIR(pir);
      set(state => ({
        pirs: [newPIR, ...state.pirs],
        selectedPIR: newPIR,
        isLoading: false
      }));
      return newPIR;
    } catch (error) {
      console.error('Error creating PIR:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create PIR', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Update an existing PIR
  updatePIR: async (id: string, updates: Partial<PIR>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPIR = await pirRepository.updatePIR(id, updates);
      set(state => ({
        pirs: state.pirs.map(p => p.id === id ? updatedPIR : p),
        selectedPIR: state.selectedPIR?.id === id ? updatedPIR : state.selectedPIR,
        isLoading: false
      }));
      return updatedPIR;
    } catch (error) {
      console.error(`Error updating PIR ${id}:`, error);
      set({ 
        error: error instanceof Error ? error.message : `Failed to update PIR ${id}`, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Update PIR status with timestamp tracking
  updatePIRStatus: async (id: string, status: PIRStatus, additionalData: Partial<PIR> = {}) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPIR = await pirRepository.updatePIRStatus(id, status, additionalData);
      set(state => ({
        pirs: state.pirs.map(p => p.id === id ? updatedPIR : p),
        selectedPIR: state.selectedPIR?.id === id ? updatedPIR : state.selectedPIR,
        isLoading: false
      }));
      return updatedPIR;
    } catch (error) {
      console.error(`Error updating PIR status ${id}:`, error);
      set({ 
        error: error instanceof Error ? error.message : `Failed to update PIR status ${id}`, 
        isLoading: false 
      });
      throw error;
    }
  }
});