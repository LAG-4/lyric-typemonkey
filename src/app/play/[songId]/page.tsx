'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Song, songs } from '@/data/songs';

type TypingStatus = 'idle' | 'playing' | 'finished';
type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

interface TypingStats {
  wpm: number;
  accuracy: number;
  rawWpm: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  timeTaken: number;
}

export default function SongPlayPage() {
  const params = useParams();
  const songId = params.songId as string;
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const startOffsetRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  
  // Song data
  const [song, setSong] = useState<Song | null>(null);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  
  // Typing state
  const [typingStatus, setTypingStatus] = useState<TypingStatus>('idle');
  const [typedText, setTypedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [typingStats, setTypingStats] = useState<TypingStats | null>(null);
  
  // Audio state
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [displayTime, setDisplayTime] = useState('0:00');
  const [lastSyncTime, setLastSyncTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prefetchedSong, setPrefetchedSong] = useState<string | null>(null);

  // Initialize AudioContext on client side only
  useEffect(() => {
    // Create AudioContext on first user interaction
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        try {
          // Use AudioContext with fallback
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioCtx();
          
          // Create gain node for volume control
          if (audioContextRef.current) {
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.connect(audioContextRef.current.destination);
          }
        } catch (err) {
          console.error("Error creating AudioContext:", err);
          setAudioError("Your browser doesn't support advanced audio features. Try a different browser.");
        }
      }
    };

    // Initialize on first interaction
    window.addEventListener('click', initAudioContext, { once: true });
    window.addEventListener('keydown', initAudioContext, { once: true });
    
    return () => {
      window.removeEventListener('click', initAudioContext);
      window.removeEventListener('keydown', initAudioContext);
      
      // Clean up audio resources
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch (e) {
          // Ignore errors if already stopped
        }
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
      }
    };
  }, []);

  // Find the song by ID
  useEffect(() => {
    const foundSong = songs.find(s => s.id === songId);
    if (foundSong) {
      setSong(foundSong);
      setAudioError(null);
      setAudioLoaded(false);
      
      // Reset states on song change
      setCurrentLyricIndex(0);
      setTypedText('');
      setCurrentWordIndex(0);
      setCurrentTime(0);
      setDisplayTime('0:00');
      
      // Fetch and decode audio file if we haven't already
      if (prefetchedSong !== foundSong.id) {
        preloadAudio(foundSong.audioUrl, foundSong.id);
      }
    }
  }, [songId]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Preload audio using Web Audio API
  const preloadAudio = async (audioUrl: string, songId: string) => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
      
      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    
    setAudioLoaded(false);
    
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      audioBufferRef.current = audioBuffer;
      setPrefetchedSong(songId);
      setAudioLoaded(true);
      setAudioError(null);
    } catch (error: any) {
      console.error("Error loading audio:", error);
      setAudioError(`Failed to load audio: ${error.message || 'Unknown error'}`);
      setAudioLoaded(false);
    }
  };

  // Apply playback speed
  useEffect(() => {
    if (sourceNodeRef.current && isPlaying) {
      // For Web Audio API, we need to restart with new playback rate
      pauseAudio();
      playAudio(currentTime);
    }
    
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, currentTime, isPlaying]);

  // Play audio using Web Audio API for more precise timing
  const playAudio = (startTime = 0) => {
    if (!audioContextRef.current || !audioBufferRef.current || !gainNodeRef.current) {
      // Fallback to HTML5 Audio
      if (audioRef.current) {
        audioRef.current.currentTime = startTime;
        audioRef.current.play().catch(err => {
          setAudioError(`Failed to play audio: ${err.message}`);
        });
      }
      return;
    }
    
    try {
      // Stop current playback if any
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch (e) {
          // Ignore errors if already stopped
        }
      }
      
      // Create new source node
      const sourceNode = audioContextRef.current.createBufferSource();
      sourceNode.buffer = audioBufferRef.current;
      sourceNode.playbackRate.value = playbackSpeed;
      sourceNode.connect(gainNodeRef.current);
      
      // Start playback at specified time
      sourceNode.start(0, startTime);
      sourceNodeRef.current = sourceNode;
      startOffsetRef.current = startTime;
      startedAtRef.current = audioContextRef.current.currentTime;
      
      // Handle source ended
      sourceNode.onended = () => {
        if (typingStatus === 'playing') {
          finishTyping();
        }
        setIsPlaying(false);
      };
      
      // Start time tracking loop
      updateTimeDisplay();
      
      setIsPlaying(true);
    } catch (error: any) {
      console.error("Error playing audio:", error);
      setAudioError(`Failed to play audio: ${error.message || 'Unknown error'}`);
      setIsPlaying(false);
    }
  };
  
  // Pause audio
  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      try {
        // Get current time before stopping
        const actualTime = getCurrentPlaybackTime();
        setCurrentTime(actualTime);
        
        // Stop playback
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
        
        // Save current position for resuming later
        startOffsetRef.current = actualTime;
        
        // Stop time tracking loop
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      } catch (e) {
        console.error("Error pausing audio:", e);
      }
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setIsPlaying(false);
  };
  
  // Get accurate current playback time
  const getCurrentPlaybackTime = (): number => {
    if (!audioContextRef.current || !isPlaying) {
      return currentTime;
    }
    
    const elapsed = audioContextRef.current.currentTime - startedAtRef.current;
    return startOffsetRef.current + (elapsed * playbackSpeed);
  };
  
  // Update time display using requestAnimationFrame for smooth updates
  const updateTimeDisplay = () => {
    const update = () => {
      if (isPlaying && audioContextRef.current) {
        const actualTime = getCurrentPlaybackTime();
        
        setCurrentTime(actualTime);
        setDisplayTime(formatTime(actualTime));
        
        // Find the current lyric based on timestamp
        // Only update if time has changed significantly since last sync (50ms)
        if (song && Math.abs(actualTime - lastSyncTime) > 0.05) {
          const newLyricIndex = song.lyrics.findIndex((lyric, index) => {
            const nextLyric = song.lyrics[index + 1];
            return actualTime >= lyric.time && 
                  (!nextLyric || actualTime < nextLyric.time);
          });
          
          if (newLyricIndex !== -1 && newLyricIndex !== currentLyricIndex) {
            setCurrentLyricIndex(newLyricIndex);
            setTypedText('');
            setCurrentWordIndex(0);
            setLastSyncTime(actualTime);
          }
        }
        
        rafIdRef.current = requestAnimationFrame(update);
      }
    };
    
    rafIdRef.current = requestAnimationFrame(update);
  };

  // Finish typing game and calculate stats
  const finishTyping = useCallback(() => {
    pauseAudio();
    setTypingStatus('finished');
    
    const endTime = Date.now();
    const timeTakenSeconds = (endTime - startTime) / 1000;
    
    if (!song) return;
    
    // Calculate total characters
    const totalChars = song.lyrics.reduce((sum, lyric) => sum + lyric.text.length, 0);
    
    // Calculate WPM (words per minute) - assume 5 chars = 1 word
    const wordsTyped = (correctChars + incorrectChars) / 5;
    const wpm = Math.round((wordsTyped / timeTakenSeconds) * 60);
    
    // Calculate raw WPM (without errors)
    const correctWordsTyped = correctChars / 5;
    const rawWpm = Math.round((correctWordsTyped / timeTakenSeconds) * 60);
    
    // Calculate accuracy
    const accuracy = Math.round((correctChars / (correctChars + incorrectChars)) * 100);
    
    setTypingStats({
      wpm,
      rawWpm,
      accuracy,
      correctChars,
      incorrectChars,
      totalChars,
      timeTaken: Math.round(timeTakenSeconds)
    });
  }, [song, startTime, correctChars, incorrectChars]);

  // Use HTML5 Audio as fallback and for initial loading
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;

    const handleCanPlayThrough = () => {
      if (!audioLoaded && !prefetchedSong) {
        setAudioLoaded(true);
        setAudioError(null);
      }
    };

    const handleError = () => {
      if (!audioLoaded && !prefetchedSong) {
        setAudioError(`Could not load audio file: ${song.audioUrl}`);
        setAudioLoaded(false);
      }
    };

    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
    };
  }, [song, audioLoaded, prefetchedSong]);

  // Jump to specific lyric line
  const jumpToLyric = (index: number) => {
    if (!song || index >= song.lyrics.length) return;
    
    const targetLyric = song.lyrics[index];
    const wasPlaying = isPlaying;
    
    // Pause current playback
    if (isPlaying) {
      pauseAudio();
    }
    
    // Update state
    setCurrentLyricIndex(index);
    setTypedText('');
    setCurrentWordIndex(0);
    
    // Resume playback from new position if was playing
    if (wasPlaying) {
      playAudio(targetLyric.time);
    } else {
      setCurrentTime(targetLyric.time);
      setDisplayTime(formatTime(targetLyric.time));
    }
  };

  // Manually sync current line with audio (if timing is off)
  const syncWithAudio = () => {
    if (!song) return;
    
    // Find the lyric that should be playing at current time
    const actualTime = getCurrentPlaybackTime();
    const newLyricIndex = song.lyrics.findIndex((lyric, index) => {
      const nextLyric = song.lyrics[index + 1];
      return actualTime >= lyric.time && 
             (!nextLyric || actualTime < nextLyric.time);
    });
    
    if (newLyricIndex !== -1) {
      setCurrentLyricIndex(newLyricIndex);
      setTypedText('');
      setCurrentWordIndex(0);
      setLastSyncTime(actualTime);
    }
  };

  // Change playback speed
  const changePlaybackSpeed = (newSpeed: PlaybackSpeed) => {
    setPlaybackSpeed(newSpeed);
  };

  // Keyboard input handler
  useEffect(() => {
    if (typingStatus !== 'playing' || !song) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      // Handle Enter key to manually move to next line
      if (e.key === 'Enter') {
        // If this is the last lyric, finish typing
        if (currentLyricIndex === song.lyrics.length - 1) {
          finishTyping();
        } else {
          // Move to the next line
          jumpToLyric(currentLyricIndex + 1);
        }
        return;
      }
      
      // Get current line to type
      const currentLyric = song.lyrics[currentLyricIndex];
      if (!currentLyric) return;
      
      // Handle backspace
      if (e.key === 'Backspace') {
        if (typedText.length > 0) {
          setTypedText(prev => prev.slice(0, -1));
        }
        return;
      }
      
      // Only accept printable characters (letters, numbers, punctuation, space)
      if (e.key.length === 1) {
        const newTypedText = typedText + e.key;
        setTypedText(newTypedText);
        
        // Check if character is correct
        const targetChar = currentLyric.text[typedText.length];
        if (e.key === targetChar) {
          setCorrectChars(prev => prev + 1);
        } else {
          setIncorrectChars(prev => prev + 1);
        }
        
        // Check if last line is complete to finish the typing game
        if (newTypedText.length === currentLyric.text.length && 
            currentLyricIndex === song.lyrics.length - 1) {
          finishTyping();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingStatus, song, currentLyricIndex, typedText, finishTyping, jumpToLyric]);

  // Start typing game
  const startTyping = () => {
    if (!song) return;
    
    if (!audioLoaded) {
      // If audio is still loading, don't start
      return;
    }
    
    setTypingStatus('playing');
    setStartTime(Date.now());
    setCorrectChars(0);
    setIncorrectChars(0);
    setCurrentLyricIndex(0);
    setTypedText('');
    setCurrentWordIndex(0);
    setTypingStats(null);
    
    // Start audio from beginning
    playAudio(0);
  };

  // Calculate current lyric display 
  const getLyricDisplay = () => {
    if (!song) return { prevLyric: '', currentLyric: '', nextLyric: '' };
    
    const prevLyric = currentLyricIndex > 0 
      ? song.lyrics[currentLyricIndex - 1].text 
      : '';
      
    const currentLyric = song.lyrics[currentLyricIndex]?.text || '';
    
    const nextLyric = currentLyricIndex < song.lyrics.length - 1 
      ? song.lyrics[currentLyricIndex + 1].text 
      : '';
    
    return { prevLyric, currentLyric, nextLyric };
  };

  // Create character spans with appropriate styling
  const renderLyricLine = (text: string) => {
    if (!text) return null;
    
    return text.split('').map((char, index) => {
      let className = 'text-gray-400'; // Untyped
      
      if (index < typedText.length) {
        const typedChar = typedText[index];
        className = typedChar === char ? 'text-green-500' : 'text-red-500';
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const { prevLyric, currentLyric, nextLyric } = getLyricDisplay();

  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
        <p>Song not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white p-4">
      {/* Song Title */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{song.title}</h1>
        <p className="text-gray-400">{song.artist}</p>
        <p className="text-gray-500 text-sm mt-1">Current Time: {displayTime}</p>
      </div>

      {/* Playback Speed Controls */}
      <div className="flex space-x-2 mb-4">
        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
          <button
            key={speed}
            onClick={() => changePlaybackSpeed(speed as PlaybackSpeed)}
            className={`px-2 py-1 text-xs rounded ${
              playbackSpeed === speed 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Sync button */}
      {typingStatus === 'playing' && (
        <button
          onClick={syncWithAudio}
          className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded mb-4"
        >
          Sync with Audio
        </button>
      )}

      {/* Advanced controls */}
      {typingStatus === 'playing' && (
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => isPlaying ? pauseAudio() : playAudio(currentTime)}
            className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={() => {
              if (currentLyricIndex > 0) {
                jumpToLyric(currentLyricIndex - 1);
              }
            }}
            disabled={currentLyricIndex === 0}
            className={`px-3 py-1 text-sm rounded ${
              currentLyricIndex === 0
                ? 'bg-zinc-600 text-gray-400 cursor-not-allowed'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            Previous
          </button>
          
          <button
            onClick={() => {
              if (currentLyricIndex < song.lyrics.length - 1) {
                jumpToLyric(currentLyricIndex + 1);
              }
            }}
            disabled={currentLyricIndex >= song.lyrics.length - 1}
            className={`px-3 py-1 text-sm rounded ${
              currentLyricIndex >= song.lyrics.length - 1
                ? 'bg-zinc-600 text-gray-400 cursor-not-allowed'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Main Typing Interface */}
      <div className="w-full max-w-3xl flex flex-col items-center">
        {typingStatus === 'idle' && (
          <>
            {audioError ? (
              <div className="text-red-500 mb-4">
                {audioError}
                <p className="mt-2 text-sm">
                  Please make sure the audio file is placed at {song.audioUrl}
                </p>
              </div>
            ) : !audioLoaded ? (
              <div className="text-yellow-500 mb-4">
                Loading audio file...
              </div>
            ) : null}
            
            <button
              onClick={startTyping}
              disabled={!!audioError || !audioLoaded}
              className={`px-6 py-3 ${
                audioError || !audioLoaded
                  ? 'bg-zinc-600 cursor-not-allowed' 
                  : 'bg-zinc-800 hover:bg-zinc-700'
              } rounded-md text-white mb-8`}
            >
              Start Typing
            </button>
          </>
        )}
        
        {typingStatus === 'playing' && (
          <>
            {/* Previous Lyric */}
            <div className="w-full text-center mb-4 text-gray-500 text-lg">
              {prevLyric}
            </div>
            
            {/* Current Lyric - to type */}
            <div className="w-full text-center mb-4 text-2xl font-mono">
              {renderLyricLine(currentLyric)}
              {typedText.length === currentLyric.length ? (
                <span className="animate-blink ml-1">|</span>
              ) : (
                <span className="animate-blink ml-0 absolute">|</span>
              )}
            </div>
            
            {/* Next Lyric */}
            <div className="w-full text-center text-gray-500 text-lg">
              {nextLyric}
            </div>

            {/* Hint */}
            <div className="mt-6 text-center text-xs text-gray-500">
              Lines will automatically change as the song plays. Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700">Enter</kbd> to skip to the next line manually
            </div>
          </>
        )}

        {/* Results Display */}
        {typingStatus === 'finished' && typingStats && (
          <div className="w-full bg-zinc-800 p-6 rounded-md">
            <h2 className="text-xl font-bold mb-4">Results</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">WPM</p>
                <p className="text-2xl">{typingStats.wpm}</p>
              </div>
              
              <div>
                <p className="text-gray-400">Accuracy</p>
                <p className="text-2xl">{typingStats.accuracy}%</p>
              </div>
              
              <div>
                <p className="text-gray-400">Raw WPM</p>
                <p className="text-xl">{typingStats.rawWpm}</p>
              </div>
              
              <div>
                <p className="text-gray-400">Time</p>
                <p className="text-xl">{typingStats.timeTaken}s</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={startTyping}
                className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-white"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audio Player (Hidden) - used as fallback */}
      <audio 
        ref={audioRef} 
        src={song.audioUrl} 
        className="hidden"
        preload="auto"
      />
    </div>
  );
} 