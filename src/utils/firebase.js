import firebase from "firebase/app";
import "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;

export { auth, GoogleAuthProvider };
