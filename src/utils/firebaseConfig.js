import { initializeApp } from "firebase/app";
import { getAuth }       from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey:            "AIzaSyAZdcW4g9apX8NtfG5EHSsRtwC4ogg0BEs",
  authDomain:        "nexus-1f56f.firebaseapp.com",
  projectId:         "nexus-1f56f",
  storageBucket:     "nexus-1f56f.firebasestorage.app",
  messagingSenderId: "925466332795",
  appId:             "1:925466332795:web:71cce1c5bb8f48d7459cde",
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