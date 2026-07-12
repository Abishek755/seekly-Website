import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDgWnScR6Dg57CgZ5JBAET6QdfJWo8Mqgc",
  authDomain: "seekhly-website.firebaseapp.com",
  projectId: "seekhly-website",
  storageBucket: "seekhly-website.firebasestorage.app",
  messagingSenderId: "708494094551",
  appId: "1:708494094551:web:6f6ec0eaef5a041c100092",
  measurementId: "G-V140MTQ5ZC"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
