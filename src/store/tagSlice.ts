// Tag State Management
import { StateCreator } from 'zustand';
import { Tag } from '../types';
import * as tagRepository from '../integrations/firebase/repositories/tagRepository';

export interface TagSlice {
  // State
  tags: Tag[];
  isLoadingTags: boolean;
  tagError: string | null;
  
  // Actions
  fetchAllTags: () => Promise<void>;
  fetchTagsByCategory: (category: string) => Promise<void>;
  createTag: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  searchTags: (searchTerm: string) => Promise<void>;
}

export const createTagSlice: StateCreator<TagSlice> = (set, get) => ({
  // Initial state
  tags: [],
  isLoadingTags: false,
  tagError: null,
  
  // Fetch all tags
  fetchAllTags: async () => {
    set({ isLoadingTags: true, tagError: null });
    try {
      const tags = await tagRepository.getAllTags();
      set({ tags, isLoadingTags: false });
    } catch (error) {
      console.error('Error fetching tags:', error);
      set({ 
        tagError: error instanceof Error ? error.message : 'Failed to fetch tags', 
        isLoadingTags: false 
      });
    }
  },
  
  // Fetch tags by category
  fetchTagsByCategory: async (category: string) => {
    set({ isLoadingTags: true, tagError: null });
    try {
      const tags = await tagRepository.getTagsByCategory(category);
      set({ tags, isLoadingTags: false });
    } catch (error) {
      console.error(`Error fetching tags for category ${category}:`, error);
      set({ 
        tagError: error instanceof Error ? error.message : `Failed to fetch tags for category ${category}`, 
        isLoadingTags: false 
      });
    }
  },
  
  // Create a new tag
  createTag: async (tag: Omit<Tag, 'id'>) => {
    set({ isLoadingTags: true, tagError: null });
    try {
      const newTag = await tagRepository.createTag(tag);
      
      // Check if the tag already exists in the current state
      const tagExists = get().tags.some(t => t.id === newTag.id);
      
      if (!tagExists) {
        set(state => ({
          tags: [...state.tags, newTag],
          isLoadingTags: false
        }));
      } else {
        set({ isLoadingTags: false });
      }
      
      return newTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      set({ 
        tagError: error instanceof Error ? error.message : 'Failed to create tag', 
        isLoadingTags: false 
      });
      throw error;
    }
  },
  
  // Update an existing tag
  updateTag: async (id: string, updates: Partial<Tag>) => {
    set({ isLoadingTags: true, tagError: null });
    try {
      const updatedTag = await tagRepository.updateTag(id, updates);
      set(state => ({
        tags: state.tags.map(t => t.id === id ? updatedTag : t),
        isLoadingTags: false
      }));
      return updatedTag;
    } catch (error) {
      console.error(`Error updating tag ${id}:`, error);
      set({ 
        tagError: error instanceof Error ? error.message : `Failed to update tag ${id}`, 
        isLoadingTags: false 
      });
      throw error;
    }
  },
  
  // Delete a tag
  deleteTag: async (id: string) => {
    set({ isLoadingTags: true, tagError: null });
    try {
      await tagRepository.deleteTag(id);
      set(state => ({
        tags: state.tags.filter(t => t.id !== id),
        isLoadingTags: false
      }));
    } catch (error) {
      console.error(`Error deleting tag ${id}:`, error);
      set({ 
        tagError: error instanceof Error ? error.message : `Failed to delete tag ${id}`, 
        isLoadingTags: false 
      });
      throw error;
    }
  },
  
  // Search tags by name
  searchTags: async (searchTerm: string) => {
    set({ isLoadingTags: true, tagError: null });
    try {
      const tags = await tagRepository.searchTagsByName(searchTerm);
      set({ tags, isLoadingTags: false });
    } catch (error) {
      console.error(`Error searching tags with term ${searchTerm}:`, error);
      set({ 
        tagError: error instanceof Error ? error.message : `Failed to search tags`, 
        isLoadingTags: false 
      });
    }
  }
});