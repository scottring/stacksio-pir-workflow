// Tag Repository for Firebase integration
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  orderBy, 
  serverTimestamp, 
  deleteDoc
} from 'firebase/firestore';
import { db } from '../client';
import { Tag } from '../../../types';

const COLLECTION_NAME = 'tags';

/**
 * Get all tags
 */
export const getAllTags = async (): Promise<Tag[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const tags: Tag[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const tagWithId = {
        id: doc.id,
        ...data
      } as Tag;
      
      tags.push(tagWithId);
    });
    
    return tags;
  } catch (error) {
    console.error('Error getting tags:', error);
    throw error;
  }
};

/**
 * Get tags by category
 */
export const getTagsByCategory = async (category: string): Promise<Tag[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('category', '==', category),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const tags: Tag[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const tagWithId = {
        id: doc.id,
        ...data
      } as Tag;
      
      tags.push(tagWithId);
    });
    
    return tags;
  } catch (error) {
    console.error(`Error getting tags for category ${category}:`, error);
    throw error;
  }
};

/**
 * Get a single tag by ID
 */
export const getTagById = async (id: string): Promise<Tag | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data
      } as Tag;
    } else {
      console.log(`No tag found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting tag ${id}:`, error);
    throw error;
  }
};

/**
 * Get tags by name search
 */
export const searchTagsByName = async (searchTerm: string): Promise<Tag[]> => {
  try {
    // Firebase doesn't support full-text search natively,
    // so we'll get all tags and filter on the client-side for simplicity.
    // For a production app, consider using Algolia or similar.
    const allTags = await getAllTags();
    
    const normalizedSearchTerm = searchTerm.toLowerCase();
    
    return allTags.filter(tag => 
      tag.name.toLowerCase().includes(normalizedSearchTerm)
    );
  } catch (error) {
    console.error(`Error searching tags with term ${searchTerm}:`, error);
    throw error;
  }
};

/**
 * Create a new tag
 */
export const createTag = async (tag: Omit<Tag, 'id'>): Promise<Tag> => {
  try {
    // Check if a tag with the same name already exists
    const existingTags = await searchTagsByName(tag.name);
    const exactMatch = existingTags.find(
      t => t.name.toLowerCase() === tag.name.toLowerCase()
    );
    
    if (exactMatch) {
      console.log(`Tag with name "${tag.name}" already exists.`);
      return exactMatch;
    }
    
    // Create the new tag
    const docRef = await addDoc(collection(db, COLLECTION_NAME), tag);
    
    // Return the created tag with its ID
    return {
      id: docRef.id,
      ...tag
    };
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
};

/**
 * Update an existing tag
 */
export const updateTag = async (id: string, updates: Partial<Tag>): Promise<Tag> => {
  try {
    const tagRef = doc(db, COLLECTION_NAME, id);
    const currentDoc = await getDoc(tagRef);
    
    if (!currentDoc.exists()) {
      throw new Error(`Tag with ID ${id} not found`);
    }
    
    await updateDoc(tagRef, updates);
    
    // Get the updated document
    const updatedDoc = await getDoc(tagRef);
    const updatedData = updatedDoc.data();
    
    return {
      id,
      ...updatedData
    } as Tag;
  } catch (error) {
    console.error(`Error updating tag ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a tag
 */
export const deleteTag = async (id: string): Promise<void> => {
  try {
    const tagRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(tagRef);
  } catch (error) {
    console.error(`Error deleting tag ${id}:`, error);
    throw error;
  }
};