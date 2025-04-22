// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFhohQxKhXdfgFwt1Z2LX3a9goxgT-WhE",
  authDomain: "jawad-3c1f5.firebaseapp.com",
  projectId: "jawad-3c1f5",
  storageBucket: "jawad-3c1f5.appspot.com",
  messagingSenderId: "5644593134",
  appId: "1:5644593134:web:0f649f5465d2f9aab450ff"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };