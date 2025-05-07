// Core Type Definitions for PIR workflow

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  REQUESTER = 'requester',
  RESPONDER = 'responder',
  REVIEWER = 'reviewer'
}

export enum PIRStatus {
  DRAFT = 'draft',
  REQUESTED = 'requested',
  SUBMITTED = 'submitted', 
  REVIEWED = 'reviewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export interface PIR {
  id: string;
  title: string;
  description: string;
  status: PIRStatus;
  requesterId: string;
  requesterName: string;
  assignedResponderId?: string;
  assignedResponderName?: string;
  reviewerId?: string;
  reviewerName?: string;
  productName: string;
  productCategory: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  completionDeadline?: Date;
  tags: string[];
  questionIds: string[];
  attachmentIds: string[];
  comments?: string;
  reviewNotes?: string;
}

export interface Question {
  id: string;
  pirId: string;
  text: string;
  category: string;
  required: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  attachmentIds: string[];
}

export interface Answer {
  id: string;
  questionId: string;
  pirId: string;
  text: string;
  responderId: string;
  responderName: string;
  createdAt: Date;
  updatedAt: Date;
  attachmentIds: string[];
}

export interface Tag {
  id: string;
  name: string;
  category?: string;
  color?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  parentId: string; // pirId, questionId, or answerId
  parentType: 'pir' | 'question' | 'answer';
  downloadUrl: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text: string;
}