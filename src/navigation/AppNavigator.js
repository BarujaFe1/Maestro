import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';

import LoginScreen from '../screens/LoginScreen';
import StudentsScreen from '../screens/StudentsScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MethodsScreen from '../screens/MethodsScreen';
import TeachersScreen from '../screens/TeachersScreen';
import LogsScreen from '../screens/LogsScreen';
import TodayScreen from '../screens/TodayScreen';
import LessonCenterScreen from '../screens/LessonCenterScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import TheoryGroupsScreen from '../screens/TheoryGroupsScreen';

import DrawerMenuButton from '../components/DrawerMenuButton';
import MainShellScreen from '../screens/MainShellScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function makeShellRoute(Component, activeRoute) {
  return function Wrapped(props) {
    return (
      <MainShellScreen activeRoute={activeRoute} navigation={props.navigation}>
        <Component {...props} />
      </MainShellScreen>
    );
  };
}

const TodayRoute = makeShellRoute(TodayScreen, 'Today');
const StudentsRoute = makeShellRoute(StudentsScreen, 'StudentsHome');
const LessonsRoute = makeShellRoute(LessonCenterScreen, 'LessonsHome');
const AttendanceRoute = makeShellRoute(AttendanceScreen, 'AttendanceHome');

function PrimaryStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.text,
        headerLeft: () => <DrawerMenuButton navigation={navigation} color={theme.colors.text} />,
      })}
    >
      <Stack.Screen name="Today" component={TodayRoute} options={{ title: 'Hoje' }} />
      <Stack.Screen name="LessonsHome" component={LessonsRoute} options={{ title: 'Aulas' }} />
      <Stack.Screen name="AttendanceHome" component={AttendanceRoute} options={{ title: 'Presença' }} />
      <Stack.Screen name="StudentsHome" component={StudentsRoute} options={{ title: 'Alunos' }} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} options={{ title: 'Aluno' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { session, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <Drawer.Navigator
      screenOptions={{
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.text,
        sceneContainerStyle: { backgroundColor: theme.colors.bg },
        drawerStyle: { backgroundColor: theme.colors.card },
        drawerActiveTintColor: theme.colors.accent,
        drawerInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Drawer.Screen name="Operação" component={PrimaryStack} options={{ headerShown: false }} />
      <Drawer.Screen name="Relatórios" component={ReportsScreen} />
      <Drawer.Screen name="Métodos" component={MethodsScreen} />
      <Drawer.Screen name="GruposTeoricos" component={TheoryGroupsScreen} options={{ title: 'Grupos teóricos' }} />
      <Drawer.Screen name="Professores" component={TeachersScreen} />
      <Drawer.Screen name="Configurações" component={SettingsScreen} />
      <Drawer.Screen name="Logs" component={LogsScreen} />
    </Drawer.Navigator>
  );
}
