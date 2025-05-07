// PIR Repository for Firebase integration
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
  DocumentReference,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db } from '../client';
import { PIR, PIRStatus } from '../../../types';
import { convertDatesToTimestamps, convertTimestampsToDates } from '../utils';

const COLLECTION_NAME = 'pirs';

/**
 * Get all PIRs with optional filtering
 */
export const getPIRs = async (): Promise<PIR[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const pirs: PIR[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const pirWithId = {
        id: doc.id,
        ...convertTimestampsToDates(data)
      } as PIR;
      
      pirs.push(pirWithId);
    });
    
    return pirs;
  } catch (error) {
    console.error('Error getting PIRs:', error);
    throw error;
  }
};

/**
 * Get PIRs by status
 */
export const getPIRsByStatus = async (status: PIRStatus): Promise<PIR[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const pirs: PIR[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const pirWithId = {
        id: doc.id,
        ...convertTimestampsToDates(data)
      } as PIR;
      
      pirs.push(pirWithId);
    });
    
    return pirs;
  } catch (error) {
    console.error(`Error getting PIRs with status ${status}:`, error);
    throw error;
  }
};

/**
 * Get PIRs by requester ID
 */
export const getPIRsByRequesterId = async (requesterId: string): Promise<PIR[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('requesterId', '==', requesterId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const pirs: PIR[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const pirWithId = {
        id: doc.id,
        ...convertTimestampsToDates(data)
      } as PIR;
      
      pirs.push(pirWithId);
    });
    
    return pirs;
  } catch (error) {
    console.error(`Error getting PIRs for requester ${requesterId}:`, error);
    throw error;
  }
};

/**
 * Get PIRs assigned to a responder
 */
export const getPIRsByResponderId = async (responderId: string): Promise<PIR[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('assignedResponderId', '==', responderId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const pirs: PIR[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const pirWithId = {
        id: doc.id,
        ...convertTimestampsToDates(data)
      } as PIR;
      
      pirs.push(pirWithId);
    });
    
    return pirs;
  } catch (error) {
    console.error(`Error getting PIRs for responder ${responderId}:`, error);
    throw error;
  }
};

/**
 * Get PIRs assigned to a reviewer
 */
export const getPIRsByReviewerId = async (reviewerId: string): Promise<PIR[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('reviewerId', '==', reviewerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const pirs: PIR[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const pirWithId = {
        id: doc.id,
        ...convertTimestampsToDates(data)
      } as PIR;
      
      pirs.push(pirWithId);
    });
    
    return pirs;
  } catch (error) {
    console.error(`Error getting PIRs for reviewer ${reviewerId}:`, error);
    throw error;
  }
};

/**
 * Get a single PIR by ID
 */
export const getPIRById = async (id: string): Promise<PIR | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...convertTimestampsToDates(data)
      } as PIR;
    } else {
      console.log(`No PIR found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting PIR ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new PIR
 */
export const createPIR = async (pir: Omit<PIR, 'id'>): Promise<PIR> => {
  try {
    const now = new Date();
    const newPIR = {
      ...pir,
      createdAt: now,
      updatedAt: now,
      questionIds: pir.questionIds || [],
      attachmentIds: pir.attachmentIds || [],
      tags: pir.tags || []
    };
    
    const pirWithTimestamps = convertDatesToTimestamps(newPIR);
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...pirWithTimestamps,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...newPIR
    };
  } catch (error) {
    console.error('Error creating PIR:', error);
    throw error;
  }
};

/**
 * Update an existing PIR
 */
export const updatePIR = async (id: string, updates: Partial<PIR>): Promise<PIR> => {
  try {
    const pirRef = doc(db, COLLECTION_NAME, id);
    const currentDoc = await getDoc(pirRef);
    
    if (!currentDoc.exists()) {
      throw new Error(`PIR with ID ${id} not found`);
    }
    
    const updatesWithTimestamp = {
      ...convertDatesToTimestamps(updates),
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(pirRef, updatesWithTimestamp);
    
    // Get the updated document
    const updatedDoc = await getDoc(pirRef);
    const updatedData = updatedDoc.data();
    
    return {
      id,
      ...convertTimestampsToDates(updatedData)
    } as PIR;
  } catch (error) {
    console.error(`Error updating PIR ${id}:`, error);
    throw error;
  }
};

/**
 * Update PIR status with timestamp tracking
 */
export const updatePIRStatus = async (
  id: string, 
  status: PIRStatus, 
  additionalData: Partial<PIR> = {}
): Promise<PIR> => {
  try {
    const pirRef = doc(db, COLLECTION_NAME, id);
    const currentDoc = await getDoc(pirRef);
    
    if (!currentDoc.exists()) {
      throw new Error(`PIR with ID ${id} not found`);
    }
    
    const now = new Date();
    const updates: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData
    };
    
    // Add status-specific timestamp
    switch (status) {
      case PIRStatus.SUBMITTED:
        updates.submittedAt = serverTimestamp();
        break;
      case PIRStatus.REVIEWED:
        updates.reviewedAt = serverTimestamp();
        break;
      case PIRStatus.ACCEPTED:
        updates.acceptedAt = serverTimestamp();
        break;
      case PIRStatus.REJECTED:
        updates.rejectedAt = serverTimestamp();
        break;
      default:
        break;
    }
    
    await updateDoc(pirRef, updates);
    
    // Get the updated document
    const updatedDoc = await getDoc(pirRef);
    const updatedData = updatedDoc.data();
    
    return {
      id,
      ...convertTimestampsToDates(updatedData)
    } as PIR;
  } catch (error) {
    console.error(`Error updating PIR status ${id}:`, error);
    throw error;
  }
};

/**
 * Add a question ID to a PIR
 */
export const addQuestionToPIR = async (pirId: string, questionId: string): Promise<void> => {
  try {
    const pirRef = doc(db, COLLECTION_NAME, pirId);
    
    await updateDoc(pirRef, {
      questionIds: arrayUnion(questionId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error adding question ${questionId} to PIR ${pirId}:`, error);
    throw error;
  }
};

/**
 * Add an attachment ID to a PIR
 */
export const addAttachmentToPIR = async (pirId: string, attachmentId: string): Promise<void> => {
  try {
    const pirRef = doc(db, COLLECTION_NAME, pirId);
    
    await updateDoc(pirRef, {
      attachmentIds: arrayUnion(attachmentId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error adding attachment ${attachmentId} to PIR ${pirId}:`, error);
    throw error;
  }
};

/**
 * Add a tag to a PIR
 */
export const addTagToPIR = async (pirId: string, tag: string): Promise<void> => {
  try {
    const pirRef = doc(db, COLLECTION_NAME, pirId);
    
    await updateDoc(pirRef, {
      tags: arrayUnion(tag),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error adding tag ${tag} to PIR ${pirId}:`, error);
    throw error;
  }
};

/**
 * Remove a tag from a PIR
 */
export const removeTagFromPIR = async (pirId: string, tag: string): Promise<void> => {
  try {
    const pirRef = doc(db, COLLECTION_NAME, pirId);
    
    await updateDoc(pirRef, {
      tags: arrayRemove(tag),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error removing tag ${tag} from PIR ${pirId}:`, error);
    throw error;
  }
};

// Helper for array operations
import { arrayUnion, arrayRemove } from 'firebase/firestore';