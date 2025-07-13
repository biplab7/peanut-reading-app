'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Star, ChevronRight } from 'lucide-react';

interface WordFamily {
  family: string;
  examples: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  color: string;
}

export default function WordFamiliesPage() {
  const router = useRouter();
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const wordFamilies: WordFamily[] = [
    {
      family: 'at',
      examples: ['cat', 'bat', 'hat', 'mat', 'rat'],
      difficulty: 'beginner',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      family: 'an',
      examples: ['can', 'man', 'pan', 'ran', 'van'],
      difficulty: 'beginner',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      family: 'ap',
      examples: ['cap', 'map', 'nap', 'tap', 'gap'],
      difficulty: 'beginner',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      family: 'ag',
      examples: ['bag', 'tag', 'rag', 'wag', 'lag'],
      difficulty: 'beginner',
      color: 'bg-pink-100 text-pink-800 border-pink-200'
    },
    {
      family: 'ig',
      examples: ['big', 'dig', 'fig', 'pig', 'wig'],
      difficulty: 'beginner',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    {
      family: 'og',
      examples: ['dog', 'fog', 'log', 'jog', 'cog'],
      difficulty: 'beginner',
      color: 'bg-red-100 text-red-800 border-red-200'
    },
    {
      family: 'ug',
      examples: ['bug', 'hug', 'mug', 'rug', 'tug'],
      difficulty: 'beginner',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    {
      family: 'in',
      examples: ['bin', 'fin', 'pin', 'win', 'tin'],
      difficulty: 'intermediate',
      color: 'bg-teal-100 text-teal-800 border-teal-200'
    },
    {
      family: 'op',
      examples: ['hop', 'mop', 'pop', 'top', 'cop'],
      difficulty: 'intermediate',
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    {
      family: 'et',
      examples: ['bet', 'get', 'let', 'net', 'pet'],
      difficulty: 'intermediate',
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  ];

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Star className="w-4 h-4 fill-current" />;
      case 'intermediate':
        return (
          <>
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
          </>
        );
      case 'advanced':
        return (
          <>
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
          </>
        );
      default:
        return null;
    }
  };

  const handleFamilySelect = async (family: WordFamily) => {
    console.log('🎯 Starting story generation for word family:', family.family);
    console.log('📝 Request data:', {
      wordFamily: family.family,
      examples: family.examples,
      difficulty: family.difficulty,
      theme: 'adventure'
    });

    setSelectedFamily(family.family);
    setIsGenerating(true);

    try {
      console.log('🌐 Making API call to /api/stories/generate...');
      const startTime = Date.now();
      
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordFamily: family.family,
          examples: family.examples,
          difficulty: family.difficulty,
          theme: 'adventure'
        })
      });

      const endTime = Date.now();
      const requestTime = endTime - startTime;
      
      console.log(`⏱️ API call completed in ${requestTime}ms`);
      console.log('📊 Response status:', response.status, response.statusText);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('📄 Raw response body:', responseText);

      let story;
      try {
        story = JSON.parse(responseText);
        console.log('✅ Parsed response data:', story);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.log('📄 Response was not valid JSON:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (response.ok) {
        console.log('✅ API call successful!');
        console.log('📚 Generated story:', story);
        const storyId = story.data?.id || story.id || 'demo';
        console.log('🔗 Navigating to reading page with storyId:', storyId);
        router.push(`/reading?storyId=${storyId}&wordFamily=${family.family}`);
      } else {
        console.warn('⚠️ API call failed with status:', response.status);
        console.warn('📄 Error response:', story);
        console.warn('🔄 Falling back to demo story');
        router.push(`/reading?storyId=demo&wordFamily=${family.family}`);
      }
    } catch (error) {
      console.error('❌ Story generation error occurred:', error);
      console.error('🔍 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      console.warn('🔄 Using demo story due to API error for word family:', family.family);
      router.push(`/reading?storyId=demo&wordFamily=${family.family}`);
    } finally {
      console.log('🏁 Story generation process completed');
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <BookOpen className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Word Family
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select a word family to start your reading adventure! Each story will focus on words that sound alike.
        </p>
      </div>

      {/* Word Families Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {wordFamilies.map((family, index) => (
          <div
            key={family.family}
            className={`card border-2 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 ${
              selectedFamily === family.family 
                ? 'ring-4 ring-blue-300 bg-blue-50' 
                : 'hover:border-blue-300'
            } ${family.color}`}
            onClick={() => !isGenerating && handleFamilySelect(family)}
          >
            {/* Difficulty Stars */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-1">
                {getDifficultyIcon(family.difficulty)}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Word Family */}
            <div className="text-center mb-4">
              <h3 className="text-3xl font-bold mb-2">
                -{family.family}
              </h3>
              <span className="text-sm font-medium capitalize">
                {family.difficulty}
              </span>
            </div>

            {/* Example Words */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Example words:</p>
              <div className="flex flex-wrap gap-2">
                {family.examples.slice(0, 4).map((word, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white bg-opacity-70 rounded-md text-sm font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {selectedFamily === family.family && isGenerating && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm font-medium text-gray-700">Generating story...</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Back Button */}
      <div className="text-center">
        <button
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={isGenerating}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}