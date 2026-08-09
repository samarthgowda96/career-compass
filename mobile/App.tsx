import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from './src/theme';
import { AssessmentProvider } from './src/state/AssessmentContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { QuestionnaireScreen } from './src/screens/QuestionnaireScreen';
import { AnalysisScreen } from './src/screens/AnalysisScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { CareerDetailScreen } from './src/screens/CareerDetailScreen';
import { PrivacyPolicyScreen, TermsScreen } from './src/screens/LegalScreens';
import { initializeAds } from './src/services/adService';
import { loadPremiumStatus } from './src/services/premiumService';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Root() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    // Premium status decides whether ads initialise at all.
    void loadPremiumStatus().then(() => initializeAds());
  }, []);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      primary: colors.primary,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        initialRouteName="Home"
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
        <Stack.Screen name="Analysis" component={AnalysisScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="CareerDetail" component={CareerDetailScreen} />
        <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AssessmentProvider>
        <Root />
      </AssessmentProvider>
    </SafeAreaProvider>
  );
}
