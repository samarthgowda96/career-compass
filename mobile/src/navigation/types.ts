import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Questionnaire: undefined;
  Analysis: undefined;
  Results: undefined;
  CareerDetail: { careerId: string };
  Privacy: undefined;
  Terms: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
