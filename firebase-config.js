// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyDqIZnvZms0zmJ0D4518EuejFLuyRIV07I",
  authDomain: "estradeiro-burguer.firebaseapp.com",
  projectId: "estradeiro-burguer",
  storageBucket: "estradeiro-burguer.appspot.com",
  messagingSenderId: "464354375977",
  appId: "1:464354375977:web:e15565a50e8205144ff61c30",
  measurementId: "G-H5EFQKWCJ7"
};

// Deixa disponível globalmente
if (typeof window !== 'undefined') {
  window._FBCFG = firebaseConfig;
}
