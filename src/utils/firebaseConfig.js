import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyDeu4tFPDHNf44DpCgtvxGcqi3Urb0Wasc",
  authDomain: "nexus-web-a4123.firebaseapp.com",
  projectId: "nexus-web-a4123",
  storageBucket: "nexus-web-a4123.firebasestorage.app",
  messagingSenderId: "1010374713756",
  appId: "1:1010374713756:web:471927c501d8cb84d32859",
  measurementId:     "G-SR2WVCTLGS",
};

const app = initializeApp(firebaseConfig);

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    import.meta.env.VITE_RECAPTCHA_KEY
  ),
  isTokenAutoRefreshEnabled: true,
});

export const auth = getAuth(app);
auth.languageCode = "es";
auth.settings.appVerificationDisabledForTesting = false;