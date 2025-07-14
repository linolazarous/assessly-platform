import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase';
import { useSnackbar } from 'notistack';

// Cache for similar responses to reduce API calls
const scoringCache = new Map();

export const analyzeTextResponse = async (text, questionId, assessmentId) => {
  try {
    // Check cache first
    const cacheKey = `${questionId}-${text.substring(0, 50)}`;
    if (scoringCache.has(cacheKey)) {
      return scoringCache.get(cacheKey);
    }

    // Call Cloud Function for AI scoring
    const scoreResponse = httpsCallable(functions, 'analyzeAssessmentResponse');
    const { data } = await scoreResponse({
      text,
      questionId,
      assessmentId,
      metadata: {
        timestamp: new Date().toISOString(),
        length: text.length
      }
    });

    // Cache the result
    scoringCache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('AI Scoring Error:', error);
    
    // Fallback to basic scoring if AI fails
    return getBasicTextScore(text);
  }
};

const getBasicTextScore = (text) => {
  if (!text || text.length < 10) {
    return {
      score: 0,
      feedback: ['Response too short'],
      confidence: 0.5
    };
  }

  const keywords = ["experience", "skills", "example", "demonstrate", "achieved"];
  const lengthScore = Math.min(text.length / 100, 1);
  const keywordScore = keywords.filter(kw => 
    text.toLowerCase().includes(kw)
  ).length / keywords.length;
  
  const totalScore = Math.round((lengthScore * 0.6 + keywordScore * 0.4) * 100);
  
  return {
    score: totalScore,
    feedback: [
      totalScore > 75 ? "Excellent detailed response" : 
      totalScore > 50 ? "Good response with room for improvement" : 
      totalScore > 25 ? "Basic response - needs more detail" : "Insufficient response",
      `Keywords matched: ${Math.round(keywordScore * 100)}%`,
      `Length score: ${Math.round(lengthScore * 100)}%`
    ],
    confidence: 0.8
  };
};

export const evaluateAnswers = async (answers, questions, assessmentId) => {
  const results = await Promise.all(
    questions.map(async (question, index) => {
      const answer = answers[index];
      
      if (!answer) {
        return {
          questionId: question.id,
          score: 0,
          feedback: ['No response provided'],
          confidence: 1
        };
      }

      if (question.type === 'text') {
        return {
          questionId: question.id,
          ...await analyzeTextResponse(answer, question.id, assessmentId)
        };
      }

      // Handle other question types (multiple choice, etc.)
      return {
        questionId: question.id,
        score: question.correctAnswer === answer ? 100 : 0,
        feedback: question.correctAnswer === answer ? 
          ['Correct answer'] : ['Incorrect answer'],
        confidence: 1
      };
    })
  );
  
  const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const overallFeedback = getOverallFeedback(totalScore);
  
  return { 
    results, 
    totalScore: Math.round(totalScore),
    overallFeedback,
    evaluatedAt: new Date().toISOString()
  };
};

const getOverallFeedback = (score) => {
  if (score >= 90) return 'Outstanding performance across all areas';
  if (score >= 75) return 'Strong performance with few areas for improvement';
  if (score >= 50) return 'Satisfactory performance with several areas to develop';
  if (score >= 25) return 'Basic understanding demonstrated - needs significant improvement';
  return 'Insufficient responses - substantial development needed';
};
