/*  Room.js  – ALL FIVE FEATURES  */
import React, { useState, useEffect, useRef } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { auth } from '../firebase';
import app from '../firebase';

const db = getFirestore(app);

const Room = () => {
  /* ───────────────── state ───────────────── */
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [online, setOnline] = useState([]);        // presence list
  const [typingUsers, setTypingUsers] = useState([]); // who is typing

  const typingTimeout = useRef(null);
  const bottomRef     = useRef(null);

  /* ───────────────── room CRUD ───────────────── */
  const fetchRooms = async () => {
    const snap = await getDocs(collection(db, 'rooms'));
    setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const createRoom = async () => {
    if (!roomName.trim()) return;
    await addDoc(collection(db, 'rooms'), { name: roomName, createdAt: new Date() });
    setRoomName('');
    fetchRooms();
  };

  /* ───────────────── join / presence ───────────────── */
  const joinRoom = async (room) => {
    setJoinedRoom(room);

    /* presence doc for current user */
    const meDoc = doc(db, 'rooms', room.id, 'presence', auth.currentUser.uid);
    await setDoc(meDoc, {
      name: auth.currentUser.displayName,
      typing: false,
      lastActive: serverTimestamp()
    });

    /* listen presence list */
    onSnapshot(collection(db, 'rooms', room.id, 'presence'), snap => {
      const pres = snap.docs.map(d => d.data());
      setOnline(pres.map(p => p.name));
      setTypingUsers(pres.filter(p => p.typing).map(p => p.name));
    });

    /* listen messages */
    const q = query(collection(db, 'rooms', room.id, 'messages'), orderBy('timestamp'));
    onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  /* on leave room */
  const leaveRoom = async () => {
    if (joinedRoom) {
      await deleteDoc(doc(db, 'rooms', joinedRoom.id, 'presence', auth.currentUser.uid));
    }
    setJoinedRoom(null);
    setMessages([]);
    setOnline([]);
    setTypingUsers([]);
  };

  /* ───────────────── chat send / typing ───────────────── */
  const sendMessage = async () => {
    if (!message.trim()) return;
    await addDoc(collection(db, 'rooms', joinedRoom.id, 'messages'), {
      text: message,
      user: auth.currentUser.displayName,
      uid:  auth.currentUser.uid,
      timestamp: serverTimestamp()
    });
    setMessage('');
    await updateDoc(doc(db, 'rooms', joinedRoom.id, 'presence', auth.currentUser.uid), {
      typing: false
    });
  };

  const handleTyping = async (e) => {
    setMessage(e.target.value);
    await updateDoc(doc(db, 'rooms', joinedRoom.id, 'presence', auth.currentUser.uid), {
      typing: true
    });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() =>
      updateDoc(doc(db, 'rooms', joinedRoom.id, 'presence', auth.currentUser.uid), { typing: false }), 1000);
  };

  /* ───────────────── delete own msg ───────────────── */
  const deleteMessage = async (id) => {
    await deleteDoc(doc(db, 'rooms', joinedRoom.id, 'messages', id));
  };

  /* ───────────────── initial fetch ───────────────── */
  useEffect(() => { fetchRooms(); }, []);

  /* ───────────────── UI ───────────────── */
  if (joinedRoom) {
    return (
      <div style={{ marginTop:'2rem' }}>
        <h2>{joinedRoom.name}</h2>

        {/* presence & typing */}
        <div style={{ marginBottom:'0.5rem', fontSize:'0.9rem', color:'#555' }}>
          <strong>Online:</strong> {online.join(', ') || '—'}
          {typingUsers.length > 0 && (
            <span style={{ marginLeft:10, color:'#f57c00' }}>
              {typingUsers.join(', ')} typing...
            </span>
          )}
        </div>

        {/* chat box */}
        <div style={{
          border:'1px solid #ccc', height:300, overflowY:'auto',
          padding:'0.75rem', marginBottom:'0.5rem'
        }}>
          {messages.map(m => {
            const mine = m.uid === auth.currentUser.uid;
            return (
              <div key={m.id} style={{
                textAlign: mine ? 'right' : 'left',
                marginBottom:10
              }}>
                <div style={{
                  display:'inline-block',
                  padding:'6px 10px',
                  borderRadius:12,
                  background: mine ? '#d1ffd6' : '#f1f0f0'
                }}>
                  <span style={{ fontWeight:'bold' }}>{m.user}: </span>{m.text}
                </div>
                <div style={{ fontSize:'0.7rem', color:'#888' }}>
                  {m.timestamp?.seconds &&
                    new Date(m.timestamp.seconds*1000).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  {mine && (
                    <button
                      onClick={() => deleteMessage(m.id)}
                      style={{
                        border:'none', background:'none',
                        color:'#d00', marginLeft:8, cursor:'pointer'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* input & buttons */}
        <input
          value={message}
          onChange={handleTyping}
          placeholder="Type a message"
          style={{ padding:8, width:'70%' }}
        />
        <button onClick={sendMessage} style={{ padding:8, marginLeft:8 }}>Send</button>
        <button onClick={leaveRoom}  style={{ padding:8, marginLeft:8, background:'#eee' }}>Leave Room</button>
      </div>
    );
  }

  /* ------------- lobby UI ------------- */
  return (
    <div style={{ marginTop:'2rem' }}>
      <h2>Create a Study Room</h2>
      <input
        value={roomName}
        onChange={e => setRoomName(e.target.value)}
        placeholder="Enter room name"
        style={{ padding:8, marginRight:8 }}
      />
      <button onClick={createRoom}>Create Room</button>

      <h3 style={{ marginTop:'2rem' }}>Or Join an Existing Room:</h3>
      <ul>
        {rooms.map(r => (
          <li key={r.id}>
            {r.name}{' '}
            <button onClick={() => joinRoom(r)}>Join</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Room;
