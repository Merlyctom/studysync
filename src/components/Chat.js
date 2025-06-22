import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { auth } from '../firebase';

const db = getFirestore();

const Chat = ({ room, onLeave }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!room) return;
    const q = query(collection(db, 'rooms', room.id, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [room]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await addDoc(collection(db, 'rooms', room.id, 'messages'), {
        text: message,
        user: auth.currentUser.displayName,
        timestamp: serverTimestamp(),
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Room: {room.name}</h2>
      <button onClick={onLeave} style={{ marginBottom: '1rem' }}>Sign Out</button>
      <div style={{
        border: '1px solid #ccc',
        padding: '1rem',
        height: '300px',
        overflowY: 'scroll',
        marginBottom: '1rem'
      }}>
        {messages.map((m, index) => (
          <p key={index}>
            <strong>{m.user}:</strong> {m.text}
            <span style={{ fontSize: '0.8rem', marginLeft: '8px', color: '#666' }}>
              {m.timestamp?.seconds
                ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '...'}
            </span>
          </p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
        style={{ padding: '8px', width: '70%' }}
      />
      <button onClick={sendMessage} style={{ padding: '8px', marginLeft: '10px' }}>Send</button>
    </div>
  );
};

export default Chat;
