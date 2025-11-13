import * as React from "react";
import {
  Avatar,
  Button,
  TextField,
  Box,
  Snackbar,
  Typography,
  Paper,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";

// Custom dark theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ff9839", // Indigo
    },
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
});

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0 = login, 1 = register
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      } else {
        let result = await handleRegister(name, username, password);
        setMessage(result);
        setOpen(true);
        setFormState(0);
        setUsername("");
        setPassword("");
        setName("");
        setError("");
      }
    } catch (err) {
      let message = err?.response?.data?.message || "Something went wrong";
      setError(message);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            backgroundColor: "background.paper",
            boxShadow: "0 0 30px rgba(0,0,0,0.4)",
          }}
        >
          <Avatar sx={{ m: "0 auto", bgcolor: "primary.main" }}>
            <LockOutlinedIcon />
          </Avatar>

          <Typography variant="h5" sx={{ mt: 2, mb: 3, fontWeight: 600 }}>
            {formState === 0 ? "Welcome Back 👋" : "Create an Account"}
          </Typography>

          <Box
            sx={{ display: "flex", justifyContent: "center", mb: 2, gap: 1 }}
          >
            <Button
              variant={formState === 0 ? "contained" : "outlined"}
              onClick={() => setFormState(0)}
              sx={{ flex: 1 }}
            >
              Sign In
            </Button>
            <Button
              variant={formState === 1 ? "contained" : "outlined"}
              onClick={() => setFormState(1)}
              sx={{ flex: 1 }}
            >
              Sign Up
            </Button>
          </Box>

          <Box component="form" noValidate sx={{ mt: 1 }}>
            {formState === 1 && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                InputLabelProps={{ style: { color: "#cbd5e1" } }}
                InputProps={{ style: { color: "#fff" } }}
              />
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputLabelProps={{ style: { color: "#cbd5e1" } }}
              InputProps={{ style: { color: "#fff" } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ style: { color: "#cbd5e1" } }}
              InputProps={{ style: { color: "#fff" } }}
            />

            {error && (
              <Typography sx={{ color: "error.main", mt: 1 }}>
                {error}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
              }}
              onClick={handleAuth}
            >
              {formState === 0 ? "Login" : "Register"}
            </Button>
          </Box>
        </Paper>

        <Snackbar open={open} autoHideDuration={4000} message={message} />
      </Box>
    </ThemeProvider>
  );
}
