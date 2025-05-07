// Answer Repository for Firebase integration
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
  arrayUnion
} from 'firebase/firestore';
import { db } from '../client';
import { Answer } from '../../../types';
import { convertDatesToTimestamps, convertTimestampsToDates } from '../utils';

const COLLECTION_NAME = 'answers';

/**
 * Get all answers for a specific question
 */
export const getAnswersByQuestionId = async (questionId: string): Promise<Answer[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('questionId', '==', questionId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const answers: Answer[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const answerWithId = {
        id: doc.id,
        ...convertTimestampsToDates(data)
      } as Answer;
      
      answers.push(answerWithId);
    });
    
    return answers;
  } catch (error) {
    console.error(`Error getting answers for question ${questionId}:`, error);
    throw error;
  }
};

/**
 * Get all answers for a specific PIR
 */
export const getAnswersByPIRId = async (pirId: string): Promise<Answer[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('pirId', '==', pirId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const answers: Answer[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const answerWithId = {
        id: doc.id,
        ...convertTimestampsToDates(data)
      } as Answer;
      
      answers.push(answerWithId);
    });
    
    return answers;
  } catch (error) {
    console.error(`Error getting answers for PIR ${pirId}:`, error);
    throw error;
  }
};

/**
 * Get answers by responder ID
 */
export const getAnswersByResponderId = async (responderId: string): Promise<Answer[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('responderId', '==', responderId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const answers: Answer[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const answerWithId = {
        id: doc.id,
        ...convertTimestampsToDates(data)
      } as Answer;
      
      answers.push(answerWithId);
    });
    
    return answers;
  } catch (error) {
    console.error(`Error getting answers for responder ${responderId}:`, error);
    throw error;
  }
};

/**
 * Get a single answer by ID
 */
export const getAnswerById = async (id: string): Promise<Answer | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...convertTimestampsToDates(data)
      } as Answer;
    } else {
      console.log(`No answer found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting answer ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new answer
 */
export const createAnswer = async (answer: Omit<Answer, 'id'>): Promise<Answer> => {
  try {
    const now = new Date();
    const newAnswer = {
      ...answer,
      createdAt: now,
      updatedAt: now,
      attachmentIds: answer.attachmentIds || []
    };
    
    const answerWithTimestamps = convertDatesToTimestamps(newAnswer);
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...answerWithTimestamps,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Return the created answer with its ID
    return {
      id: docRef.id,
      ...newAnswer
    };
  } catch (error) {
    console.error('Error creating answer:', error);
    throw error;
  }
};

/**
 * Update an existing answer
 */
export const updateAnswer = async (id: string, updates: Partial<Answer>): Promise<Answer> => {
  try {
    const answerRef = doc(db, COLLECTION_NAME, id);
    const currentDoc = await getDoc(answerRef);
    
    if (!currentDoc.exists()) {
      throw new Error(`Answer with ID ${id} not found`);
    }
    
    const updatesWithTimestamp = {
      ...convertDatesToTimestamps(updates),
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(answerRef, updatesWithTimestamp);
    
    // Get the updated document
    const updatedDoc = await getDoc(answerRef);
    const updatedData = updatedDoc.data();
    
    return {
      id,
      ...convertTimestampsToDates(updatedData)
    } as Answer;
  } catch (error) {
    console.error(`Error updating answer ${id}:`, error);
    throw error;
  }
};

/**
 * Add an attachment ID to an answer
 */
export const addAttachmentToAnswer = async (answerId: string, attachmentId: string): Promise<void> => {
  try {
    const answerRef = doc(db, COLLECTION_NAME, answerId);
    
    await updateDoc(answerRef, {
      attachmentIds: arrayUnion(attachmentId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error adding attachment ${attachmentId} to answer ${answerId}:`, error);
    throw error;
  }
};