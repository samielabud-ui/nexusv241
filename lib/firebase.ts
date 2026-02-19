
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAB_UIUoinmAblq6NRBOfOSKlA5SJnPxJc",
  authDomain: "nexus-e4168.firebaseapp.com",
  projectId: "nexus-e4168",
  storageBucket: "nexus-e4168.firebasestorage.app",
  messagingSenderId: "469673231022",
  appId: "1:469673231022:web:416335a818322b04bb633f",
  measurementId: "G-P2F0WCQYWM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
