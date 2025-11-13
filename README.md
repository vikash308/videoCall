# Apna Video Call — Backend

A production-ready backend for **VideoCall** built with **Node.js**, **Express**, **Socket.io**, **Reactjs** and **WebRTC** (signaling), with **JWT** authentication and **MongoDB** storage.

---

## 🚀 Features

- Real-time video & audio calling using **WebRTC** (peer-to-peer media).
- **Socket.io** for signaling (SDP & ICE exchange) and chat messages.
- JWT-based authentication (register / login).
- MongoDB (with Mongoose) for user storage and optional call/chat persistence.
- REST endpoints for auth and user management.
- Environment-driven configuration using `.env`.
- Ready for deployment (Render / Railway / Heroku / VPS).
- Camera and Mic controls + end call button
- Beautiful Material UI components with custom CSS styling
- One-on-one and group video calls using WebRTC (peer-to-peer)
- Live chat during video calls (Socket.io)


---

## 🧱 Tech Stack

**Core**
- **Node.js** — JavaScript runtime for server-side code  
- **Express.js** — Minimal and flexible web framework for REST APIs  
- **Socket.io** — Real-time bi-directional event-based communication (signaling + chat)  
- **WebRTC** — Browser-native peer-to-peer media (video/audio) and data channels  
- **MongoDB** + **Mongoose** — NoSQL DB + ODM for schemas & queries  
- **JWT (jsonwebtoken)** — Token-based authentication  
- **dotenv** — Load environment variables from `.env`  
- **bcrypt** — Password hashing
- **crypto** — Password hashing

- **WebRTC** — Peer-to-peer audio/video streaming  
- **Socket.io Client** — Real-time signaling and chat transport  
- **RTCPeerConnection** — Browser API for creating media connections

**Optional / Helpful**
- **Nodemon** — Dev auto-reload  
- **Helmet** — HTTP header security  
- **Morgan** — Logging HTTP requests  
- **Validator** — Input validation

- **Axios** — For API requests    
- **React Icons / MUI Icons** — For buttons and call controls 
- **React Context API** — Global user state and auth handling  
---
