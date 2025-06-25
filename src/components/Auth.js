// src/components/Auth.js
import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup 
} from "firebase/auth";
import { auth, functions, httpsCallable } from "../firebase";
import { Button, TextField, Paper, Typography, Select, MenuItem } from "@mui/material";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("assessor");
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        const setRole = httpsCallable(functions, 'setRole');
        await setRole({ uid: user.uid, role });
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      alert(`Google login failed: ${err.message}`);
    }
  };

  return (
    <Paper elevation={3} style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
      <Typography variant="h5" gutterBottom>
        {isLogin ? "Login" : "Register"}
      </Typography>
      
      <TextField
        label="Email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {!isLogin && (
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="assessor">Assessor</MenuItem>
          <MenuItem value="candidate">Candidate</MenuItem>
        </Select>
      )}

      <Button 
        variant="contained" 
        color="primary" 
        fullWidth 
        onClick={handleAuth}
        style={{ marginTop: 16 }}
      >
        {isLogin ? "Login" : "Register"}
      </Button>

      <Button 
        variant="outlined" 
        fullWidth 
        onClick={googleLogin}
        style={{ marginTop: 8 }}
      >
        Sign in with Google
      </Button>

      <Button 
        color="secondary" 
        onClick={() => setIsLogin(!isLogin)}
        style={{ marginTop: 8 }}
      >
        {isLogin ? "Need an account? Register" : "Already have an account? Login"}
      </Button>
    </Paper>
  );
}