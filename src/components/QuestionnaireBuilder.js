// src/components/QuestionnaireBuilder.js
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { 
  Button, 
  TextField, 
  Paper, 
  Typography, 
  Select, 
  MenuItem, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";

const QUESTION_TYPES = [
  { value: "text", label: "Text Answer" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "rating", label: "Rating (1-5)" },
  { value: "file", label: "File Upload" }
];

export default function QuestionnaireBuilder() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", type: "text", options: [] }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "text", options: [] }]);
  };

  const removeQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = [...newQuestions[qIndex].options, ""];
    setQuestions(newQuestions);
  };

  const saveQuestionnaire = async () => {
    try {
      await addDoc(collection(db, "questionnaires"), {
        title,
        description,
        questions,
        createdAt: new Date(),
        createdBy: auth.currentUser.uid
      });
      alert("Questionnaire saved successfully!");
    } catch (err) {
      alert(`Error saving questionnaire: ${err.message}`);
    }
  };

  return (
    <Paper elevation={3} style={{ padding: 24, margin: "16px 0" }}>
      <Typography variant="h6" gutterBottom>
        Create New Questionnaire
      </Typography>
      
      <TextField
        label="Title"
        fullWidth
        margin="normal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <TextField
        label="Description"
        fullWidth
        multiline
        rows={3}
        margin="normal"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Divider style={{ margin: "24px 0" }} />

      <Typography variant="subtitle1" gutterBottom>
        Questions
      </Typography>

      <List>
        {questions.map((q, qIndex) => (
          <ListItem key={qIndex} divider>
            <div style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body1" style={{ marginRight: 16 }}>
                  Q{qIndex + 1}
                </Typography>
                <IconButton 
                  color="error" 
                  onClick={() => removeQuestion(qIndex)}
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </div>

              <TextField
                label="Question Text"
                fullWidth
                margin="normal"
                value={q.text}
                onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
              />

              <Select
                value={q.type}
                onChange={(e) => updateQuestion(qIndex, "type", e.target.value)}
                fullWidth
                margin="normal"
              >
                {QUESTION_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>

              {q.type === "multiple_choice" && (
                <div style={{ marginTop: 16 }}>
                  <Typography variant="caption">Options</Typography>
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} style={{ display: "flex", alignItems: "center" }}>
                      <TextField
                        value={option}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          newQuestions[qIndex].options[oIndex] = e.target.value;
                          setQuestions(newQuestions);
                        }}
                        fullWidth
                        margin="dense"
                      />
                    </div>
                  ))}
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => addOption(qIndex)}
                    startIcon={<Add />}
                    style={{ marginTop: 8 }}
                  >
                    Add Option
                  </Button>
                </div>
              )}
            </div>
          </ListItem>
        ))}
      </List>

      <Button
        variant="outlined"
        onClick={addQuestion}
        startIcon={<Add />}
        style={{ marginRight: 16 }}
      >
        Add Question
      </Button>

      <Button
        variant="contained"
        color="primary"
        onClick={saveQuestionnaire}
      >
        Save Questionnaire
      </Button>
    </Paper>
  );
}