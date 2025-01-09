import { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import './App.css'
import { Timer } from './types/timer';

interface DraggableTimerProps {
  timer: Timer;
  index: number;
  moveTimer: (dragIndex: number, hoverIndex: number) => void;
  toggleTimer: (id: string) => void;
  toggleWork: (id: string) => void;
  resetTimer: (id: string) => void;
  adjustTime: (id: string, amount: number) => void;
  playSound: (soundType: 'button' | 'alert') => void;
  updateTimer: (id: string, updates: Partial<Timer>) => void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 animate-slideIn">
        <h2 className="text-xl font-bold text-gray-900 mb-4">初期状態に戻しますか？</h2>
        <p className="text-gray-600 mb-6">
          この操作は取り消せません。
          現在のタイマーの状態はすべて失われます。
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            初期状態に戻す
          </button>
        </div>
      </div>
    </div>
  );
};

const DraggableTimer: React.FC<DraggableTimerProps> = ({ 
  timer, 
  index, 
  moveTimer, 
  toggleTimer, 
  toggleWork,
  resetTimer, 
  adjustTime, 
  playSound,
  updateTimer 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(timer.name);
  const [editMemo, setEditMemo] = useState(timer.memo);

  const [{ isDragging }, drag] = useDrag({
    type: 'timer',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'timer',
    hover(item: { index: number }) {
      if (item.index !== index) {
        moveTimer(item.index, index);
        item.index = index;
      }
    },
  });

  const handleSave = () => {
    updateTimer(timer.id, {
      name: editName,
      memo: editMemo
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(timer.name);
    setEditMemo(timer.memo);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`flex items-center m-2 p-2 ${
        timer.timeLeft === 0 
          ? 'bg-black' 
          : timer.name !== '' 
            ? timer.color 
            : 'bg-gray-500'
      } text-white border-black border-4 rounded transition-colors duration-300`}
    >
      <div className="flex-1">
        <div className='flex items-center'>
          <div className={`name-text text-black rounded ${
            timer.isWorkRemaining ? 'bg-yellow-500' : 'bg-white'
          }`}>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-3xl font-bold text-black bg-white px-2 py-1 rounded w-full"
                autoFocus
              />
            ) : (
              <p className="text-3xl font-bold" onClick={() => setIsEditing(true)}>
                {timer.name} 【{timer.id}】
              </p>
            )}
          </div>
          <button
            onClick={() => {
              playSound('button');
              toggleWork(timer.id);
            }}
            disabled={isEditing}
            className="ml-2 px-4 py-2 bg-gray-700 rounded"
          >
            続
          </button>
        </div>
        <div className='timer-text my-2 rounded'>
          <p className='text-4xl font-bold'>
            {Math.floor(timer.timeLeft / 60)}:{(timer.timeLeft % 60).toString().padStart(2, '0')}
          </p>
        </div>
        <div className='memo-text mb-2 rounded'>
          {isEditing ? (
            <input
              type="text"
              value={editMemo}
              onChange={(e) => setEditMemo(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-3xl bg-white text-black px-2 py-1 rounded w-full"
            />
          ) : (
            <p className='text-3xl' onClick={() => setIsEditing(true)}>
              {timer.memo}
            </p>
          )}
        </div>
        {isEditing && (
          <div className="py-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 rounded mr-2 hover:bg-green-700"
            >
              保存
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
            >
              キャンセル
            </button>
          </div>
        )}
        <div className='py-2'>
          <button
            onClick={() => {
              playSound('button');
              adjustTime(timer.id, 60);
            }}
            disabled={timer.isRunning || isEditing}
            className="px-4 py-2 bg-gray-700 rounded"
          >
            +1分
          </button>
          <button
            onClick={() => {
              playSound('button');
              adjustTime(timer.id, -60);
            }}
            disabled={timer.isRunning || isEditing}
            className="ml-2 px-4 py-2 bg-gray-700 rounded"
          >
            -1分
          </button>
          <button
            onClick={() => {
              playSound('button');
              adjustTime(timer.id, 600);
            }}
            disabled={isEditing}
            className="ml-2 px-4 py-2 bg-gray-700 rounded"
          >
            +10分
          </button>
        </div>
        <div className='py-2'>
          <button
            onClick={() => {
              playSound('button');
              toggleTimer(timer.id);
            }}
            disabled={isEditing}
            className="px-4 py-2 bg-gray-700 rounded"
          >
            {timer.isRunning ? '停止' : '開始'}
          </button>
          <button
            onClick={() => {
              playSound('button');
              resetTimer(timer.id);
            }}
            disabled={timer.isRunning || isEditing}
            className="ml-2 px-4 py-2 bg-gray-700 rounded"
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  );
};
const defaultTimers: Timer[] = [
  {
    id: '1',
    name: '',
    memo: '',
    timeLeft: 1200,
    isRunning: false,
    isWorkRemaining: false,
    color: 'bg-red-500',
  },
  {
    id: '2',
    name: '',
    memo: '',
    timeLeft: 1200,
    isRunning: false,
    isWorkRemaining: false,
    color: 'bg-blue-500',
  },
  {
    id: '3',
    name: '',
    memo: '',
    timeLeft: 1200,
    isRunning: false,
    isWorkRemaining: false,
    color: 'bg-green-500',
  },
  {
    id: '5',
    name: '',
    memo: '',
    timeLeft: 1200,
    isRunning: false,
    isWorkRemaining: false,
    color: 'bg-yellow-500',
  },
  {
    id: '②',
    name: '',
    memo: '',
    timeLeft: 1200,
    isRunning: false,
    isWorkRemaining: false,
    color: 'bg-orange-500',
  },
  {
    id: '③',
    name: '',
    memo: '',
    timeLeft: 1200,
    isRunning: false,
    isWorkRemaining: false,
    color: 'bg-pink-500',
  },
  {
    id: '⑤',
    name: '',
    memo: '',
    timeLeft: 1200,
    isRunning: false,
    isWorkRemaining: false,
    color: 'bg-blue-200',
  },
  {
    id: 'sub',
    name: '',
    memo: '',
    timeLeft: 1200,
    isRunning: false,
    isWorkRemaining: false,
    color: 'bg-green-200',
  },
];

function App() {
  const [timers, setTimers] = useState<Timer[]>(() => {
    try {
      const savedTimers = localStorage.getItem('timers');
      if (savedTimers) {
        const parsedTimers = JSON.parse(savedTimers);
        return parsedTimers.map((timer: Timer) => ({
          ...timer,
          isRunning: false
        }));
      }
    } catch (error) {
      console.error('Failed to load timers from localStorage:', error);
    }
    return defaultTimers;
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // 音声をプリロード
  const [sounds] = useState(() => ({
    button: new Audio('/button-sound.mp3'),
    alert: new Audio('/alert-sound.mp3')
  }));

  useEffect(() => {
    try {
      localStorage.setItem('timers', JSON.stringify(timers));
    } catch (error) {
      console.error('Failed to save timers to localStorage:', error);
    }
  }, [timers]);

  const toggleTimer = (id: string) => {
    setTimers(timers.map(timer => 
      timer.id === id
      ? { ...timer, isRunning: !timer.isRunning }
      : timer
    ));
  };

  const resetTimer = (id: string) => {
    setTimers(timers.map(timer =>
      timer.id === id
        ? { ...timer, timeLeft: 0, isRunning: false }
        : timer
    ));
  };

  const toggleWork = (id: string) => {
    setTimers(timers.map(timer =>
      timer.id === id
        ? { ...timer, isWorkRemaining: !timer.isWorkRemaining }
        : timer
    ));
  };

  const updateTimer = (id: string, updates: Partial<Timer>) => {
    setTimers(timers.map(timer =>
      timer.id === id
        ? { ...timer, ...updates }
        : timer
    ));
  };

  const adjustTime = (id: string, amount: number) => {
    setTimers(timers.map(timer =>
      timer.id === id && (!timer.isRunning || amount === 600)
        ? timer.timeLeft + amount >= 0 
          ? { ...timer, timeLeft: timer.timeLeft + amount }
          : { ...timer, timeLeft: 0 }
        : timer
    ));
  };

  const moveTimer = (dragIndex: number, hoverIndex: number) => {
    const newTimers = [...timers];
    const draggedTimer = newTimers[dragIndex];
    newTimers.splice(dragIndex, 1);
    newTimers.splice(hoverIndex, 0, draggedTimer);
    setTimers(newTimers);
  };

  const handleClearSavedState = () => {
    try {
      localStorage.removeItem('timers');
      setTimers(defaultTimers);
    } catch (error) {
      console.error('Failed to clear saved state:', error);
    }
  };

  const playSound = useCallback((soundType: 'button' | 'alert') => {
    const sound = sounds[soundType];
    sound.currentTime = 0;
    sound.play().catch((error) => console.error("音声の再生に失敗しました:", error));
  }, [sounds]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimers(prevTimers => prevTimers.map(timer => {
        if (timer.isRunning && timer.timeLeft > 0) {
          return { ...timer, timeLeft: timer.timeLeft - 1 };
        } else if (timer.timeLeft === 0) {
          if (timer.isRunning) {
            playSound('alert');
          }
        }
        return timer;
      }));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timers, playSound]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-wrap timer-container">
        {timers.map((timer, index) => (
          <DraggableTimer
            key={timer.id}
            timer={timer}
            index={index}
            moveTimer={moveTimer}
            toggleTimer={toggleTimer}
            toggleWork={toggleWork}
            resetTimer={resetTimer}
            adjustTime={adjustTime}
            playSound={playSound}
            updateTimer={updateTimer}
          />
        ))}
      </div>
      <div className="my-4">
        <button
          onClick={() => setIsConfirmModalOpen(true)}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
        >
          初期状態に戻す
        </button>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleClearSavedState}
      />
    </DndProvider>
  );
}

export default App;