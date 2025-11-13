import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LandingPage from "./components/Landing";
import Authentication from "./components/Authentication";
import { AuthProvider } from "./contexts/AuthContext";
import VideoMeetComponent from "./components/videoMeet";
import Home from "./components/Home";
import History from "./components/History";

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/auth" element={<Authentication />} />
            <Route path="/home" s element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/:url" element={<VideoMeetComponent />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
