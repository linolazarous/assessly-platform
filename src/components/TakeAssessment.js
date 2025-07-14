import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Rating,
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import PdfReport from './PdfReport';
import PropTypes from 'prop-types';

export default function TakeAssessment() {
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const docRef = doc(db, 'assessments', assessmentId);
        const unsubscribe = onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setAssessment({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              dueDate: data.dueDate?.toDate()
            });
            
            // Calculate time remaining if there's a time limit
            if (data.timeLimitMinutes) {
              const endTime = new Date(data.startedAt?.toDate().getTime() + data.timeLimitMinutes * 60000);
              setTimeRemaining(Math.max(0, Math.floor((endTime - new Date()) / 1000));
            }
          } else {
            enqueueSnackbar('Assessment not found', { variant: 'error' });
            navigate('/assessments');
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error('Error loading assessment:', err);
        enqueueSnackbar('Failed to load assessment', { variant: 'error' });
        setLoading(false);
        navigate('/assessments');
      }
    };

    fetchAssessment();
  }, [assessmentId, enqueueSnackbar, navigate]);

  useEffect(() => {
    if (timeRemaining === null) return;

    const timer = timeRemaining > 0 && setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    // Validate required questions
    const requiredQuestions = assessment.questions
      .map((q, i) => (q.required ? i : null))
      .filter(i => i !== null);
    
    const missingAnswers = requiredQuestions.filter(i => 
      answers[i] === undefined || 
      answers[i] === '' || 
      (Array.isArray(answers[i]) && answers[i].length === 0)
    );
    
    if (missingAnswers.length > 0) {
      enqueueSnackbar(
        `Please answer all required questions (${missingAnswers.map(i => i + 1).join(', ')})`, 
        { variant: 'error' }
      );
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'responses'), {
        assessmentId,
        answers,
        submittedAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        organizationId: assessment.organizationId,
        status: 'completed',
        durationMinutes: assessment.timeLimitMinutes 
          ? assessment.timeLimitMinutes - (timeRemaining / 60)
          : null
      });
      
      // Update assessment status if needed
      await updateDoc(doc(db, 'assessments', assessmentId), {
        status: 'completed',
        completedAt: serverTimestamp()
      });
      
      enqueueSnackbar('Assessment submitted successfully!', { variant: 'success' });
      navigate(`/assessments/${assessmentId}/results`);
    } catch (err) {
      console.error('Submission error:', err);
      enqueueSnackbar(`Failed to submit: ${err.message}`, { 
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!assessment) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Assessment not found
      </Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          {assessment.title}
        </Typography>
        
        {timeRemaining !== null && (
          <Typography variant="h6" color="error">
            Time Remaining: {formatTime(timeRemaining)}
          </Typography>
        )}
      </Box>

      <Typography variant="body1" paragraph>
        {assessment.description}
      </Typography>

      {timeRemaining !== null && (
        <LinearProgress 
          variant="determinate" 
          value={100 - (timeRemaining / (assessment.timeLimitMinutes * 60) * 100)} 
          sx={{ mb: 3, height: 8 }}
        />
      )}

      <Divider sx={{ my: 3 }} />

      {assessment.questions.map((question, qIndex) => (
        <Box key={`q-${qIndex}`} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {qIndex + 1}. {question.text}
            {question.required && (
              <Typography component="span" color="error" sx={{ ml: 1 }}>
                *
              </Typography>
            )}
          </Typography>

          {question.type === 'text' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={answers[qIndex] || ''}
              onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
              placeholder="Type your answer here..."
            />
          )}

          {question.type === 'multiple_choice' && (
            <RadioGroup
              value={answers[qIndex] || ''}
              onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
            >
              {question.options.map((option, oIndex) => (
                <FormControlLabel
                  key={`opt-${oIndex}`}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          )}

          {question.type === 'checkbox' && (
            <Box>
              {question.options.map((option, oIndex) => (
                <FormControlLabel
                  key={`opt-${oIndex}`}
                  control={
                    <Checkbox
                      checked={answers[qIndex]?.includes(option) || false}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...(answers[qIndex] || []), option]
                          : (answers[qIndex] || []).filter(v => v !== option);
                        handleAnswerChange(qIndex, newValue);
                      }}
                    />
                  }
                  label={option}
                />
              ))}
            </Box>
          )}

          {question.type === 'rating' && (
            <Rating
              value={parseInt(answers[qIndex]) || 0}
              onChange={(_, newValue) => handleAnswerChange(qIndex, newValue)}
              max={question.maxRating || 5}
              size="large"
            />
          )}
        </Box>
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <PdfReport assessment={assessment} answers={answers} />
        
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ minWidth: 180 }}
        >
          {submitting ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Submitting...
            </>
          ) : (
            'Submit Assessment'
          )}
        </Button>
      </Box>
    </Paper>
  );
}
