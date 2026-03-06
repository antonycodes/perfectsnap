import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Target, XCircle, AlertCircle, FastForward, Clock, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type GameState = 'setup' | 'playing' | 'result' | 'final_result';

interface SongInfo {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
  keywordTimestamp: number; // Absolute time in song
  chorusStartTime: number; // Absolute time in song where chorus starts
  audioUrl?: string;
  sourceUrl?: string;
  keyword: string;
  targetStart: number;
  targetEnd: number;
}

const PRESETS: SongInfo[] = [
  {
    id: 'hay-trao-cho-anh',
    title: 'Hãy trao cho anh',
    artist: 'Sơn Tùng M-TP',
    keyword: 'khung trời riêng',
    audioUrl: 'https://res.cloudinary.com/dxikjdqqn/video/upload/v1772790546/haytraochoanh_c7lypk.mp3',
    targetStart: 15.0,
    targetEnd: 16.0,
    chorusStartTime: 0,
    lyrics: '...khung trời riêng...',
    keywordTimestamp: 10.0
  },
  {
    id: 'khong-thoi-gian',
    title: 'Không thời gian',
    artist: 'Dương Domic',
    keyword: 'Bình yên',
    audioUrl: 'https://res.cloudinary.com/dxikjdqqn/video/upload/v1772790546/khongthoigian_mnq4bz.mp3',
    targetStart: 14.0,
    targetEnd: 15.0,
    chorusStartTime: 0,
    lyrics: '...Bình yên...',
    keywordTimestamp: 10.0
  },
  {
    id: 'viet-nam-oi',
    title: 'Việt Nam ơi',
    artist: 'Minh Beta',
    keyword: 'tiếng trẻ thơ',
    audioUrl: 'https://res.cloudinary.com/dxikjdqqn/video/upload/v1772790546/vietnamoi_hcw8fv.mp3',
    targetStart: 20.0,
    targetEnd: 22.0,
    chorusStartTime: 0,
    lyrics: '...tiếng trẻ thơ...',
    keywordTimestamp: 10.0
  }
];

const SESSION_TIME_LIMIT = 180; // 3 minutes
const SONGS_PER_SESSION = 3;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('setup');
  
  // Session State
  const [sessionSongs, setSessionSongs] = useState<SongInfo[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_TIME_LIMIT);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionResults, setSessionResults] = useState<{song: SongInfo, success: boolean, time: number}[]>([]);
  
  // Current Song State
  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const [viewDuration] = useState<number>(30); // Fixed 30s chorus
  const [relativeTime, setRelativeTime] = useState<number>(0);
  const [finalTime, setFinalTime] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const requestRef = useRef<number>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const startSession = () => {
    // Ensure we have enough presets, otherwise just use what we have
    const shuffled = shuffleArray(PRESETS).slice(0, SONGS_PER_SESSION);
    if (shuffled.length === 0) {
      showToast("Không có bài hát nào để chơi!");
      return;
    }
    
    setSessionSongs(shuffled);
    setCurrentSongIndex(0);
    setSessionTimeLeft(SESSION_TIME_LIMIT);
    setSessionScore(0);
    setSessionResults([]);
    
    loadSong(shuffled[0]);
    setGameState('playing');
    
    // Start global timer
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    sessionTimerRef.current = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const loadSong = (song: SongInfo) => {
    setSongInfo(song);
    setRelativeTime(0);
    
    if (audioRef.current) {
      audioRef.current.src = song.audioUrl || '';
      audioRef.current.currentTime = song.chorusStartTime;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => {
        console.error("Audio play failed:", err);
        showToast("Không thể phát nhạc. Vui lòng thử lại.");
        setIsPlaying(false);
      });
    }
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.error(err));
    }
  };

  const replayCurrentSong = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!songInfo || !audioRef.current) return;
    audioRef.current.currentTime = songInfo.chorusStartTime;
    setRelativeTime(0);
    audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.error(err));
  };

  const nextSong = () => {
    const nextIndex = currentSongIndex + 1;
    if (nextIndex < sessionSongs.length && sessionTimeLeft > 0) {
      setCurrentSongIndex(nextIndex);
      loadSong(sessionSongs[nextIndex]);
      setGameState('playing');
    } else {
      endSession();
    }
  };

  const endSession = () => {
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setGameState('final_result');
  };

  const onAudioError = () => {
    if (songInfo?.audioUrl) {
      showToast("Không thể tải file âm thanh. Vui lòng kiểm tra lại đường dẫn.");
    }
  };

  const stopGame = useCallback(() => {
    if (!songInfo || gameState !== 'playing') return;
    
    if (audioRef.current) {
      const absoluteStop = audioRef.current.currentTime;
      const relativeStop = absoluteStop - songInfo.chorusStartTime;
      audioRef.current.pause();
      setIsPlaying(false);
      setFinalTime(relativeStop);
      setRelativeTime(relativeStop);
      
      const isSuccess = relativeStop >= songInfo.targetStart && relativeStop <= songInfo.targetEnd;
      if (isSuccess) {
        setSessionScore(prev => prev + 1);
      }
      
      setSessionResults(prev => [...prev, {
        song: songInfo,
        success: isSuccess,
        time: relativeStop
      }]);
    }
    setGameState('result');
  }, [songInfo, gameState]);

  const updateUI = useCallback(() => {
    if (audioRef.current && gameState === 'playing' && songInfo) {
      const rel = audioRef.current.currentTime - songInfo.chorusStartTime;
      setRelativeTime(rel);
      
      if (audioRef.current.ended || rel >= viewDuration) {
        // Auto stop if it reaches the end of the view duration
        stopGame();
      } else {
        requestRef.current = requestAnimationFrame(updateUI);
      }
    }
  }, [gameState, stopGame, songInfo, viewDuration]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(updateUI);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, updateUI]);

  const resetGame = () => {
    setGameState('setup');
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing') {
          stopGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, stopGame]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isSuccess = songInfo ? (finalTime >= songInfo.targetStart && finalTime <= songInfo.targetEnd) : false;
  const displayMax = viewDuration;
  const progressPercent = Math.min((relativeTime / displayMax) * 100, 100);
  const targetStartPct = songInfo ? (songInfo.targetStart / displayMax) * 100 : 0;
  const targetEndPct = songInfo ? (songInfo.targetEnd / displayMax) * 100 : 0;
  const targetWidthPct = targetEndPct - targetStartPct;

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${
        gameState === 'result' ? (isSuccess ? 'bg-green-50' : 'bg-red-50') : 'bg-slate-50'
      }`}
      onClick={() => {
        if (gameState === 'playing') stopGame();
      }}
    >
      {/* Global Timer Header */}
      {gameState !== 'setup' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-md border border-slate-200 flex items-center gap-3 z-50">
          <Clock className={`w-5 h-5 ${sessionTimeLeft < 30 ? 'text-red-600 animate-pulse' : 'text-slate-600'}`} />
          <span className={`font-mono font-black text-xl ${sessionTimeLeft < 30 ? 'text-red-600' : 'text-slate-800'}`}>
            {formatTime(sessionTimeLeft)}
          </span>
        </div>
      )}

      <div id="game-container" className={`max-w-3xl w-full bg-white border-4 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12 transition-all duration-300 ${
        isSuccess && gameState === 'result' ? 'border-green-500 shadow-green-100' : 'border-slate-200'
      }`}
      onClick={(e) => e.stopPropagation()} // Prevent clicks inside container from triggering snap
      >
        
        <AnimatePresence mode="wait">
          {gameState === 'setup' && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-5xl font-black text-red-600 tracking-tighter uppercase bold italic">Perfect Snap</h1>
                <p className="text-slate-500 mt-2 font-medium">Dừng để chiến thắng!</p>
              </div>
              
              <div className="space-y-5 bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 text-center">
                <h2 className="font-black text-xl uppercase text-slate-800">Luật chơi</h2>
                <ul className="text-slate-600 text-sm space-y-2 text-left max-w-md mx-auto list-disc pl-5">
                  <li>Một phần chơi gồm <strong>{SONGS_PER_SESSION} bài hát</strong> ngẫu nhiên.</li>
                  <li>Bạn có tổng cộng <strong>{formatTime(SESSION_TIME_LIMIT)}</strong> để hoàn thành.</li>
                  <li>Nghe nhạc và nhấn <strong>Space</strong> hoặc <strong>chạm màn hình</strong> khi nghe thấy từ khóa.</li>
                  <li>Bạn có thể nghe lại (replay) bài hát nhiều lần nếu chưa chắc chắn.</li>
                </ul>
              </div>

              <button 
                onClick={startSession}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-red-200 text-xl uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6 fill-current" />
                Bắt đầu chơi
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && songInfo && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-12 flex flex-col items-center"
            >
              <div className="flex justify-between w-full items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-black text-sm">
                    {currentSongIndex + 1}/{sessionSongs.length}
                  </div>
                  <div className="text-slate-800 font-black uppercase tracking-tighter">
                    {songInfo.title}
                  </div>
                </div>
                <div className="text-slate-400 text-xs font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200 uppercase">
                  Từ khóa: "{songInfo.keyword}"
                </div>
              </div>

              <div className="text-center py-4 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600">Live Tracking</span>
                </div>
                <div id="main-timer" className="text-[120px] font-black leading-none mono-font tracking-tighter">
                  {relativeTime.toFixed(3)}
                </div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-red-600 mt-2">Seconds</div>
              </div>

              <div className="w-full space-y-2">
                <div className="timeline-container">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={togglePlayPause} 
                      className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button 
                      onClick={replayCurrentSong} 
                      className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="timeline-wrapper">
                    <div className="main-track">
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                      <div id="ui-seeker" className="seeker-line" style={{ left: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between px-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>0:00</span>
                  <span>0:15</span>
                  <span>0:30</span>
                </div>
              </div>

              <div className="text-center space-y-6">
                <p className="text-red-600 pulse-red font-black text-2xl uppercase italic tracking-tighter">Nhấn [PHÍM CÁCH] hoặc chạm màn hình!</p>
                <button 
                  onClick={resetGame}
                  className="text-slate-400 hover:text-red-600 font-bold text-sm uppercase transition-colors flex items-center gap-2 mx-auto"
                >
                  <XCircle className="w-4 h-4" />
                  Hủy lượt chơi
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'result' && songInfo && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-center"
            >
              <div className="text-8xl mx-auto drop-shadow-lg">
                {isSuccess ? '👑' : '💥'}
              </div>
              <h2 className={`text-5xl font-black tracking-tighter uppercase italic ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {isSuccess ? 'Chiến Thắng!' : 'Hụt Mất Rồi!'}
              </h2>
              
              <div className="bg-white p-6 rounded-[2rem] space-y-4 border-2 border-slate-100 shadow-lg">
                <div className="flex justify-between items-center border-b-2 border-slate-50 pb-3">
                  <span className="text-slate-400 font-bold uppercase text-xs">Bạn đã dừng lúc:</span>
                  <span className="font-black text-3xl font-digital text-slate-900">{finalTime.toFixed(3)}s</span>
                </div>
                <div className="flex justify-between items-center border-b-2 border-slate-50 pb-3">
                  <span className="text-slate-400 font-bold uppercase text-xs">Từ khóa "{songInfo.keyword}" lúc:</span>
                  <span className="font-black text-lg text-red-600">{songInfo.targetStart.toFixed(2)}s - {songInfo.targetEnd.toFixed(2)}s</span>
                </div>
                
                <div className="w-full space-y-2 mt-4">
                  <div className="timeline-container">
                    <div className="text-slate-300 p-2">
                      <Play className="w-6 h-6" />
                    </div>
                    <div className="timeline-wrapper">
                      <div className="main-track">
                        {/* Background progress */}
                        <div className="progress-fill opacity-10" style={{ width: `${(finalTime / displayMax) * 100}%` }}></div>
                        
                        {/* Animated Target Zone Reveal */}
                        <motion.div 
                          initial={{ opacity: 0, scaleY: 0 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          transition={{ delay: 0, duration: 0.1 }}
                          className="target-zone" 
                          style={{ left: `${targetStartPct}%`, width: `${targetWidthPct}%` }}
                        >
                          <div className="target-label">
                            <div className="wavy-line"></div>
                            <span className="ans-text">Đáp án</span>
                          </div>
                        </motion.div>

                        {/* Seeker with Result Indicator */}
                        <div className="seeker-line" style={{ left: `${(finalTime / displayMax) * 100}%` }}>
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0, type: "spring" }}
                            className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg ${
                              isSuccess ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}
                          >
                            {isSuccess ? 'Perfect' : 'Missed'}
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between px-16 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>0:00</span>
                    <span>0:15</span>
                    <span>0:30</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={nextSong}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all shadow-xl text-xl uppercase flex items-center justify-center gap-3"
              >
                {currentSongIndex < sessionSongs.length - 1 ? (
                  <>Tiếp tục <FastForward className="w-6 h-6" /></>
                ) : (
                  <>Xem kết quả <Trophy className="w-6 h-6" /></>
                )}
              </button>
            </motion.div>
          )}

          {gameState === 'final_result' && (
            <motion.div 
              key="final_result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 text-center"
            >
              <div className="text-center">
                <Trophy className="w-24 h-24 mx-auto text-yellow-500 mb-4" />
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Tổng Kết</h1>
              </div>
              
              <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 space-y-6">
                <div className="flex justify-between items-center border-b-2 border-slate-200 pb-4">
                  <span className="text-slate-500 font-bold uppercase">Điểm số:</span>
                  <span className="font-black text-4xl text-red-600">{sessionScore}/{sessionSongs.length}</span>
                </div>
                <div className="flex justify-between items-center border-b-2 border-slate-200 pb-4">
                  <span className="text-slate-500 font-bold uppercase">Thời gian còn lại:</span>
                  <span className="font-black text-2xl text-slate-900">{formatTime(sessionTimeLeft)}</span>
                </div>
                
                <div className="space-y-3 mt-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase text-left">Chi tiết:</h3>
                  {sessionResults.map((res, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                      <div className="text-left">
                        <div className="font-bold text-slate-800 text-sm">{res.song.title}</div>
                        <div className="text-xs text-slate-400">Dừng ở: {res.time.toFixed(2)}s</div>
                      </div>
                      <div className={`font-black text-xs uppercase px-2 py-1 rounded ${res.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {res.success ? 'Perfect' : 'Missed'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={resetGame}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-red-200 text-xl uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <RotateCcw className="w-6 h-6" />
                Chơi lại từ đầu
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-8 left-1/2 bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl z-50 flex items-center gap-3"
          >
            <AlertCircle className="w-6 h-6" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <audio 
        ref={audioRef} 
        onError={onAudioError}
        className="hidden" 
      />
    </div>
  );
}
