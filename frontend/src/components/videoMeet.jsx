import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
  Badge,
  IconButton,
  TextField,
  Button,
  Avatar,
  Typography,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import PeopleIcon from "@mui/icons-material/People";
import server from "../environment";

import styles from "../styles/videoComponent.module.css";

const server_url = server;
var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);

  const localVideoref = useRef(null);
  const videoRef = useRef([]); // keep current videos

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);

  const [video, setVideo] = useState(false);
  const [audio, setAudio] = useState(false);
  const [screen, setScreen] = useState(false);

  const [screenAvailable, setScreenAvailable] = useState(false);

  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  const [videos, setVideos] = useState([]); // remote participants
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);

  const [chatOpen, setChatOpen] = useState(true);

  // Run permission check only once
  useEffect(() => {
    getPermissions();
    // cleanup on unmount
    return () => {
      try {
        if (localVideoref.current?.srcObject) {
          localVideoref.current.srcObject
            .getTracks()
            .forEach((t) => t && t.stop && t.stop());
        }
      } catch (e) {}
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Permissions & local stream ----------
  const getPermissions = async () => {
    try {
      // test capability
      setScreenAvailable(Boolean(navigator.mediaDevices?.getDisplayMedia));

      // try to get default media to check permission
      const v = await navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => true)
        .catch(() => false);
      const a = await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => true)
        .catch(() => false);

      setVideoAvailable(v);
      setAudioAvailable(a);

      // default to enable both if available
      setVideo(v);
      setAudio(a);

      if ((v || a) && !window.localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: v,
          audio: a,
        });
        window.localStream = stream;
        if (localVideoref.current) localVideoref.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("getPermissions err:", err);
    }
  };

  // ---------- media setup helpers ----------
  const silence = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  const black = ({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    const stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  const getUserMediaSuccess = (stream) => {
    try {
      window.localStream?.getTracks()?.forEach((t) => t.stop && t.stop());
    } catch (e) {}
    window.localStream = stream;
    if (localVideoref.current) localVideoref.current.srcObject = stream;

    // replace tracks on all connections and create offers
    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      try {
        connections[id].addStream(window.localStream);
      } catch (e) {}
      connections[id]
        .createOffer()
        .then((description) => {
          return connections[id].setLocalDescription(description);
        })
        .then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: connections[id].localDescription })
          );
        })
        .catch((e) => console.log(e));
    }

    // handle track end
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setVideo(false);
        setAudio(false);
        try {
          const tracks = localVideoref.current.srcObject.getTracks();
          tracks.forEach((t) => t.stop && t.stop());
        } catch (e) {}
        const blackSilence = new MediaStream([black(), silence()]);
        window.localStream = blackSilence;
        if (localVideoref.current)
          localVideoref.current.srcObject = window.localStream;
        for (let id in connections) {
          try {
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          } catch (e) {}
        }
      };
    });
  };

  const getUserMedia = async () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video,
          audio: audio,
        });
        getUserMediaSuccess(stream);
      } catch (e) {
        console.log("getUserMedia err", e);
      }
    } else {
      try {
        const tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((t) => t.stop && t.stop());
      } catch (e) {}
    }
  };

  // ---------- screen share ----------
  const getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream?.getTracks()?.forEach((t) => t.stop && t.stop());
    } catch (e) {}

    window.localStream = stream;
    if (localVideoref.current) localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      try {
        connections[id].addStream(window.localStream);
      } catch (e) {}
      connections[id]
        .createOffer()
        .then((description) => connections[id].setLocalDescription(description))
        .then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: connections[id].localDescription })
          );
        })
        .catch((e) => console.log(e));
    }

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);
        try {
          const tracks = localVideoref.current.srcObject.getTracks();
          tracks.forEach((t) => t.stop && t.stop());
        } catch (e) {}
        const blackSilence = new MediaStream([black(), silence()]);
        window.localStream = blackSilence;
        if (localVideoref.current)
          localVideoref.current.srcObject = window.localStream;
        // restore webcam/mic if enabled
        getUserMedia();
      };
    });
  };

  // ---------- socket message handling ----------
  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId === socketIdRef.current) return;

    if (signal.sdp) {
      connections[fromId]
        .setRemoteDescription(new window.RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === "offer") {
            connections[fromId]
              .createAnswer()
              .then((description) =>
                connections[fromId].setLocalDescription(description)
              )
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  fromId,
                  JSON.stringify({ sdp: connections[fromId].localDescription })
                );
              })
              .catch((e) => console.log(e));
          }
        })
        .catch((e) => console.log(e));
    }

    if (signal.ice) {
      connections[fromId]
        .addIceCandidate(new window.RTCIceCandidate(signal.ice))
        .catch((e) => console.log(e));
    }
  };

  // ---------- connect to socket server ----------
  const connectToSocketServer = () => {
    if (socketRef.current) return; // already connected
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((prev) => prev.filter((v) => v.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          if (connections[socketListId]) return;
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );

          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          connections[socketListId].onaddstream = (event) => {
            setVideos((prevVideos) => {
              const found = prevVideos.find((v) => v.socketId === socketListId);
              if (found) {
                return prevVideos.map((v) =>
                  v.socketId === socketListId
                    ? { ...v, stream: event.stream }
                    : v
                );
              } else {
                return [
                  ...prevVideos,
                  { socketId: socketListId, stream: event.stream },
                ];
              }
            });
          };

          if (window.localStream) {
            try {
              connections[socketListId].addStream(window.localStream);
            } catch (e) {}
          } else {
            const blackSilence = new MediaStream([black(), silence()]);
            window.localStream = blackSilence;
            connections[socketListId].addStream(window.localStream);
          }
        });

        // if I'm the joining client, create offers to all
        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}
            connections[id2]
              .createOffer()
              .then((description) =>
                connections[id2].setLocalDescription(description)
              )
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  id2,
                  JSON.stringify({ sdp: connections[id2].localDescription })
                );
              })
              .catch((e) => console.log(e));
          }
        }
      });
    });
  };

  // ---------- UI handlers ----------
  const handleVideoToggle = async () => {
    if (video) {
      // Turning camera off
      setVideo(false);
      try {
        window.localStream?.getVideoTracks()?.forEach((track) => track.stop());
      } catch (err) {
        console.error("Error stopping video:", err);
      }
    } else {
      // Turning camera on again
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: audio,
        });

        const videoTrack = newStream.getVideoTracks()[0];

        // Replace track in all peer connections
        Object.values(connections).forEach((conn) => {
          const sender = conn
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        });

        // Update local preview
        window.localStream = newStream;
        if (localVideoref.current) {
          localVideoref.current.srcObject = newStream;
        }

        setVideo(true);
      } catch (err) {
        console.error("Error re-enabling video:", err);
      }
    }
  };

  const handleAudioToggle = () => {
    const newAudio = !audio;
    setAudio(newAudio);
    try {
      window.localStream
        ?.getAudioTracks()
        ?.forEach((t) => (t.enabled = newAudio));
    } catch (e) {}
  };
  const handleScreenToggle = async () => {
    const newScreen = !screen;
    setScreen(newScreen);
    if (newScreen) {
      try {
        const ds = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        getDisplayMediaSuccess(ds);
      } catch (e) {
        console.log("display media err", e);
        setScreen(false);
      }
    } else {
      // stop display tracks -> getUserMedia will restore
      try {
        window.localStream?.getTracks()?.forEach((t) => t.stop && t.stop());
      } catch (e) {}
      await getUserMedia();
    }
  };

  const handleEndCall = () => {
    try {
      window.localStream?.getTracks()?.forEach((t) => t.stop && t.stop());
    } catch (e) {}
    try {
      socketRef.current?.disconnect();
    } catch (e) {}
    window.location.href = "/";
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [...prevMessages, { sender, data }]);
    if (socketIdSender && socketIdSender !== socketIdRef.current) {
      setNewMessages((n) => n + 1);
    }
  };

  const sendMessage = () => {
    if (!message || !socketRef.current) return;
    socketRef.current.emit("chat-message", message, username);
    setMessages((prev) => [...prev, { sender: username, data: message }]);
    setMessage("");
  };

  const connect = () => {
    if (!username) return alert("Please enter a username");
    setAskForUsername(false);
    // prepare local media then connect
    getUserMedia();
    connectToSocketServer();
  };

  // ---------- render ----------
  return (
    <div className={styles.wrapper}>
      {askForUsername ? (
        <div className={styles.lobby}>
          <div className={styles.lobbyCard}>
            <Avatar sx={{ bgcolor: "#e67c1b" }}>{username?.[0] || "U"}</Avatar>
            <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>
              Enter Lobby
            </Typography>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "white",
                  },
                  "&:hover fieldset": {
                    borderColor: "#ff9839", // optional hover color
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#e86c00", // when active
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "white",
                },
                input: { color: "white" },
              }}
            />
            <div className={styles.lobbyActions}>
              <Button
                variant="contained"
                onClick={connect}
                sx={{
                  backgroundColor: "#e86c00",
                  "&:hover": { backgroundColor: "#e86c00" },
                  color: "#fff",
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontSize: "1.2rem",
                }}
              >
                Connect
              </Button>
            </div>
            <div className={styles.previewVideo}>
              <video ref={localVideoref} autoPlay muted playsInline />
              <p className={styles.previewHint}>Local preview</p>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.callContainer}>
          {/* left: videos grid */}
          <div className={styles.videosArea}>
            <div className={styles.localContainer}>
              <video
                className={styles.localVideo}
                ref={localVideoref}
                autoPlay
                muted
                playsInline
              />
              <div className={styles.participantBadge}>
                <Typography variant="subtitle2">{username || "You"}</Typography>
              </div>
            </div>

            <div className={styles.gridVideos}>
              {videos.map((v) => (
                <div key={v.socketId} className={styles.remoteVideoCard}>
                  <video
                    ref={(ref) => {
                      if (ref && v.stream) ref.srcObject = v.stream;
                    }}
                    autoPlay
                    playsInline
                  />
                  <div className={styles.remoteBadge}>
                    <Typography variant="caption">{v.socketId}</Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right: chat & participants */}
          <aside
            className={`${styles.sidePanel} ${chatOpen ? styles.open : ""}`}
          >
            <div className={styles.sideHeader}>
              <div className={styles.sideTitle}>
                <ChatIcon /> <span>Chat</span>
              </div>
              <div className={styles.sideControls}>
                <Badge badgeContent={newMessages} color="secondary">
                  <PeopleIcon />
                </Badge>
                <IconButton
                  onClick={() => setChatOpen((s) => !s)}
                  size="small"
                  sx={{ color: "#fff" }}
                >
                  {chatOpen ? <ChatIcon /> : <ChatIcon />}
                </IconButton>
              </div>
            </div>

            <div className={styles.chatBox}>
              {messages.length ? (
                messages.map((m, idx) => (
                  <div key={idx} className={styles.chatMessage}>
                    <div className={styles.chatSender}>{m.sender}</div>
                    <div className={styles.chatText}>{m.data}</div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyChat}>No messages yet</div>
              )}
            </div>

            <div className={styles.chatInput}>
              <TextField
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                size="small"
                placeholder="Type a message..."
                fullWidth
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button
                variant="contained"
                onClick={sendMessage}
                sx={{ ml: 1, backgroundColor: "#e86c00" }}
              >
                Send
              </Button>
            </div>

            <div className={styles.participantsList}>
              <Typography variant="subtitle2">Participants</Typography>
              <div className={styles.participantsGrid}>
                {/* show participant thumbnails (including you) */}
                <div className={styles.participantItem}>
                  <Avatar sx={{ bgcolor: "#e86c00" }}>
                    {username?.[0] || "U"}
                  </Avatar>
                  <div className={styles.participantName}>{username}</div>
                </div>
                {videos.map((v) => (
                  <div key={v.socketId} className={styles.participantItem}>
                    <Avatar />
                    <div className={styles.participantName}>
                      {v.socketId.slice(0, 6)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* bottom control bar */}
          <div className={styles.controlsBar}>
            <IconButton
              onClick={handleVideoToggle}
              className={styles.controlBtn}
            >
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleEndCall} className={styles.endBtn}>
              <CallEndIcon />
            </IconButton>

            <IconButton
              onClick={handleAudioToggle}
              className={styles.controlBtn}
            >
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton
                onClick={handleScreenToggle}
                className={styles.controlBtn}
              >
                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            )}

            <IconButton
              onClick={() => setChatOpen((s) => !s)}
              className={styles.controlBtn}
            >
              <Badge badgeContent={newMessages} color="error">
                <ChatIcon />
              </Badge>
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
