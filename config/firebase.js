import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * You need to add your service account key file to the project root
 */
export const initializeFirebase = () => {
  if (firebaseApp) {
    console.log('✅ Firebase already initialized');
    return firebaseApp;
  }

  try {
    // Option 1: Using service account key file (recommended for development)
    const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');
    
    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      console.log('✅ Firebase initialized with service account key');
      return firebaseApp;
      
    } catch (fileError) {
      console.log('⚠️ Service account key file not found, trying environment variables...');
      
      // Option 2: Using environment variables (recommended for production)
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        const serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };

        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        
        console.log('✅ Firebase initialized with environment variables');
        return firebaseApp;
      }
      
      // Option 3: Default credentials (for Google Cloud environments)
      firebaseApp = admin.initializeApp({
        projectId: 'ful2win-f20e7' // Your project ID from google-services.json
      });
      
      console.log('✅ Firebase initialized with default credentials');
      return firebaseApp;
    }
    
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};

/**
 * Get Firebase Admin instance
 */
export const getFirebaseAdmin = () => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};

/**
 * Get Firebase Messaging instance
 */
export const getMessaging = () => {
  const app = getFirebaseAdmin();
  return admin.messaging(app);
};

export default { initializeFirebase, getFirebaseAdmin, getMessaging };
