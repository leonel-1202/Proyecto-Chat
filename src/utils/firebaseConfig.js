import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyDeu4tFPDHNf44DpCgtvxGcqi3Urb0Wasc",
  authDomain:        "nexus-web-a4123.firebaseapp.com",
  projectId:         "nexus-web-a4123",
  storageBucket:     "nexus-web-a4123.firebasestorage.app",
  messagingSenderId: "1010374713756",
  appId:             "1:1010374713756:web:471927c501d8cb84d32859",
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);

auth.languageCode = "es";
auth.settings.appVerificationDisabledForTesting = false;