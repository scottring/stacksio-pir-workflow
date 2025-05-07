// Question Repository for Firebase integration
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
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../client';
import { Question } from '../../../types';
import { convertDatesToTimestamps, convertTimestampsToDates } from '../utils';

const COLLECTION_NAME = 'questions';

/**
 * Get all questions for a specific PIR
 */
export const getQuestionsByPIRId = async (pirId: string): Promise<Question[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('pirId', '==', pirId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const questions: Question[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const questionWithId = {
        id: doc.id,
        ...convertTimestampsToDates(data)
      } as Question;
      
      questions.push(questionWithId);
    });
    
    return questions;
  } catch (error) {
    console.error(`Error getting questions for PIR ${pirId}:`, error);
    throw error;
  }
};

/**
 * Get a single question by ID
 */
export const getQuestionById = async (id: string): Promise<Question | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...convertTimestampsToDates(data)
      } as Question;
    } else {
      console.log(`No question found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting question ${id}:`, error);
    throw error;
  }
};

/**
 * Get multiple questions by ID array
 */
export const getQuestionsByIds = async (ids: string[]): Promise<Question[]> => {
  try {
    if (!ids.length) return [];
    
    const questions: Question[] = [];
    
    // Firebase doesn't support "in" queries with more than 10 items
    // So we have to batch our requests
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    for (const batch of batches) {
      const q = query(
        collection(db, COLLECTION_NAME),
        where(doc.id, 'in', batch)
      );
      
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const questionWithId = {
          id: doc.id,
          ...convertTimestampsToDates(data)
        } as Question;
        
        questions.push(questionWithId);
      });
    }
    
    return questions;
  } catch (error) {
    console.error('Error getting questions by IDs:', error);
    throw error;
  }
};

/**
 * Create a new question
 */
export const createQuestion = async (question: Omit<Question, 'id'>): Promise<Question> => {
  try {
    const now = new Date();
    const newQuestion = {
      ...question,
      createdAt: now,
      updatedAt: now,
      attachmentIds: question.attachmentIds || []
    };
    
    const questionWithTimestamps = convertDatesToTimestamps(newQuestion);
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...questionWithTimestamps,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Return the created question with its ID
    return {
      id: docRef.id,
      ...newQuestion
    };
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

/**
 * Update an existing question
 */
export const updateQuestion = async (id: string, updates: Partial<Question>): Promise<Question> => {
  try {
    const questionRef = doc(db, COLLECTION_NAME, id);
    const currentDoc = await getDoc(questionRef);
    
    if (!currentDoc.exists()) {
      throw new Error(`Question with ID ${id} not found`);
    }
    
    const updatesWithTimestamp = {
      ...convertDatesToTimestamps(updates),
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(questionRef, updatesWithTimestamp);
    
    // Get the updated document
    const updatedDoc = await getDoc(questionRef);
    const updatedData = updatedDoc.data();
    
    return {
      id,
      ...convertTimestampsToDates(updatedData)
    } as Question;
  } catch (error) {
    console.error(`Error updating question ${id}:`, error);
    throw error;
  }
};

/**
 * Add an attachment ID to a question
 */
export const addAttachmentToQuestion = async (questionId: string, attachmentId: string): Promise<void> => {
  try {
    const questionRef = doc(db, COLLECTION_NAME, questionId);
    
    await updateDoc(questionRef, {
      attachmentIds: arrayUnion(attachmentId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error adding attachment ${attachmentId} to question ${questionId}:`, error);
    throw error;
  }
};

/**
 * Create multiple questions at once
 */
export const createMultipleQuestions = async (
  questions: Array<Omit<Question, 'id'>>
): Promise<Question[]> => {
  try {
    const createdQuestions: Question[] = [];
    
    // Create each question one by one
    for (const question of questions) {
      const createdQuestion = await createQuestion(question);
      createdQuestions.push(createdQuestion);
    }
    
    return createdQuestions;
  } catch (error) {
    console.error('Error creating multiple questions:', error);
    throw error;
  }
};