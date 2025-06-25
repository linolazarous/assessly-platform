import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

export default function OrgSelector({ currentOrg, setCurrentOrg }) {
  const [orgsSnapshot, loading] = useCollection(
    query(
      collection(db, 'organizations'),
      where('members', 'array-contains', auth.currentUser.uid)
    )
  );

  const handleChange = (event) => {
    setCurrentOrg(event.target.value);
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <FormControl fullWidth size="small">
      <InputLabel>Organization</InputLabel>
      <Select
        value={currentOrg}
        label="Organization"
        onChange={handleChange}
      >
        {orgsSnapshot?.docs.map(doc => (
          <MenuItem key={doc.id} value={doc.id}>
            {doc.data().name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// Add empty state and loading skeleton
if (loading) return <Skeleton variant="rounded" width={200} height={40} />;
if (orgsSnapshot?.empty) return <Typography>No organizations found</Typography>;