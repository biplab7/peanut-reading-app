'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Mic, Sparkles, Trophy, Play, Heart } from 'lucide-react';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStartReading = () => {
    // Navigate to word families selection page
    window.location.href = '/word-families';
  };

  const handleGenerateStory = async () => {
    console.log('🎯 Starting general story generation from homepage');
    setIsGenerating(true);
    
    try {
      console.log('🌐 Making API call to /api/stories/generate...');
      console.log('📝 Request data:', {
        level: 'beginner',
        theme: 'adventure', 
        character: 'friendly animal'
      });
      
      const startTime = Date.now();
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'beginner',
          theme: 'adventure',
          character: 'friendly animal'
        })
      });
      
      const endTime = Date.now();
      const requestTime = endTime - startTime;
      
      console.log(`⏱️ API call completed in ${requestTime}ms`);
      console.log('📊 Response status:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('📄 Raw response body:', responseText);
      
      let story;
      try {
        story = JSON.parse(responseText);
        console.log('✅ Parsed response data:', story);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      if (response.ok) {
        console.log('✅ General story generation successful!');
        alert(`✨ New story generated: "${story.title || story.data?.title || 'Untitled'}"! \n\nThis will soon redirect you to read the story.`);
      } else {
        console.warn('⚠️ API call failed with status:', response.status);
        console.warn('📄 Error response:', story);
        alert('😅 Story generation is currently offline. Please try again later!');
      }
    } catch (error) {
      console.error('❌ Story generation error occurred:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      alert('😅 Story generation is currently offline. Please try again later!');
    } finally {
      console.log('🏁 General story generation process completed');
      setIsGenerating(false);
    }
  };

  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-blue-600" />,
      title: "AI-Generated Stories",
      description: "Personalized stories created just for your child's reading level and interests"
    },
    {
      icon: <Mic className="w-8 h-8 text-purple-600" />,
      title: "Speech Recognition",
      description: "Practice reading aloud with real-time feedback and pronunciation help"
    },
    {
      icon: <Trophy className="w-8 h-8 text-yellow-600" />,
      title: "Progress Tracking",
      description: "Monitor reading improvement with detailed analytics and achievements"
    },
    {
      icon: <Sparkles className="w-8 h-8 text-pink-600" />,
      title: "Interactive Learning",
      description: "Engaging activities and games that make reading fun and educational"
    }
  ];

  const sampleStories = [
    {
      title: "The Magic Garden",
      level: "Beginner",
      duration: "5 min",
      description: "Join Luna as she discovers a garden where flowers can talk!",
      color: "bg-green-100 text-green-800"
    },
    {
      title: "Space Adventure",
      level: "Intermediate", 
      duration: "8 min",
      description: "Captain Zoe's exciting journey to Mars to help friendly aliens.",
      color: "bg-blue-100 text-blue-800"
    },
    {
      title: "The Friendly Dragon",
      level: "Beginner",
      duration: "6 min", 
      description: "Meet Spark, a dragon who loves to help others and make friends.",
      color: "bg-purple-100 text-purple-800"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">Peanut Reading</span> 📚
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered reading companion that helps children improve their reading skills 
            through personalized stories and interactive learning
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleStartReading}
            className="btn-primary flex items-center gap-2"
            disabled={isLoading}
          >
            <Play className="w-5 h-5" />
            Start Reading Adventure
          </button>
          <button 
            onClick={handleGenerateStory}
            className="btn-secondary flex items-center gap-2"
            disabled={isGenerating}
          >
            <Sparkles className="w-5 h-5" />
            {isGenerating ? 'Generating...' : 'Generate New Story'}
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Why Kids Love Peanut Reading
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="card text-center hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Stories */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Popular Stories
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {sampleStories.map((story, index) => (
            <div key={index} className="card hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${story.color}`}>
                  {story.level}
                </span>
                <button className="text-gray-400 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {story.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {story.description}
              </p>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{story.duration}</span>
                <button className="btn-primary text-sm py-1 px-3">
                  Read Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="card text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h2 className="text-2xl font-bold mb-4">
          Ready to Start Your Reading Journey?
        </h2>
        <p className="text-blue-100 mb-6">
          Join thousands of children who are improving their reading skills with AI-powered personalized stories
        </p>
        <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
          Get Started Free
        </button>
      </div>
    </div>
  );
}