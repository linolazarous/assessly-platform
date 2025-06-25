import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

function CreateAssessment() {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ text: "", type: "text" }]);

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "text" }]);
  };

  const saveAssessment = async () => {
    try {
      await addDoc(collection(db, "assessments"), { title, questions });
      alert("Assessment saved!");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Assessment Title" 
        onChange={(e) => setTitle(e.target.value)} 
      />
      {questions.map((q, i) => (
        <div key={i}>
          <input
            placeholder="Question"
            value={q.text}
            onChange={(e) => {
              const newQuestions = [...questions];
              newQuestions[i].text = e.target.value;
              setQuestions(newQuestions);
            }}
          />
          <select
            value={q.type}
            onChange={(e) => {
              const newQuestions = [...questions];
              newQuestions[i].type = e.target.value;
              setQuestions(newQuestions);
            }}
          >
            <option value="text">Text</option>
            <option value="multiple-choice">Multiple Choice</option>
          </select>
        </div>
      ))}
      <button onClick={addQuestion}>Add Question</button>
      <button onClick={saveAssessment}>Save Assessment</button>
    </div>
  );
}

// Add validation and error handling
const saveAssessment = async () => {
  if (!title.trim()) {
    alert('Assessment title is required');
    return;
  }

  try {
    await addDoc(collection(db, "assessments"), { 
      title,
      questions,
      createdAt: serverTimestamp(), // Add server timestamp
      createdBy: auth.currentUser.uid,
      orgId: currentOrg // Add organization reference
    });
    enqueueSnackbar('Assessment saved!', { variant: 'success' });
  } catch (err) {
    enqueueSnackbar(`Save failed: ${err.message}`, { variant: 'error' });
  }
};

export default CreateAssessment;