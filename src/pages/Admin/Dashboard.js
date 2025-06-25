import { useCollection } from 'react-firebase-hooks/firestore';

export default function AdminDashboard() {
  const [assessments] = useCollection(
    query(collection(db, 'assessments'), 
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  return (
    <div>
      <h1>Organization Analytics</h1>
      <p>Total assessments: {assessments?.size || 0}</p>
    </div>
  );
}