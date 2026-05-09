import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseProjectId() {
  return process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
}

function getServiceAccountCredential() {
  const rawServiceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!rawServiceAccount) {
    return applicationDefault();
  }

  const serviceAccount = JSON.parse(rawServiceAccount);

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return cert(serviceAccount);
}

const app =
  getApps()[0] ||
  initializeApp({
    credential: getServiceAccountCredential(),
    projectId: getFirebaseProjectId(),
  });

export const db = getFirestore(app);

export default db;
