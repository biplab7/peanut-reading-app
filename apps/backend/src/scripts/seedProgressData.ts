import { supabase } from '../config/supabase';

async function seedProgressData() {
  try {
    // First, let's get a child profile to add sessions to
    const { data: children, error: childError } = await supabase
      .from('child_profiles')
      .select('id, name')
      .limit(1);

    if (childError || !children || children.length === 0) {
      console.log('No child profiles found. Please create a child profile first.');
      return;
    }

    const child = children[0];
    console.log(`Adding sample reading sessions for child: ${child.name}`);

    // Create sample stories first
    const sampleStories = [
      {
        title: 'The Magic Garden',
        content: 'Once upon a time, there was a magical garden where flowers could talk and trees could dance...',
        reading_level: 'beginner',
        word_count: 245,
        estimated_reading_time: 3,
        themes: ['fantasy', 'nature'],
        is_generated: true,
        metadata: { difficulty: 'easy' }
      },
      {
        title: 'Adventure in Space',
        content: 'Captain Luna and her crew discovered a mysterious planet filled with friendly aliens...',
        reading_level: 'elementary',
        word_count: 189,
        estimated_reading_time: 2,
        themes: ['space', 'adventure'],
        is_generated: true,
        metadata: { difficulty: 'medium' }
      },
      {
        title: 'The Friendly Dragon',
        content: 'In a faraway kingdom, there lived a dragon who loved to make friends with everyone...',
        reading_level: 'intermediate',
        word_count: 312,
        estimated_reading_time: 4,
        themes: ['fantasy', 'friendship'],
        is_generated: true,
        metadata: { difficulty: 'medium' }
      }
    ];

    // Insert stories
    const { data: stories, error: storyError } = await supabase
      .from('stories')
      .insert(sampleStories)
      .select();

    if (storyError) {
      console.error('Error inserting stories:', storyError);
      return;
    }

    console.log(`Created ${stories.length} sample stories`);

    // Create sample reading sessions
    const now = new Date();
    const sampleSessions = [
      {
        child_id: child.id,
        story_id: stories[0].id,
        start_time: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        end_time: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(), // 15 minutes later
        duration: 900, // 15 minutes in seconds
        progress: {
          words_read: 245,
          accuracy: 92,
          reading_speed: 16.3, // words per minute
          completion_percentage: 100
        },
        feedback: {
          strengths: ['Good pronunciation', 'Steady pace'],
          areas_for_improvement: ['Work on expression'],
          overall_rating: 4.5
        }
      },
      {
        child_id: child.id,
        story_id: stories[1].id,
        start_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        end_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(), // 12 minutes later
        duration: 720, // 12 minutes in seconds
        progress: {
          words_read: 189,
          accuracy: 88,
          reading_speed: 15.75, // words per minute
          completion_percentage: 100
        },
        feedback: {
          strengths: ['Good comprehension', 'Improved fluency'],
          areas_for_improvement: ['Pause at punctuation'],
          overall_rating: 4.2
        }
      },
      {
        child_id: child.id,
        story_id: stories[2].id,
        start_time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        end_time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(), // 18 minutes later
        duration: 1080, // 18 minutes in seconds
        progress: {
          words_read: 312,
          accuracy: 95,
          reading_speed: 17.3, // words per minute
          completion_percentage: 100
        },
        feedback: {
          strengths: ['Excellent expression', 'Great comprehension'],
          areas_for_improvement: ['Keep up the good work!'],
          overall_rating: 4.8
        }
      }
    ];

    // Insert reading sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('reading_sessions')
      .insert(sampleSessions)
      .select();

    if (sessionError) {
      console.error('Error inserting reading sessions:', sessionError);
      return;
    }

    console.log(`Created ${sessions.length} sample reading sessions`);
    console.log('Sample progress data seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding progress data:', error);
  }
}

// Run the seed function
seedProgressData().then(() => {
  console.log('Seed script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});