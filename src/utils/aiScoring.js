// src/utils/aiScoring.js
export const analyzeTextResponse = async (text) => {
  // In a real app, you would call an AI API here
  // This is a mock implementation
  
  // Score based on response length and keywords
  const keywords = ["experience", "skills", "example", "demonstrate"];
  const lengthScore = Math.min(text.length / 50, 1); // Max 1 point for length
  const keywordScore = keywords.filter(kw => 
    text.toLowerCase().includes(kw)
  ).length / keywords.length;
  
  const totalScore = Math.round((lengthScore + keywordScore) * 50); // 0-100 scale
  
  return {
    score: totalScore,
    feedback: [
      totalScore > 70 ? "Excellent response" : 
      totalScore > 40 ? "Good response" : "Needs improvement",
      `Keywords matched: ${keywordScore * 100}%`,
      `Length score: ${lengthScore * 100}%`
    ]
  };
};

// Usage in assessment component:
const evaluateAnswers = async () => {
  const results = await Promise.all(
    answers.map(async (answer) => {
      if (typeof answer === "string") {
        return await analyzeTextResponse(answer);
      }
      return { score: 0, feedback: [] };
    })
  );
  
  const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  setEvaluation({ results, totalScore });
};