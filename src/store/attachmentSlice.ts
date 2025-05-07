// Attachment State Management
import { StateCreator } from 'zustand';
import { Attachment } from '../types';
import * as attachmentRepository from '../integrations/firebase/repositories/attachmentRepository';

export interface AttachmentSlice {
  // State
  attachments: Attachment[];
  isLoadingAttachments: boolean;
  attachmentError: string | null;
  
  // Actions
  fetchAttachmentsByParentId: (
    parentId: string, 
    parentType: 'pir' | 'question' | 'answer'
  ) => Promise<void>;
  
  fetchAttachmentsByIds: (ids: string[]) => Promise<void>;
  
  uploadAttachment: (
    file: File, 
    uploadedBy: string, 
    parentId: string, 
    parentType: 'pir' | 'question' | 'answer'
  ) => Promise<Attachment>;
  
  deleteAttachment: (id: string) => Promise<void>;
  
  resetAttachmentState: () => void;
}

export const createAttachmentSlice: StateCreator<AttachmentSlice> = (set, get) => ({
  // Initial state
  attachments: [],
  isLoadingAttachments: false,
  attachmentError: null,
  
  // Fetch attachments for a parent (PIR, Question, or Answer)
  fetchAttachmentsByParentId: async (
    parentId: string, 
    parentType: 'pir' | 'question' | 'answer'
  ) => {
    set({ isLoadingAttachments: true, attachmentError: null });
    try {
      const attachments = await attachmentRepository.getAttachmentsByParentId(parentId, parentType);
      set({ attachments, isLoadingAttachments: false });
    } catch (error) {
      console.error(`Error fetching attachments for ${parentType} ${parentId}:`, error);
      set({ 
        attachmentError: error instanceof Error ? error.message : `Failed to fetch attachments`, 
        isLoadingAttachments: false 
      });
    }
  },
  
  // Fetch attachments by IDs
  fetchAttachmentsByIds: async (ids: string[]) => {
    if (!ids.length) {
      set({ attachments: [], isLoadingAttachments: false });
      return;
    }
    
    set({ isLoadingAttachments: true, attachmentError: null });
    try {
      const attachments = await attachmentRepository.getAttachmentsByIds(ids);
      set({ attachments, isLoadingAttachments: false });
    } catch (error) {
      console.error('Error fetching attachments by IDs:', error);
      set({ 
        attachmentError: error instanceof Error ? error.message : 'Failed to fetch attachments', 
        isLoadingAttachments: false 
      });
    }
  },
  
  // Upload a file and create an attachment
  uploadAttachment: async (
    file: File, 
    uploadedBy: string, 
    parentId: string, 
    parentType: 'pir' | 'question' | 'answer'
  ) => {
    set({ isLoadingAttachments: true, attachmentError: null });
    try {
      const newAttachment = await attachmentRepository.uploadAttachment(
        file, 
        uploadedBy, 
        parentId, 
        parentType
      );
      
      set(state => ({
        attachments: [...state.attachments, newAttachment],
        isLoadingAttachments: false
      }));
      
      return newAttachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      set({ 
        attachmentError: error instanceof Error ? error.message : 'Failed to upload attachment', 
        isLoadingAttachments: false 
      });
      throw error;
    }
  },
  
  // Delete an attachment
  deleteAttachment: async (id: string) => {
    set({ isLoadingAttachments: true, attachmentError: null });
    try {
      await attachmentRepository.deleteAttachment(id);
      set(state => ({
        attachments: state.attachments.filter(a => a.id !== id),
        isLoadingAttachments: false
      }));
    } catch (error) {
      console.error(`Error deleting attachment ${id}:`, error);
      set({ 
        attachmentError: error instanceof Error ? error.message : `Failed to delete attachment`, 
        isLoadingAttachments: false 
      });
      throw error;
    }
  },
  
  // Reset attachment state
  resetAttachmentState: () => {
    set({
      attachments: [],
      attachmentError: null
    });
  }
});