import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function TakeAssessment() {
  const [assessments, setAssessments] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const fetchAssessments = async () => {
      const snapshot = await getDocs(collection(db, "assessments"));
      setAssessments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchAssessments();
  }, []);

  const submitAnswers = () => {
    alert(`Answers submitted: ${JSON.stringify(answers)}`);
    // TODO: Save to Firestore
  };

  return (
    <div>
      {assessments.map((assessment) => (
        <div key={assessment.id}>
          <h3>{assessment.title}</h3>
          {assessment.questions.map((q, i) => (
            <div key={i}>
              <p>{q.text}</p>
              {q.type === "text" ? (
                <input
                  type="text"
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                />
              ) : (
                <select onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              )}
            </div>
          ))}
        </div>
      ))}
      <button onClick={submitAnswers}>Submit</button>
    </div>
  );
}

export default TakeAssessment;

<PdfReport assessment={assessments[0]} answers={answers} />


// Add submission handling with progress state
const [submitting, setSubmitting] = useState(false);

const submitAnswers = async () => {
  setSubmitting(true);
  try {
    await addDoc(collection(db, `organizations/${orgId}/responses`), {
      assessmentId: assessment.id,
      answers,
      submittedAt: serverTimestamp(),
      userId: auth.currentUser.uid
    });
    enqueueSnackbar('Answers submitted!', { variant: 'success' });
  } catch (err) {
    enqueueSnackbar(`Submission failed: ${err.message}`, { variant: 'error' });
  } finally {
    setSubmitting(false);
  }
};