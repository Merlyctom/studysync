import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { app } from '../firebase';

const db = getFirestore(app);

const Room = () => {
  const [roomName, setRoomName] = useState('');
  const [rooms, setRooms] = useState([]);
  const [joinedRoom, setJoinedRoom] = useState(null);

  const createRoom = async () => {
    if (!roomName.trim()) return alert("Room name cannot be empty");
    try {
      await addDoc(collection(db, "rooms"), {
        name: roomName,
        createdAt: new Date(),
      });
      alert(`Room "${roomName}" created!`);
      setRoomName('');
      fetchRooms(); // refresh list
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const fetchRooms = async () => {
    const snapshot = await getDocs(collection(db, "rooms"));
    const roomList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setRooms(roomList);
  };

  const joinRoom = (room) => {
    setJoinedRoom(room);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  if (joinedRoom) {
    return (
      <div style={{ marginTop: '2rem' }}>
        <h2>Joined Room: {joinedRoom.name}</h2>
        {/* Chat UI will go here in next step */}
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
