import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA2eZJgBlO-xVkG4l2aCIXzJ-8UlW20xis",
  authDomain: "studysync-7ade6.firebaseapp.com",
  projectId: "studysync-7ade6",
  storageBucket: "studysync-7ade6.firebasestorage.app",
  messagingSenderId: "428808401525",
  appId: "1:428808401525:web:ec1655edb9e0041b9b3e3c"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, auth, provider }; // 👈 Add `app` here again
