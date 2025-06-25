// src/components/AssessmentDashboard.js
import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  Divider,
  CircularProgress
} from "@mui/material";
import { Assignment, People, CheckCircle } from "@mui/icons-material";

export default function AssessmentDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    setLoading(true);
    let q;
    
    if (auth.currentUser?.claims?.isAdmin) {
      q = query(collection(db, "assessments"));
    } else if (auth.currentUser?.claims?.isAssessor) {
      q = query(
        collection(db, "assessments"),
        where("status", "==", "active")
      );
    } else {
      q = query(
        collection(db, "assessments"),
        where("assignedCandidates", "array-contains", auth.currentUser?.uid)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssessments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const startAssessment = async (assessmentId) => {
    try {
      await updateDoc(doc(db, "assessments", assessmentId), {
        status: "in_progress",
        startedAt: new Date(),
        assessorId: auth.currentUser.uid
      });
    } catch (err) {
      alert(`Error starting assessment: ${err.message}`);
    }
  };

  return (
    <Paper elevation={3} style={{ padding: 24 }}>
      <Typography variant="h6" gutterBottom>
        Assessments
      </Typography>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <Chip
          label="Active"
          onClick={() => setActiveTab("active")}
          color={activeTab === "active" ? "primary" : "default"}
        />
        <Chip
          label="In Progress"
          onClick={() => setActiveTab("in_progress")}
          color={activeTab === "in_progress" ? "primary" : "default"}
        />
        <Chip
          label="Completed"
          onClick={() => setActiveTab("completed")}
          color={activeTab === "completed" ? "primary" : "default"}
        />
      </div>

      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {assessments
            .filter(a => activeTab === "all" || a.status === activeTab)
            .map((assessment) => (
              <ListItem key={assessment.id} divider>
                <ListItemText
                  primary={assessment.title}
                  secondary={
                    <>
                      <div>Status: {assessment.status}</div>
                      <div>Created: {assessment.createdAt?.toDate().toLocaleString()}</div>
                    </>
                  }
                />
                <Button
                  variant="outlined"
                  startIcon={<Assignment />}
                  onClick={() => startAssessment(assessment.id)}
                >
                  {assessment.status === "active" ? "Start" : "Continue"}
                </Button>
              </ListItem>
            ))}
        </List>
      )}
    </Paper>
  );
}
// Add pagination and filtering
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(5);

// In return:
<TablePagination
  rowsPerPageOptions={[5, 10, 25]}
  component="div"
  count={assessments.length}
  rowsPerPage={rowsPerPage}
  page={page}
  onPageChange={(e, newPage) => setPage(newPage)}
  onRowsPerPageChange={(e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }}
/>