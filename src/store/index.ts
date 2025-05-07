// Main store configuration
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createPIRSlice, PIRSlice } from './pirSlice';
import { createQuestionSlice, QuestionSlice } from './questionSlice';
import { createAnswerSlice, AnswerSlice } from './answerSlice';
import { createTagSlice, TagSlice } from './tagSlice';
import { createUserSlice, UserSlice } from './userSlice';
import { createAttachmentSlice, AttachmentSlice } from './attachmentSlice';

// Define the complete store shape
export type StoreState = PIRSlice & 
  QuestionSlice & 
  AnswerSlice & 
  TagSlice & 
  UserSlice & 
  AttachmentSlice;

// Create the combined store
export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // Combine all slices
        ...createPIRSlice(set, get, api),
        ...createQuestionSlice(set, get, api),
        ...createAnswerSlice(set, get, api),
        ...createTagSlice(set, get, api),
        ...createUserSlice(set, get, api),
        ...createAttachmentSlice(set, get, api),
      }),
      {
        name: 'stacksio-storage',
        // Only persist user authentication state
        partialize: (state) => ({ 
          currentUser: state.currentUser,
        }),
      }
    )
  )
);