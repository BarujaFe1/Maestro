import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import BottomNavBar from '../components/BottomNavBar';

const OPERATIONAL_ROUTES = ['Today', 'StudentsHome', 'LessonsHome', 'AttendanceHome'];

export default function MainShellScreen({ activeRoute, navigation, children }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const showBottomNav = OPERATIONAL_ROUTES.includes(activeRoute);

  return (
    <SafeAreaView style={styles.wrap} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>{children}</View>
      {showBottomNav ? <BottomNavBar activeRoute={activeRoute} navigation={navigation} /> : null}
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    content: { flex: 1 },
  });
}
