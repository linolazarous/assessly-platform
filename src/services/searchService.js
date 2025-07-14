import { db } from '../firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  or,
  orderBy
} from 'firebase/firestore';

// Debounce function to limit API calls
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Search assessments in Firestore with enhanced query
 * @param {string} searchTerm - The term to search for
 * @param {string} userId - Current user's ID for organization filtering
 * @param {number} [limitCount=20] - Maximum number of results to return
 * @returns {Promise<Array>} Array of matching assessments
 */
const searchAssessments = async (searchTerm, userId, limitCount = 20) => {
  try {
    if (!searchTerm?.trim()) return [];
    
    const assessmentsRef = collection(db, 'assessments');
    const searchTermLower = searchTerm.toLowerCase();
    const searchTermEnd = searchTermLower + '\uf8ff';
    
    const q = query(
      assessmentsRef,
      where('organizationId', '==', userId),
      or(
        where('titleLower', '>=', searchTermLower),
        where('titleLower', '<=', searchTermEnd),
        where('descriptionLower', '>=', searchTermLower),
        where('descriptionLower', '<=', searchTermEnd),
        where('tags', 'array-contains', searchTermLower)
      ),
      orderBy('titleLower'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamp to ISO string if exists
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString()
    }));
  } catch (error) {
    console.error('Assessment search error:', error);
    throw new Error('Failed to search assessments. Please try again later.');
  }
};

/**
 * Search questions within assessments with improved matching
 * @param {string} searchTerm - The term to search for in questions
 * @param {string} userId - Current user's ID for organization filtering
 * @param {number} [limitCount=20] - Maximum number of results to return
 * @returns {Promise<Array>} Array of matching questions with assessment context
 */
const searchQuestions = async (searchTerm, userId, limitCount = 20) => {
  try {
    if (!searchTerm?.trim()) return [];
    
    const assessmentsRef = collection(db, 'assessments');
    const q = query(
      assessmentsRef,
      where('organizationId', '==', userId),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const searchTermLower = searchTerm.toLowerCase();
    
    return querySnapshot.docs.flatMap(doc => {
      const assessmentData = doc.data();
      return assessmentData.questions
        ?.filter(q => q.text.toLowerCase().includes(searchTermLower))
        .map(question => ({
          id: question.id || `${doc.id}-${Math.random().toString(36).substr(2, 9)}`,
          assessmentId: doc.id,
          assessmentTitle: assessmentData.title,
          ...question
        })) || [];
    }).slice(0, limitCount);
  } catch (error) {
    console.error('Question search error:', error);
    throw new Error('Failed to search questions. Please try again later.');
  }
};

/**
 * Enhanced debounced search with cancellation and type handling
 * @param {string} searchTerm - Term to search for
 * @param {string} userId - Current user's ID
 * @param {function} callback - (results, error) => void
 * @param {string} [type='assessments'] - Type of search ('assessments' or 'questions')
 * @param {number} [debounceTime=300] - Debounce delay in ms
 * @returns {function} Cancel function to abort pending search
 */
const debouncedSearch = (searchTerm, userId, callback, type = 'assessments', debounceTime = 300) => {
  let active = true;
  let cancelPrevious = () => {};
  
  const searchFn = async () => {
    if (!active) return;
    
    try {
      const results = type === 'questions'
        ? await searchQuestions(searchTerm, userId)
        : await searchAssessments(searchTerm, userId);
      
      if (active) callback(results, null);
    } catch (error) {
      if (active) callback([], error.message);
    }
  };

  // Cancel previous debounced call if exists
  cancelPrevious();
  
  // Create new debounced function
  const debounced = debounce(searchFn, debounceTime);
  debounced();
  
  // Update cancel function
  cancelPrevious = () => {
    active = false;
  };
  
  return cancelPrevious;
};

export { 
  searchAssessments, 
  searchQuestions, 
  debouncedSearch 
};
