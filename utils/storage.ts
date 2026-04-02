import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exam, ScanResult } from './types';

const EXAMS_KEY = '@exams';
const RESULTS_KEY_PREFIX = '@results_';

// Exam Management
export const getExams = async (): Promise<Exam[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(EXAMS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to get exams:', e);
    return [];
  }
};

export const getExamById = async (id: string): Promise<Exam | null> => {
  const exams = await getExams();
  return exams.find(e => e.id === id) || null;
};

export const saveExam = async (exam: Exam): Promise<void> => {
  try {
    const exams = await getExams();
    const existingIndex = exams.findIndex(e => e.id === exam.id);
    
    if (existingIndex >= 0) {
      exams[existingIndex] = exam;
    } else {
      exams.push(exam);
    }
    
    // Sort by descending date
    exams.sort((a, b) => b.createdAt - a.createdAt);
    await AsyncStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
  } catch (e) {
    console.error('Failed to save exam:', e);
    throw e;
  }
};

export const deleteExam = async (id: string): Promise<void> => {
  try {
    const exams = await getExams();
    const filtered = exams.filter(e => e.id !== id);
    await AsyncStorage.setItem(EXAMS_KEY, JSON.stringify(filtered));
    // Also delete associated results
    await AsyncStorage.removeItem(`${RESULTS_KEY_PREFIX}${id}`);
  } catch (e) {
    console.error('Failed to delete exam:', e);
    throw e;
  }
};

// Scan Result Management (per exam)
export const getResultsForExam = async (examId: string): Promise<ScanResult[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(`${RESULTS_KEY_PREFIX}${examId}`);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error(`Failed to get results for exam ${examId}:`, e);
    return [];
  }
};

export const getResultById = async (examId: string, resultId: string): Promise<ScanResult | null> => {
  const results = await getResultsForExam(examId);
  return results.find(r => r.id === resultId) || null;
};

export const saveResult = async (result: ScanResult): Promise<void> => {
  try {
    const results = await getResultsForExam(result.examId);
    const existingIndex = results.findIndex(r => r.id === result.id);
    
    if (existingIndex >= 0) {
      results[existingIndex] = result;
    } else {
      results.push(result);
    }
    
    // Sort by descending date
    results.sort((a, b) => b.scannedAt - a.scannedAt);
    await AsyncStorage.setItem(`${RESULTS_KEY_PREFIX}${result.examId}`, JSON.stringify(results));
  } catch (e) {
    console.error('Failed to save result:', e);
    throw e;
  }
};

export const deleteResult = async (examId: string, resultId: string): Promise<void> => {
  try {
    const results = await getResultsForExam(examId);
    const filtered = results.filter(r => r.id !== resultId);
    await AsyncStorage.setItem(`${RESULTS_KEY_PREFIX}${examId}`, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete result:', e);
    throw e;
  }
};
