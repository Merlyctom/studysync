import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth } from '../firebase';

const db = getFirestore();

const Room = () => {
  const [roomName, setRoomName] = useState('');
  const [rooms, setRooms] = useState([]);
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const fetchRooms = async () => {
    const snapshot = await getDocs(collection(db, 'rooms'));
    const roomList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setRooms(roomList);
  };

  const createRoom = async () => {
    if (!roomName.trim()) return alert('Room name cannot be empty');
    try {
      await addDoc(collection(db, 'rooms'), {
        name: roomName,
        createdAt: new Date(),
      });
      alert(`Room "${roomName}" created!`);
      setRoomName('');
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const joinRoom = (room) => {
    setJoinedRoom(room);
    const q = query(collection(db, 'rooms', room.id, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);
    });
    return () => unsubscribe();
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await addDoc(collection(db, 'rooms', joinedRoom.id, 'messages'), {
        text: message,
        user: auth.currentUser.displayName,
        timestamp: new Date(),
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  if (joinedRoom) {
    return (
      <div style={{ marginTop: '2rem' }}>
        <h2>Room: {joinedRoom.name}</h2>
        <div style={{ border: '1px solid #ccc', padding: '1rem', height: '300px', overflowY: 'scroll' }}>
          {messages.map((msg, index) => (
            <p key={index}><strong>{msg.user}:</strong> {msg.text}</p>
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
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Create a Study Room</h2>
      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Enter room name"
        style={{ padding: '8px', marginRight: '8px' }}
      />
      <button onClick={createRoom}>Create Room</button>

      <h3 style={{ marginTop: '2rem' }}>Or Join an Existing Room</h3>
      <ul>
        {rooms.map(room => (
          <li key={room.id}>
            {room.name}{" "}
            <button onClick={() => joinRoom(room)}>Join</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Room;
