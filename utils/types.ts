export type Exam = {
  id: string;
  name: string;
  questionCount: number; // 1-40
  optionsCount: number;  // 4 or 5
  createdAt: number;
  answerKey: string[];     // Array of correct options: ['A', 'B', 'B', 'C', 'E', '', ...]
};

export type ScanResult = {
  id: string;
  examId: string;
  studentNo: string;     // Filled from OCR or manual
  studentName: string;   // Optional
  scannedAt: number;
  answers: string[];      // Array of student options: ['A', 'D', 'B', 'C', 'E', ...]
  score: number;         // Max 100
  correct: number;
  incorrect: number;
  empty: number;
  imageUri?: string;     // Local URI of the scanned image
  boundingBoxes?: {      // For drawing overlay
     qIndex: number;
     x: number;
     y: number;
     width: number;
     height: number;
     status: 'correct' | 'incorrect' | 'empty';
  }[];
};
