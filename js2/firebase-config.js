// Configuración de Firebase — PataConecta
const firebaseConfig = {
  apiKey: "AIzaSyBGuRkRz2ds9AYITVk9w4GFHLk55izhUP0",
  authDomain: "pataconecta-294fb.firebaseapp.com",
  projectId: "pataconecta-294fb",
  storageBucket: "pataconecta-294fb.firebasestorage.app",
  messagingSenderId: "21776221123",
  appId: "1:21776221123:web:5b62103d8d1abe02f23376"
};

// Inicializar Firebase (versión compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();