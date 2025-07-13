'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Play, Pause, RotateCcw, Home, CheckCircle, AlertCircle } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  content: string;
  wordFamily: string;
  targetWords: string[];
}

interface WordProgress {
  word: string;
  attempts: number;
  correct: boolean;
  feedback: string;
}

export default function ReadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams.get('storyId');
  const wordFamily = searchParams.get('wordFamily');

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [wordProgress, setWordProgress] = useState<WordProgress[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [recognizedText, setRecognizedText] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);

  // Load story data
  useEffect(() => {
    const loadStory = async () => {
      if (!storyId || !wordFamily) {
        // Generate a sample story for demo
        const sampleStory: Story = {
          id: '1',
          title: `The ${wordFamily?.toUpperCase()} Family Adventure`,
          content: `Once upon a time, there was a cat who wore a hat. The cat sat on a mat with a bat. They were looking at a rat who was quite fat. The cat and the bat wanted to chat with the rat about getting a new hat.`,
          wordFamily: wordFamily || 'at',
          targetWords: ['cat', 'hat', 'mat', 'bat', 'rat', 'fat', 'chat', 'sat']
        };
        setStory(sampleStory);
        setWordProgress(sampleStory.targetWords.map(word => ({
          word,
          attempts: 0,
          correct: false,
          feedback: ''
        })));
      } else {
        // In real implementation, fetch story from API
        try {
          const response = await fetch(`/api/stories/${storyId}`);
          if (response.ok) {
            const storyData = await response.json();
            setStory(storyData);
            setWordProgress(storyData.targetWords?.map((word: string) => ({
              word,
              attempts: 0,
              correct: false,
              feedback: ''
            })) || []);
          }
        } catch (error) {
          console.error('Failed to load story:', error);
        }
      }
      setIsLoading(false);
    };

    loadStory();
  }, [storyId, wordFamily]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setRecognizedText(finalTranscript || interimTranscript);
        
        if (finalTranscript && story) {
          processRecognizedText(finalTranscript.toLowerCase().trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setFeedback('Speech recognition error. Please try again.');
      };

      speechRecognitionRef.current = recognition;
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [story]);

  const processRecognizedText = (text: string) => {
    if (!story) return;

    // Check if recognized text contains target words
    const words = text.split(' ');
    let foundTargetWord = false;

    story.targetWords.forEach((targetWord, index) => {
      if (words.some(word => word.includes(targetWord.toLowerCase()))) {
        foundTargetWord = true;
        setWordProgress(prev => prev.map((wp, idx) => 
          idx === index 
            ? { ...wp, attempts: wp.attempts + 1, correct: true, feedback: 'Great job!' }
            : wp
        ));
        setCurrentWordIndex(index);
        setFeedback(`Excellent! You said "${targetWord}" correctly! 🎉`);
      }
    });

    if (!foundTargetWord) {
      setFeedback('Try reading the highlighted words clearly. You can do it! 💪');
    }
  };

  const startRecording = () => {
    if (speechRecognitionRef.current) {
      setIsRecording(true);
      setRecognizedText('');
      setFeedback('Listening... Start reading!');
      speechRecognitionRef.current.start();
    } else {
      setFeedback('Speech recognition not supported in this browser.');
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      setIsRecording(false);
      setFeedback('Recording stopped. Click the microphone to try again!');
      speechRecognitionRef.current.stop();
    }
  };

  const playStory = () => {
    if (!story) return;
    
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(story.content);
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    speechSynthesis.speak(utterance);
  };

  const pauseStory = () => {
    setIsPlaying(false);
    speechSynthesis.cancel();
  };

  const resetProgress = () => {
    if (!story) return;
    setWordProgress(story.targetWords.map(word => ({
      word,
      attempts: 0,
      correct: false,
      feedback: ''
    })));
    setCurrentWordIndex(-1);
    setFeedback('');
    setRecognizedText('');
  };

  const highlightTargetWords = (text: string) => {
    if (!story) return text;
    
    let highlightedText = text;
    story.targetWords.forEach((word, index) => {
      const wordProgress = wordProgress[index];
      const isCorrect = wordProgress?.correct;
      const isCurrent = currentWordIndex === index;
      
      const colorClass = isCorrect 
        ? 'bg-green-200 text-green-800' 
        : isCurrent 
        ? 'bg-yellow-200 text-yellow-800 animate-pulse'
        : 'bg-blue-200 text-blue-800';
      
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      highlightedText = highlightedText.replace(
        regex, 
        `<span class="px-1 py-0.5 rounded font-semibold ${colorClass}">${word}</span>`
      );
    });
    
    return highlightedText;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your story...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-4">Story not found</p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const completedWords = wordProgress.filter(wp => wp.correct).length;
  const totalWords = story.targetWords.length;
  const progressPercentage = (completedWords / totalWords) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{story.title}</h1>
          <p className="text-gray-600">Word Family: -{story.wordFamily}</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="btn-secondary flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Home
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {completedWords}/{totalWords} words
          </span>
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Story Content */}
      <div className="card mb-8">
        <div 
          className="text-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightTargetWords(story.content) }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button
          onClick={isPlaying ? pauseStory : playStory}
          className="btn-primary flex items-center gap-2"
          disabled={isRecording}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isPlaying ? 'Pause Story' : 'Play Story'}
        </button>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
            isRecording
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          disabled={isPlaying}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {isRecording ? 'Stop Recording' : 'Start Reading'}
        </button>

        <button
          onClick={resetProgress}
          className="btn-secondary flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="card bg-blue-50 border-blue-200 mb-6">
          <p className="text-blue-800 font-medium">{feedback}</p>
        </div>
      )}

      {/* Recognized Text */}
      {recognizedText && (
        <div className="card bg-gray-50 mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">What I heard:</h3>
          <p className="text-gray-800">"{recognizedText}"</p>
        </div>
      )}

      {/* Word Progress */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Target Words Progress</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {wordProgress.map((wp, index) => (
            <div
              key={wp.word}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                wp.correct
                  ? 'bg-green-100 border-green-300 text-green-800'
                  : currentWordIndex === index
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-800 animate-pulse'
                  : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {wp.correct && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>
              <p className="font-semibold">{wp.word}</p>
              <p className="text-xs">{wp.attempts} attempts</p>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Message */}
      {completedWords === totalWords && (
        <div className="card bg-green-50 border-green-200 mt-6 text-center">
          <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 Congratulations!</h3>
          <p className="text-green-700 mb-4">
            You've successfully read all the -{story.wordFamily} family words!
          </p>
          <button
            onClick={() => router.push('/word-families')}
            className="btn-primary"
          >
            Try Another Word Family
          </button>
        </div>
      )}
    </div>
  );
}