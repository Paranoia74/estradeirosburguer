// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDq38IlKl5VTE9Ob5Enr___2NQ9e2wIJOY",
  authDomain: "estradeiro-burguer.firebaseapp.com",
  projectId: "estradeiro-burguer",
  storageBucket: "estradeiro-burguer.firebasestorage.app",
  messagingSenderId: "463453759377",
  appId: "1:463453759377:web:90c0cea2b8267acaf81c30",
  measurementId: "G-S2GES525TF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
