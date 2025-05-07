// Attachment Repository for Firebase integration
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../client';
import { Attachment } from '../../../types';
import { convertDatesToTimestamps, convertTimestampsToDates } from '../utils';

const COLLECTION_NAME = 'attachments';
const STORAGE_PATH = 'attachments';

/**
 * Get all attachments for a parent (PIR, Question, or Answer)
 */
export const getAttachmentsByParentId = async (
  parentId: string, 
  parentType: 'pir' | 'question' | 'answer'
): Promise<Attachment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('parentId', '==', parentId),
      where('parentType', '==', parentType),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const attachments: Attachment[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const attachmentWithId = {
        id: doc.id,
        ...convertTimestampsToDates(data)
      } as Attachment;
      
      attachments.push(attachmentWithId);
    });
    
    return attachments;
  } catch (error) {
    console.error(`Error getting attachments for ${parentType} ${parentId}:`, error);
    throw error;
  }
};

/**
 * Get a single attachment by ID
 */
export const getAttachmentById = async (id: string): Promise<Attachment | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...convertTimestampsToDates(data)
      } as Attachment;
    } else {
      console.log(`No attachment found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting attachment ${id}:`, error);
    throw error;
  }
};

/**
 * Get multiple attachments by ID array
 */
export const getAttachmentsByIds = async (ids: string[]): Promise<Attachment[]> => {
  try {
    if (!ids.length) return [];
    
    const attachments: Attachment[] = [];
    
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
        const attachmentWithId = {
          id: doc.id,
          ...convertTimestampsToDates(data)
        } as Attachment;
        
        attachments.push(attachmentWithId);
      });
    }
    
    return attachments;
  } catch (error) {
    console.error('Error getting attachments by IDs:', error);
    throw error;
  }
};

/**
 * Upload a file and create an attachment record
 */
export const uploadAttachment = async (
  file: File, 
  uploadedBy: string, 
  parentId: string, 
  parentType: 'pir' | 'question' | 'answer'
): Promise<Attachment> => {
  try {
    // 1. Upload the file to Firebase Storage
    const timestamp = Date.now();
    const filePath = `${STORAGE_PATH}/${parentType}/${parentId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filePath);
    
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    
    // 2. Create a document in Firestore with the file metadata
    const now = new Date();
    const attachmentData: Omit<Attachment, 'id'> = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedBy,
      uploadedAt: now,
      parentId,
      parentType,
      downloadUrl
    };
    
    const attachmentWithTimestamps = convertDatesToTimestamps(attachmentData);
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...attachmentWithTimestamps,
      uploadedAt: serverTimestamp()
    });
    
    // 3. Return the created attachment with its ID
    return {
      id: docRef.id,
      ...attachmentData
    };
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};

/**
 * Delete an attachment and its file
 */
export const deleteAttachment = async (id: string): Promise<void> => {
  try {
    // 1. Get the attachment document
    const attachmentRef = doc(db, COLLECTION_NAME, id);
    const attachmentSnap = await getDoc(attachmentRef);
    
    if (!attachmentSnap.exists()) {
      throw new Error(`Attachment with ID ${id} not found`);
    }
    
    const attachmentData = attachmentSnap.data();
    
    // 2. Delete the file from Firebase Storage if it exists
    try {
      const storageRef = ref(storage, attachmentData.downloadUrl);
      await deleteObject(storageRef);
    } catch (storageError) {
      console.warn('Error deleting file from storage, continuing with document deletion:', storageError);
    }
    
    // 3. Delete the document from Firestore
    await deleteDoc(attachmentRef);
  } catch (error) {
    console.error(`Error deleting attachment ${id}:`, error);
    throw error;
  }
};