import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendPIRStatusUpdateEmail, sendNewQuestionEmail, sendNewAnswerEmail } from './email-notifications';
import { PIRStatus } from '../src/types'; // We're referencing the types from the client application

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Firestore trigger: Send email notifications when a PIR status is updated
 * 
 * This function monitors changes to PIR documents in Firestore and sends
 * email notifications to relevant users when the status changes.
 */
export const onPIRStatusChange = functions.firestore
  .document('pirs/{pirId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const pirId = context.params.pirId;
    
    // Skip if status hasn't changed
    if (beforeData.status === afterData.status) {
      return null;
    }
    
    // Get user data for sending emails
    const requesterSnapshot = await db.collection('users').doc(afterData.requesterId).get();
    const requester = requesterSnapshot.data();
    
    let responder = null;
    if (afterData.assignedResponderId) {
      const responderSnapshot = await db.collection('users').doc(afterData.assignedResponderId).get();
      responder = responderSnapshot.data();
    }
    
    let reviewer = null;
    if (afterData.reviewerId) {
      const reviewerSnapshot = await db.collection('users').doc(afterData.reviewerId).get();
      reviewer = reviewerSnapshot.data();
    }
    
    // Get admins
    const adminsSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();
    
    const adminEmails = adminsSnapshot.docs.map(doc => doc.data().email);
    
    try {
      switch (afterData.status) {
        case PIRStatus.REQUESTED:
          // Notify responders and admins about a new request
          await sendPIRStatusUpdateEmail({
            status: PIRStatus.REQUESTED,
            pir: { 
              id: pirId,
              title: afterData.title,
              description: afterData.description,
              productName: afterData.productName,
              requesterName: afterData.requesterName
            },
            toEmails: responder ? [responder.email, ...adminEmails] : adminEmails
          });
          break;
          
        case PIRStatus.SUBMITTED:
          // Notify reviewer and requester
          if (reviewer) {
            await sendPIRStatusUpdateEmail({
              status: PIRStatus.SUBMITTED,
              pir: { 
                id: pirId,
                title: afterData.title,
                description: afterData.description,
                productName: afterData.productName,
                requesterName: afterData.requesterName
              },
              toEmails: [reviewer.email, requester?.email, ...adminEmails].filter(Boolean) as string[]
            });
          }
          break;
          
        case PIRStatus.REVIEWED:
          // Notify requester and responder
          await sendPIRStatusUpdateEmail({
            status: PIRStatus.REVIEWED,
            pir: { 
              id: pirId,
              title: afterData.title,
              description: afterData.description,
              productName: afterData.productName,
              requesterName: afterData.requesterName
            },
            toEmails: [requester?.email, responder?.email].filter(Boolean) as string[]
          });
          break;
          
        case PIRStatus.ACCEPTED:
        case PIRStatus.REJECTED:
          // Notify requester and responder about final decision
          await sendPIRStatusUpdateEmail({
            status: afterData.status,
            pir: { 
              id: pirId,
              title: afterData.title,
              description: afterData.description,
              productName: afterData.productName,
              requesterName: afterData.requesterName
            },
            toEmails: [requester?.email, responder?.email].filter(Boolean) as string[]
          });
          break;
          
        default:
          console.log(`No notification configured for status: ${afterData.status}`);
          break;
      }
      
      return null;
    } catch (error) {
      console.error('Error sending PIR status update notification:', error);
      return null;
    }
  });

/**
 * Firestore trigger: Send email notifications when a new question is added
 */
export const onNewQuestion = functions.firestore
  .document('questions/{questionId}')
  .onCreate(async (snapshot, context) => {
    const questionData = snapshot.data();
    const pirId = questionData.pirId;
    
    try {
      // Get the PIR
      const pirSnapshot = await db.collection('pirs').doc(pirId).get();
      const pirData = pirSnapshot.data();
      
      if (!pirData) {
        console.log(`PIR not found for question: ${context.params.questionId}`);
        return null;
      }
      
      // Get the responder if assigned
      let responderEmail: string | undefined;
      if (pirData.assignedResponderId) {
        const responderSnapshot = await db.collection('users').doc(pirData.assignedResponderId).get();
        const responder = responderSnapshot.data();
        responderEmail = responder?.email;
      }
      
      if (responderEmail) {
        await sendNewQuestionEmail({
          question: {
            id: context.params.questionId,
            text: questionData.text,
            category: questionData.category,
            createdAt: questionData.createdAt.toDate()
          },
          pir: {
            id: pirId,
            title: pirData.title,
            productName: pirData.productName
          },
          toEmail: responderEmail
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error sending new question notification:', error);
      return null;
    }
  });

/**
 * Firestore trigger: Send email notifications when a new answer is added
 */
export const onNewAnswer = functions.firestore
  .document('answers/{answerId}')
  .onCreate(async (snapshot, context) => {
    const answerData = snapshot.data();
    const pirId = answerData.pirId;
    const questionId = answerData.questionId;
    
    try {
      // Get the PIR
      const pirSnapshot = await db.collection('pirs').doc(pirId).get();
      const pirData = pirSnapshot.data();
      
      if (!pirData) {
        console.log(`PIR not found for answer: ${context.params.answerId}`);
        return null;
      }
      
      // Get the question
      const questionSnapshot = await db.collection('questions').doc(questionId).get();
      const questionData = questionSnapshot.data();
      
      if (!questionData) {
        console.log(`Question not found for answer: ${context.params.answerId}`);
        return null;
      }
      
      // Get the requester
      const requesterSnapshot = await db.collection('users').doc(pirData.requesterId).get();
      const requester = requesterSnapshot.data();
      
      if (requester?.email) {
        await sendNewAnswerEmail({
          answer: {
            id: context.params.answerId,
            text: answerData.text,
            responderName: answerData.responderName,
            createdAt: answerData.createdAt.toDate()
          },
          question: {
            id: questionId,
            text: questionData.text
          },
          pir: {
            id: pirId,
            title: pirData.title,
            productName: pirData.productName
          },
          toEmail: requester.email
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error sending new answer notification:', error);
      return null;
    }
  });