import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// El usuario debe reemplazar estos valores con sus propias credenciales de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBo2Y6ovrcAIvRXSxRQeSLLVdNdlm0UX3E",
    authDomain: "draadrianapagnotta-5dcf5.firebaseapp.com",
    projectId: "draadrianapagnotta-5dcf5",
    storageBucket: "draadrianapagnotta-5dcf5.firebasestorage.app",
    messagingSenderId: "803028123141",
    appId: "1:803028123141:web:e175afb5e7272ceaf4a66c",
    measurementId: "G-2KSNTK2NRB"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

export { db, auth, storage }
