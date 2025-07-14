import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  CircularProgress,
  Skeleton,
  Typography,
  Box
} from '@mui/material';
import { db, auth } from '../../firebase';
import PropTypes from 'prop-types';

export default function OrgSelector({ currentOrg, setCurrentOrg, size = 'medium' }) {
  const [orgsSnapshot, loading, error] = useCollection(
    query(
      collection(db, 'organizations'),
      where('members', 'array-contains', auth.currentUser?.uid)
    )
  );

  const handleChange = (event) => {
    setCurrentOrg(event.target.value);
  };

  if (error) {
    console.error('Error loading organizations:', error);
    return (
      <Typography color="error">
        Failed to load organizations
      </Typography>
    );
  }

  if (loading) {
    return (
      <Skeleton 
        variant="rounded" 
        width={size === 'small' ? 180 : 200} 
        height={size === 'small' ? 40 : 56} 
      />
    );
  }

  if (!orgsSnapshot || orgsSnapshot.empty) {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="body2" color="text.secondary">
          No organizations available
        </Typography>
      </Box>
    );
  }

  return (
    <FormControl fullWidth size={size}>
      <InputLabel>Organization</InputLabel>
      <Select
        value={currentOrg || ''}
        label="Organization"
        onChange={handleChange}
        disabled={orgsSnapshot.size <= 1}
      >
        {orgsSnapshot.docs.map(doc => (
          <MenuItem key={doc.id} value={doc.id}>
            {doc.data().name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

OrgSelector.propTypes = {
  currentOrg: PropTypes.string,
  setCurrentOrg: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['small', 'medium'])
};
