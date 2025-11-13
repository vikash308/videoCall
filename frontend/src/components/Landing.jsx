import React, { useState } from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";


const theme = createTheme({
  palette: {
    primary: {
      main: "#ff9839", // your custom color
    },
  },
});
const Landing = () => {
  const router = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <div className="landingPageContainer">
        {/* ===== NAVBAR ===== */}
        <nav className="navbar">
          <div className="logo">
            <h2>VideoCall</h2>
          </div>

          <div className={`navlist ${menuOpen ? "open" : ""}`}>
            <p onClick={() => router("/guest")}>Join as Guest</p>
            <p onClick={() => router("/auth")}>Register</p>

            <Button
              fullWidth
              variant="contained"
              sx={{
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                width: "fit-content",
                fontSize: "1.2rem",
              }}
            >
              <Link
                to="/auth"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Login
              </Link>
            </Button>
          </div>

          {/* Hamburger icon */}
          <div
            className={`menuIcon ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </nav>

        {/* ===== HERO SECTION ===== */}
        <div className="landingMainContainer">
          <div className="textLanding">
            <h1>
              <span className="highlight">Connect</span> with your loved ones
            </h1>
            <p>
              Cover any distance instantly with <b>Apna Video Call</b>.
            </p>
            <div>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  py: 1.2,
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                  width: "fit-content",
                  fontSize: "1.2rem",
                }}
              >
                <Link
                  to="/auth"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  Get Started
                </Link>
              </Button>
            </div>
          </div>

          <div className="imageMobile">
            <img src="/mobile.png" alt="App preview" />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Landing;
