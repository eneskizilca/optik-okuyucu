import { Exam, ScanResult } from './types';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

// Dinamik import ile Expo Go çökmesini engelliyoruz (başlangıçta değil çalışma anında dener)
let OpenCV: any = null;
let ObjectType: any = null;
let DataTypes: any = null;
let ColorConversionCodes: any = null;

try {
  const cv = require('react-native-fast-opencv');
  OpenCV = cv.OpenCV;
  ObjectType = cv.ObjectType;
  DataTypes = cv.DataTypes;
  ColorConversionCodes = cv.ColorConversionCodes;
} catch (e) {
  // Ignore, OpenCV is not present (Expo Go)
}

export const processOMRImage = async (
  imageUri: string,
  exam: any
): Promise<any> => {
  throw new Error("This method is deprecated. OMR is now processed via hidden WebView in ScanScreen.");
};
