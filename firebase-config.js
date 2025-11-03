// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqIVznrZms0zmJ0D45l8euiFluyRI7v0I",
  authDomain: "estradeiro-burguer.firebaseapp.com",
  projectId: "estradeiro-burguer",
  storageBucket: "estradeiro-burguer.firebasestorage.app",
  messagingSenderId: "463453759377",
  appId: "1:463453759377:web:e1556a50e820514ff81c30",
  measurementId: "G-H5EFQKWCJ7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
