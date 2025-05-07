// User Authentication State Management
import { StateCreator } from 'zustand';
import { 
  User, 
  UserRole 
} from '../types';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../integrations/firebase/client';

export interface UserSlice {
  // State
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  
  // Actions
  signUp: (email: string, password: string, displayName: string, role: UserRole, department?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  loadUserData: () => Promise<void>;
  initializeAuthListener: () => void;
}

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  // Initial state
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  
  // Sign up a new user
  signUp: async (email: string, password: string, displayName: string, role: UserRole, department?: string) => {
    set({ isLoading: true, authError: null });
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name
      await updateProfile(firebaseUser, { displayName });
      
      // Create user document in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email,
        displayName,
        role,
        ...(department && { department })
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      // Update state with user data
      set({
        currentUser: userData,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      console.error('Error signing up:', error);
      set({
        authError: error instanceof Error ? error.message : 'Failed to sign up',
        isLoading: false
      });
      throw error;
    }
  },
  
  // Sign in existing user
  signIn: async (email: string, password: string) => {
    set({ isLoading: true, authError: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The auth listener will update the state
    } catch (error) {
      console.error('Error signing in:', error);
      set({
        authError: error instanceof Error ? error.message : 'Failed to sign in',
        isLoading: false
      });
      throw error;
    }
  },
  
  // Sign out user
  signOut: async () => {
    set({ isLoading: true, authError: null });
    try {
      await firebaseSignOut(auth);
      set({
        currentUser: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      console.error('Error signing out:', error);
      set({
        authError: error instanceof Error ? error.message : 'Failed to sign out',
        isLoading: false
      });
      throw error;
    }
  },
  
  // Update user profile
  updateUserProfile: async (updates: Partial<User>) => {
    const { currentUser } = get();
    if (!currentUser) {
      set({
        authError: 'No authenticated user found',
        isLoading: false
      });
      throw new Error('No authenticated user found');
    }
    
    set({ isLoading: true, authError: null });
    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, updates);
      
      // Update profile display name if provided
      if (updates.displayName && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: updates.displayName
        });
      }
      
      // Update state with updated user data
      set({
        currentUser: {
          ...currentUser,
          ...updates
        },
        isLoading: false
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      set({
        authError: error instanceof Error ? error.message : 'Failed to update profile',
        isLoading: false
      });
      throw error;
    }
  },
  
  // Load user data from Firestore
  loadUserData: async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      set({
        currentUser: null,
        isAuthenticated: false,
        isLoading: false
      });
      return;
    }
    
    set({ isLoading: true, authError: null });
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        set({
          currentUser: userData,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        // User doesn't have a document, create one with default values
        const defaultUserData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          role: UserRole.REQUESTER
        };
        
        await setDoc(userRef, defaultUserData);
        
        set({
          currentUser: defaultUserData,
          isAuthenticated: true,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      set({
        authError: error instanceof Error ? error.message : 'Failed to load user data',
        isLoading: false
      });
    }
  },
  
  // Initialize auth state listener
  initializeAuthListener: () => {
    onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        await get().loadUserData();
      } else {
        set({
          currentUser: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    });
  }
});