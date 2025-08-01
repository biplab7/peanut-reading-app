'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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

// Demo story generator for different word families
function generateDemoStory(wordFamily: string): Story {
  const storyTemplates: { [key: string]: { words: string[]; story: string; title: string } } = {
    'at': {
      words: ['cat', 'hat', 'mat', 'bat', 'rat'],
      story: 'Once upon a time, there was a cat who wore a special hat. The cat sat on a soft mat with a friendly bat. They saw a little rat who was looking for a new hat. The cat, bat, and rat had a nice chat about sharing the hat.',
      title: 'The Cat in the Hat'
    },
    'an': {
      words: ['can', 'man', 'pan', 'ran', 'van'],
      story: 'A helpful man had a big can. He put the can in a shiny pan and ran to his van. The man drove the van to help others and everyone said he was the best man with a can!',
      title: 'The Man with the Can'
    },
    'ap': {
      words: ['cap', 'map', 'nap', 'tap', 'gap'],
      story: 'A little boy wore his favorite cap and looked at a treasure map. After a short nap, he heard a gentle tap at the door. Through a small gap, he saw his friend ready for adventure!',
      title: 'The Adventure Map'
    },
    'ag': {
      words: ['bag', 'tag', 'rag', 'wag', 'flag'],
      story: 'The dog would wag its tail when it saw the colorful flag. In the bag was a special tag and a soft rag. The dog loved to wag and play with the flag every day.',
      title: 'The Happy Dog'
    },
    'ig': {
      words: ['big', 'dig', 'fig', 'pig', 'wig'],
      story: 'A big pig loved to dig in the garden. The pig found a sweet fig and wore a funny wig. All the animals thought the big pig in the wig looked very silly!',
      title: 'The Big Pig'
    },
    'og': {
      words: ['dog', 'fog', 'log', 'jog', 'frog'],
      story: 'Every morning, a dog and a frog would jog together. One foggy day, they sat on a log and became best friends. The dog and frog loved to jog through the fog.',
      title: 'Friends in the Fog'
    },
    'ug': {
      words: ['bug', 'hug', 'mug', 'rug', 'jug'],
      story: 'A tiny bug lived on a cozy rug. Every day, the bug would drink from a small mug and give everyone a warm hug. The friendly bug kept water in a little jug.',
      title: 'The Friendly Bug'
    },
    'in': {
      words: ['bin', 'fin', 'pin', 'win', 'tin'],
      story: 'A fish with a shiny fin lived in a tin bin. The fish hoped to win a race using a special pin. With the lucky pin, the fish was sure to win!',
      title: 'The Winning Fish'
    },
    'op': {
      words: ['hop', 'mop', 'pop', 'top', 'stop'],
      story: 'A bunny loved to hop to the very top of the hill. With a mop in hand, the bunny would stop and clean up. Then hop, pop, and stop for a fun game!',
      title: 'Hop to the Top'
    },
    'et': {
      words: ['bet', 'get', 'let', 'net', 'pet'],
      story: 'A child wanted to get a new pet. With a fishing net, they tried to catch one. "Let me help," said a friend. "I bet we can get you the perfect pet!"',
      title: 'Getting a Pet'
    }
  };

  const template = storyTemplates[wordFamily] || storyTemplates['at'];
  
  return {
    id: `demo-${wordFamily}`,
    title: template.title,
    content: template.story,
    wordFamily: wordFamily,
    targetWords: template.words
  };
}

function ReadingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams?.get('storyId');
  const wordFamily = searchParams?.get('wordFamily');

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [wordProgress, setWordProgress] = useState<WordProgress[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Constants
  const MAX_RECORDING_DURATION = 45; // seconds (Google API limit is 60s)

  // Load story data
  useEffect(() => {
    const loadStory = async () => {
      console.log('📖 Loading story data...');
      console.log('🔍 URL params:', { storyId, wordFamily });
      
      if (!storyId || !wordFamily || storyId === 'demo') {
        console.log('🎭 Using demo story for word family:', wordFamily || 'at');
        const sampleStory = generateDemoStory(wordFamily || 'at');
        console.log('📚 Generated demo story:', sampleStory);
        setStory(sampleStory);
        setWordProgress(sampleStory.targetWords.map(word => ({
          word,
          attempts: 0,
          correct: false,
          feedback: ''
        })));
        console.log('✅ Demo story loaded successfully');
      } else {
        console.log('🌐 Fetching story from API with ID:', storyId);
        try {
          const response = await fetch(`/api/stories/${storyId}`);
          console.log('📊 Story fetch response status:', response.status, response.statusText);
          
          if (response.ok) {
            const apiResponse = await response.json();
            console.log('✅ Story fetched successfully:', apiResponse);
            
            // Extract story data from API response (handle both wrapped and direct responses)
            const storyData = apiResponse.data || apiResponse;
            
            // Transform API response to match expected structure
            const transformedStory = {
              id: storyData.id,
              title: storyData.title,
              content: storyData.content,
              wordFamily: storyData.metadata?.wordFamily || wordFamily,
              targetWords: storyData.metadata?.targetWords || storyData.targetWords || []
            };
            
            setStory(transformedStory);
            setWordProgress(transformedStory.targetWords.map((word: string) => ({
              word,
              attempts: 0,
              correct: false,
              feedback: ''
            })));
          } else {
            console.warn('⚠️ Failed to fetch story, using demo instead');
            const sampleStory = generateDemoStory(wordFamily || 'at');
            setStory(sampleStory);
            setWordProgress(sampleStory.targetWords.map(word => ({
              word,
              attempts: 0,
              correct: false,
              feedback: ''
            })));
          }
        } catch (error) {
          console.error('❌ Failed to load story from API:', error);
          console.log('🔄 Falling back to demo story');
          const sampleStory = generateDemoStory(wordFamily || 'at');
          setStory(sampleStory);
          setWordProgress(sampleStory.targetWords.map(word => ({
            word,
            attempts: 0,
            correct: false,
            feedback: ''
          })));
        }
      }
      setIsLoading(false);
      console.log('🏁 Story loading process completed');
    };

    loadStory();
  }, [storyId, wordFamily]);

  // Initialize speech recognition
  useEffect(() => {
    const speechService = localStorage.getItem('peanut_speech_service') || 'browser';
    
    console.log('🎤 Speech Recognition Debug Info:');
    console.log('📋 Speech service setting:', {
      service: speechService,
      description: speechService === 'browser' ? 'Browser/Native (webkitSpeechRecognition)' : 
                   speechService === 'google' ? 'Google Speech API (Backend)' : 
                   'OpenAI Whisper API (Backend)'
    });
    
    if (speechService === 'browser') {
      // Initialize browser speech recognition
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        console.log('🌐 Initializing Browser Speech Recognition');
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

          console.log('🎯 Speech Recognition Result:', {
            source: 'Browser Web Speech API',
            finalTranscript: finalTranscript,
            interimTranscript: interimTranscript,
            confidence: event.results[0]?.[0]?.confidence || 'unknown'
          });

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
      } else {
        console.warn('⚠️ Browser speech recognition not supported');
      }
    } else {
      console.log(`🚀 Backend speech service selected: ${speechService}`);
      console.log('📝 Note: Backend speech recording requires MediaRecorder API integration');
      // speechRecognitionRef will be null for backend services
      // Recording will be handled by MediaRecorder instead
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
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

  const startRecording = async () => {
    const speechService = localStorage.getItem('peanut_speech_service') || 'browser';
    console.log('🎙️ Starting recording...');
    console.log('🔍 Speech Recognition Method:', speechService);
    
    if (speechService === 'browser') {
      // Use browser speech recognition
      if (speechRecognitionRef.current) {
        setIsRecording(true);
        setRecognizedText('');
        setFeedback('Listening... Start reading!');
        speechRecognitionRef.current.start();
        console.log('✅ Browser speech recognition started');
      } else {
        console.error('❌ Speech recognition not supported in this browser');
        setFeedback('Speech recognition not supported in this browser.');
      }
    } else {
      // Use backend API with MediaRecorder
      try {
        console.log(`🚀 Starting backend speech recording with ${speechService} service`);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Try different audio formats that Google Speech API supports better
        let mediaRecorder;
        const audioFormats = [
          'audio/wav',
          'audio/mp4',
          'audio/webm;codecs=pcm',
          'audio/webm'  // fallback
        ];
        
        let selectedFormat = 'audio/webm'; // default fallback
        for (const format of audioFormats) {
          if (MediaRecorder.isTypeSupported(format)) {
            selectedFormat = format;
            console.log(`✅ Using audio format: ${format}`);
            break;
          }
        }
        
        mediaRecorder = new MediaRecorder(stream, { 
          mimeType: selectedFormat,
          audioBitsPerSecond: 16000 // Lower bitrate for smaller files
        });
        
        audioChunksRef.current = [];
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          processBackendSpeechRecognition(speechService as 'google' | 'whisper');
        };
        
        mediaRecorder.start();
        setIsRecording(true);
        setRecognizedText('');
        setRecordingDuration(0);
        setFeedback('Recording... Start reading!');
        console.log(`✅ Backend audio recording started for ${speechService}`);
        
        // Start timer for recording duration
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => {
            const newDuration = prev + 1;
            if (newDuration >= MAX_RECORDING_DURATION) {
              console.log(`⏰ Recording time limit reached (${MAX_RECORDING_DURATION}s), stopping automatically`);
              stopRecording();
              return MAX_RECORDING_DURATION;
            }
            return newDuration;
          });
        }, 1000);
      } catch (error) {
        console.error('❌ Failed to start audio recording:', error);
        setFeedback('Failed to access microphone. Please check permissions.');
      }
    }
  };

  const stopRecording = () => {
    const speechService = localStorage.getItem('peanut_speech_service') || 'browser';
    console.log('🛑 Stopping recording...');
    
    // Clear the recording timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (speechService === 'browser') {
      if (speechRecognitionRef.current) {
        setIsRecording(false);
        setFeedback('Processing... Please wait!');
        speechRecognitionRef.current.stop();
        console.log('✅ Browser speech recognition stopped');
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        setFeedback('Processing audio... Please wait!');
        mediaRecorderRef.current.stop();
        console.log(`✅ Backend audio recording stopped for ${speechService} (duration: ${recordingDuration}s)`);
        // mediaRecorder.onstop will trigger processBackendSpeechRecognition
      }
      setIsRecording(false);
    }
  };

  const processBackendSpeechRecognition = async (service: 'google' | 'whisper') => {
    try {
      console.log(`🔄 Processing speech with ${service} API...`);
      
      // Create audio blob from recorded chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('📦 Audio blob created:', { size: audioBlob.size, type: audioBlob.type });
      
      // Create FormData for API call
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('service', service);
      if (story) {
        formData.append('expectedText', story.targetWords.join(' '));
      }
      
      console.log(`🌐 Making API call to /api/speech/recognize with ${service} service`);
      const startTime = Date.now();
      
      const response = await fetch('/api/speech/recognize', {
        method: 'POST',
        body: formData
      });
      
      const endTime = Date.now();
      console.log(`⏱️ API call completed in ${endTime - startTime}ms`);
      console.log('📊 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🎯 Raw API Response:', result);
        
        // Extract data from the API response structure
        const speechData = result.data || result;
        console.log('🎯 Speech Recognition Result:', {
          source: `${service} API`,
          transcript: speechData.transcript,
          confidence: speechData.confidence,
          feedback: speechData.feedback || speechData.suggestions?.[0],
          fullResult: result
        });
        
        setRecognizedText(speechData.transcript || '');
        setIsRecording(false);
        
        if (speechData.transcript && story) {
          processRecognizedText(speechData.transcript.toLowerCase().trim());
        } else {
          setFeedback(speechData.feedback || speechData.suggestions?.[0] || 'No speech detected. Please try again.');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`❌ ${service} API error:`, errorData);
        setFeedback(`Speech recognition failed. Please try again.`);
        setIsRecording(false);
      }
    } catch (error) {
      console.error(`❌ Backend speech processing error:`, error);
      setFeedback('Speech processing failed. Please try again.');
      setIsRecording(false);
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
      const wordProg = wordProgress[index];
      const isCorrect = wordProg?.correct;
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
          {isRecording ? (
            <span>
              Stop Recording ({recordingDuration}s / {MAX_RECORDING_DURATION}s)
            </span>
          ) : (
            'Start Reading'
          )}
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

export default function ReadingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reading session...</p>
        </div>
      </div>
    }>
      <ReadingPageContent />
    </Suspense>
  );
}