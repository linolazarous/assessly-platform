import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup 
} from 'firebase/auth';
import { 
  Button, 
  TextField, 
  Paper, 
  Typography, 
  Select, 
  MenuItem, 
  Divider,
  CircularProgress,
  InputAdornment,
  IconButton,
  Box
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  Google,
  AccountCircle,
  HowToReg
} from '@mui/icons-material';
import { auth, functions, httpsCallable } from '../firebase';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

export default function Auth({ disableSignup = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('assessor');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const validateForm = () => {
    if (!email || !email.includes('@')) {
      enqueueSnackbar('Please enter a valid email', { variant: 'error' });
      return false;
    }
    if (!password || password.length < 6) {
      enqueueSnackbar('Password must be at least 6 characters', { variant: 'error' });
      return false;
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        enqueueSnackbar('Login successful', { variant: 'success' });
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        const setRoleFn = httpsCallable(functions, 'setRole');
        await setRoleFn({ uid: user.uid, role });
        enqueueSnackbar('Account created successfully', { variant: 'success' });
      }
    } catch (err) {
      console.error('Auth error:', err);
      let message = err.message;
      if (err.code === 'auth/email-already-in-use') {
        message = 'Email already in use. Please login instead.';
      }
      enqueueSnackbar(message, { 
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      enqueueSnackbar('Google login successful', { variant: 'success' });
    } catch (err) {
      console.error('Google auth error:', err);
      enqueueSnackbar(`Google login failed: ${err.message}`, { 
        variant: 'error',
        autoHideDuration: 5000
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 450, width: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <AccountCircle sx={{ fontSize: 60, color: 'primary.main' }} />
          <Typography variant="h5" component="h1" sx={{ mt: 1 }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Typography>
        </Box>

        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {!isLogin && !disableSignup && (
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            fullWidth
            margin="dense"
            sx={{ mt: 2 }}
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
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ mt: 3, py: 1.5 }}
        >
          {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
        </Button>

        <Divider sx={{ my: 3 }}>OR</Divider>

        <Button
          variant="outlined"
          fullWidth
          onClick={googleLogin}
          startIcon={<Google />}
          sx={{ mb: 2 }}
        >
          Continue with Google
        </Button>

        {!disableSignup && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <Button
                color="primary"
                onClick={() => setIsLogin(!isLogin)}
                size="small"
                sx={{ ml: 1 }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Button>
            </Typography>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

Auth.propTypes = {
  disableSignup: PropTypes.bool
};
