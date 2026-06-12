import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyB6I1f8h13l_so2JXvnqytKzsI4OVdk4e4",
  authDomain: "wc2026-predictor-a5532.firebaseapp.com",
  databaseURL: "https://wc2026-predictor-a5532-default-rtdb.firebaseio.com",
  projectId: "wc2026-predictor-a5532",
  storageBucket: "wc2026-predictor-a5532.firebasestorage.app",
  messagingSenderId: "740572246700",
  appId: "1:740572246700:web:10276a5490aab74f3d6509",
  measurementId: "G-0472C2FM91"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
