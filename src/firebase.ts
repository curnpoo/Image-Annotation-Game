import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyBAsWPf3QS-9GNalh_JC2KDW_58IsX3S4U",
    authDomain: "image-annotation-game.firebaseapp.com",
    databaseURL: "https://image-annotation-game-default-rtdb.firebaseio.com",
    projectId: "image-annotation-game",
    storageBucket: "image-annotation-game.firebasestorage.app",
    messagingSenderId: "875626942936",
    appId: "1:875626942936:web:7197de17608976e3d762ad",
    measurementId: "G-RC57S4DEQX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

export default app;
