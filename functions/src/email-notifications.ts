import * as functions from 'firebase-functions';
import * as sgMail from '@sendgrid/mail';
import { PIRStatus } from '../src/types'; // We're referencing the types from the client application

// Set SendGrid API key from environment
sgMail.setApiKey(functions.config().sendgrid.apikey);

// Base URL for application links
const APP_BASE_URL = functions.config().app.baseurl || 'https://stacksio-pir-workflow.web.app';

// Email sender details
const EMAIL_SENDER = functions.config().email.sender || 'notifications@stacksio.com';
const EMAIL_SENDER_NAME = functions.config().email.sendername || 'Stacksio PIR Workflow';

/**
 * Send email notification when PIR status changes
 */
interface PIRStatusUpdateEmailParams {
  status: PIRStatus;
  pir: {
    id: string;
    title: string;
    description: string;
    productName: string;
    requesterName: string;
  };
  toEmails: string[];
}

export const sendPIRStatusUpdateEmail = async (params: PIRStatusUpdateEmailParams): Promise<void> => {
  const { status, pir, toEmails } = params;
  
  // Skip if no recipients
  if (!toEmails.length) {
    console.log('No recipients for PIR status update email');
    return;
  }
  
  // Get status-specific content
  let subject = '';
  let headline = '';
  let statusText = '';
  
  switch (status) {
    case PIRStatus.REQUESTED:
      subject = `[Stacksio] New PIR Requested: ${pir.title}`;
      headline = 'New Product Information Request';
      statusText = 'has been requested and needs to be addressed.';
      break;
      
    case PIRStatus.SUBMITTED:
      subject = `[Stacksio] PIR Submitted for Review: ${pir.title}`;
      headline = 'Product Information Request Submitted';
      statusText = 'has been submitted for review.';
      break;
      
    case PIRStatus.REVIEWED:
      subject = `[Stacksio] PIR Reviewed: ${pir.title}`;
      headline = 'Product Information Request Reviewed';
      statusText = 'has been reviewed and is awaiting final decision.';
      break;
      
    case PIRStatus.ACCEPTED:
      subject = `[Stacksio] PIR Accepted: ${pir.title}`;
      headline = 'Product Information Request Accepted';
      statusText = 'has been accepted.';
      break;
      
    case PIRStatus.REJECTED:
      subject = `[Stacksio] PIR Rejected: ${pir.title}`;
      headline = 'Product Information Request Rejected';
      statusText = 'has been rejected.';
      break;
      
    default:
      subject = `[Stacksio] PIR Status Update: ${pir.title}`;
      headline = 'Product Information Request Update';
      statusText = `is now in ${status} status.`;
      break;
  }
  
  // Build the email HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4f46e5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${headline}</h1>
      </div>
      <div class="content">
        <p>The following Product Information Request ${statusText}</p>
        
        <h2>${pir.title}</h2>
        <p><strong>Product:</strong> ${pir.productName}</p>
        <p><strong>Requested by:</strong> ${pir.requesterName}</p>
        <p><strong>Description:</strong> ${pir.description}</p>
        
        <a href="${APP_BASE_URL}/pirs/${pir.id}" class="button">View PIR Details</a>
      </div>
      <div class="footer">
        <p>This is an automated message from the Stacksio PIR Workflow system.</p>
      </div>
    </body>
    </html>
  `;
  
  // Plain text version
  const text = `
    ${headline}
    
    The following Product Information Request ${statusText}
    
    Title: ${pir.title}
    Product: ${pir.productName}
    Requested by: ${pir.requesterName}
    Description: ${pir.description}
    
    View PIR Details: ${APP_BASE_URL}/pirs/${pir.id}
    
    This is an automated message from the Stacksio PIR Workflow system.
  `;
  
  // Send the email
  const msg = {
    to: toEmails,
    from: {
      email: EMAIL_SENDER,
      name: EMAIL_SENDER_NAME
    },
    subject,
    text,
    html
  };
  
  try {
    await sgMail.send(msg);
    console.log(`PIR status update email sent to ${toEmails.join(', ')}`);
  } catch (error) {
    console.error('Error sending PIR status update email:', error);
    throw error;
  }
};

/**
 * Send email notification when a new question is added
 */
interface NewQuestionEmailParams {
  question: {
    id: string;
    text: string;
    category: string;
    createdAt: Date;
  };
  pir: {
    id: string;
    title: string;
    productName: string;
  };
  toEmail: string;
}

export const sendNewQuestionEmail = async (params: NewQuestionEmailParams): Promise<void> => {
  const { question, pir, toEmail } = params;
  
  const subject = `[Stacksio] New Question Added to PIR: ${pir.title}`;
  
  // Build the email HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4f46e5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
        .question {
          background-color: #f9fafb;
          padding: 15px;
          border-left: 4px solid #4f46e5;
          margin: 15px 0;
        }
        .button {
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Question Added</h1>
      </div>
      <div class="content">
        <p>A new question has been added to the following Product Information Request:</p>
        
        <h2>${pir.title}</h2>
        <p><strong>Product:</strong> ${pir.productName}</p>
        
        <div class="question">
          <p><strong>Category:</strong> ${question.category}</p>
          <p><strong>Question:</strong> ${question.text}</p>
          <p><strong>Date Added:</strong> ${question.createdAt.toLocaleDateString()}</p>
        </div>
        
        <p>Please provide an answer to this question.</p>
        
        <a href="${APP_BASE_URL}/pirs/${pir.id}" class="button">View PIR Details</a>
      </div>
      <div class="footer">
        <p>This is an automated message from the Stacksio PIR Workflow system.</p>
      </div>
    </body>
    </html>
  `;
  
  // Plain text version
  const text = `
    New Question Added
    
    A new question has been added to the following Product Information Request:
    
    Title: ${pir.title}
    Product: ${pir.productName}
    
    Question Category: ${question.category}
    Question: ${question.text}
    Date Added: ${question.createdAt.toLocaleDateString()}
    
    Please provide an answer to this question.
    
    View PIR Details: ${APP_BASE_URL}/pirs/${pir.id}
    
    This is an automated message from the Stacksio PIR Workflow system.
  `;
  
  // Send the email
  const msg = {
    to: toEmail,
    from: {
      email: EMAIL_SENDER,
      name: EMAIL_SENDER_NAME
    },
    subject,
    text,
    html
  };
  
  try {
    await sgMail.send(msg);
    console.log(`New question email sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending new question email:', error);
    throw error;
  }
};

/**
 * Send email notification when a new answer is added
 */
interface NewAnswerEmailParams {
  answer: {
    id: string;
    text: string;
    responderName: string;
    createdAt: Date;
  };
  question: {
    id: string;
    text: string;
  };
  pir: {
    id: string;
    title: string;
    productName: string;
  };
  toEmail: string;
}

export const sendNewAnswerEmail = async (params: NewAnswerEmailParams): Promise<void> => {
  const { answer, question, pir, toEmail } = params;
  
  const subject = `[Stacksio] New Answer for PIR: ${pir.title}`;
  
  // Build the email HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4f46e5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
        .question {
          background-color: #f9fafb;
          padding: 15px;
          border-left: 4px solid #4f46e5;
          margin: 15px 0;
        }
        .answer {
          background-color: #f0f9ff;
          padding: 15px;
          border-left: 4px solid #0ea5e9;
          margin: 15px 0;
        }
        .button {
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Answer Provided</h1>
      </div>
      <div class="content">
        <p>A new answer has been provided for a question in the following Product Information Request:</p>
        
        <h2>${pir.title}</h2>
        <p><strong>Product:</strong> ${pir.productName}</p>
        
        <div class="question">
          <p><strong>Question:</strong> ${question.text}</p>
        </div>
        
        <div class="answer">
          <p><strong>Answer by:</strong> ${answer.responderName}</p>
          <p><strong>Date:</strong> ${answer.createdAt.toLocaleDateString()}</p>
          <p>${answer.text}</p>
        </div>
        
        <a href="${APP_BASE_URL}/pirs/${pir.id}" class="button">View PIR Details</a>
      </div>
      <div class="footer">
        <p>This is an automated message from the Stacksio PIR Workflow system.</p>
      </div>
    </body>
    </html>
  `;
  
  // Plain text version
  const text = `
    New Answer Provided
    
    A new answer has been provided for a question in the following Product Information Request:
    
    Title: ${pir.title}
    Product: ${pir.productName}
    
    Question: ${question.text}
    
    Answer by: ${answer.responderName}
    Date: ${answer.createdAt.toLocaleDateString()}
    ${answer.text}
    
    View PIR Details: ${APP_BASE_URL}/pirs/${pir.id}
    
    This is an automated message from the Stacksio PIR Workflow system.
  `;
  
  // Send the email
  const msg = {
    to: toEmail,
    from: {
      email: EMAIL_SENDER,
      name: EMAIL_SENDER_NAME
    },
    subject,
    text,
    html
  };
  
  try {
    await sgMail.send(msg);
    console.log(`New answer email sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending new answer email:', error);
    throw error;
  }
};