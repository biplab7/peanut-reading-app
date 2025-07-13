import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function ReadingScreen() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const stories = [
    {
      id: '1',
      title: 'The Magic Garden',
      level: 'beginner',
      duration: '10 min',
      description: 'Join Luna as she discovers a garden where flowers can talk!',
      completed: false,
    },
    {
      id: '2',
      title: 'Space Adventure',
      level: 'intermediate',
      duration: '15 min',
      description: 'Blast off with Captain Zoe on an exciting journey to Mars!',
      completed: true,
    },
    {
      id: '3',
      title: 'The Friendly Dragon',
      level: 'beginner',
      duration: '8 min',
      description: 'Meet Spark, a dragon who loves to help others and make friends.',
      completed: false,
    },
  ];

  const levels = [
    { key: 'all', label: 'All Stories' },
    { key: 'beginner', label: 'Beginner' },
    { key: 'intermediate', label: 'Intermediate' },
    { key: 'advanced', label: 'Advanced' },
  ];

  const filteredStories = selectedLevel === 'all' 
    ? stories 
    : stories.filter(story => story.level === selectedLevel);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Story Library 📖</ThemedText>
          <ThemedText>Choose a story to start reading</ThemedText>
        </ThemedView>

        <ThemedView style={styles.filterSection}>
          <ThemedText type="defaultSemiBold">Reading Level</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {levels.map((level) => (
              <Pressable
                key={level.key}
                style={[
                  styles.filterChip,
                  selectedLevel === level.key && styles.filterChipActive
                ]}
                onPress={() => setSelectedLevel(level.key)}
              >
                <ThemedText 
                  style={[
                    styles.filterText,
                    selectedLevel === level.key && styles.filterTextActive
                  ]}
                >
                  {level.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>

        <ThemedView style={styles.storiesSection}>
          <ThemedText type="defaultSemiBold">Available Stories</ThemedText>
          {filteredStories.map((story) => (
            <Pressable key={story.id} style={styles.storyCard}>
              <ThemedView style={styles.storyHeader}>
                <ThemedText type="subtitle">{story.title}</ThemedText>
                <ThemedView style={styles.storyMeta}>
                  <ThemedText style={styles.levelBadge}>{story.level}</ThemedText>
                  <ThemedText style={styles.duration}>{story.duration}</ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.description}>{story.description}</ThemedText>
              <ThemedView style={styles.storyFooter}>
                {story.completed && (
                  <ThemedText style={styles.completedText}>✅ Completed</ThemedText>
                )}
                <Pressable style={styles.readButton}>
                  <ThemedText style={styles.readButtonText}>
                    {story.completed ? 'Read Again' : 'Start Reading'}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            </Pressable>
          ))}
        </ThemedView>

        <ThemedView style={styles.generateSection}>
          <Pressable style={styles.generateButton}>
            <ThemedText style={styles.generateEmoji}>✨</ThemedText>
            <ThemedText type="defaultSemiBold">Generate New Story</ThemedText>
            <ThemedText>Create a personalized story just for you!</ThemedText>
          </Pressable>
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
  filterSection: {
    marginBottom: 24,
  },
  filterScroll: {
    marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
  },
  filterTextActive: {
    color: 'white',
  },
  storiesSection: {
    marginBottom: 24,
  },
  storyCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    gap: 12,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storyMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  levelBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  duration: {
    fontSize: 12,
    opacity: 0.7,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  storyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  readButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  readButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  generateSection: {
    marginBottom: 24,
  },
  generateButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#007AFF',
  },
  generateEmoji: {
    fontSize: 32,
  },
});