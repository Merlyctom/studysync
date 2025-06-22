import React, { useEffect, useState } from 'react';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, provider } from './firebase';
import Room from './components/Room';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      // User will be set automatically via onAuthStateChanged
    } catch (error) {
      console.error('Login Error:', error);
      alert('Login failed. Try again.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null); // optional, will also be reset by onAuthStateChanged
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Clean up
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Welcome to StudySync 📚</h1>
      <p>Create or join a virtual study room to get started.</p>

      {!user && (
        <button
          onClick={handleLogin}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#4285F4',
            color: 'white',
            marginTop: '1rem',
          }}
        >
          Sign in with Google
        </button>
      )}

      {user && (
        <>
          <Room />
          <button
            onClick={handleLogout}
            style={{
              marginTop: '2rem',
              backgroundColor: '#f44336',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </>
      )}
    </div>
  );
}

export default App;
