import { StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Welcome to Peanut Reading! 📚</ThemedText>
          <ThemedText type="subtitle">Let's start your reading adventure</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Today's Goals</ThemedText>
          <ThemedView style={styles.goalCard}>
            <ThemedText>📖 Read 1 story</ThemedText>
            <ThemedText>⏱️ Practice for 15 minutes</ThemedText>
            <ThemedText>🎯 Improve accuracy to 85%</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Quick Actions</ThemedText>
          <ThemedView style={styles.actionGrid}>
            <ThemedView style={styles.actionCard}>
              <ThemedText style={styles.actionEmoji}>📚</ThemedText>
              <ThemedText>Start Reading</ThemedText>
            </ThemedView>
            <ThemedView style={styles.actionCard}>
              <ThemedText style={styles.actionEmoji}>✨</ThemedText>
              <ThemedText>New Story</ThemedText>
            </ThemedView>
            <ThemedView style={styles.actionCard}>
              <ThemedText style={styles.actionEmoji}>🎮</ThemedText>
              <ThemedText>Practice</ThemedText>
            </ThemedView>
            <ThemedView style={styles.actionCard}>
              <ThemedText style={styles.actionEmoji}>🏆</ThemedText>
              <ThemedText>Achievements</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Recent Stories</ThemedText>
          <ThemedView style={styles.storyCard}>
            <ThemedText type="subtitle">The Magic Garden</ThemedText>
            <ThemedText>Continue your adventure with Luna and the talking flowers...</ThemedText>
            <ThemedText style={styles.progressText}>Progress: 75% completed</ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
  },
  section: {
    marginBottom: 24,
  },
  goalCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  actionEmoji: {
    fontSize: 32,
  },
  storyCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
  },
});