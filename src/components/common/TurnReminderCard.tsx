import React, { useEffect, useState } from 'react';
import { Button } from './Button';

interface TurnReminderCardProps {
  roomCode?: string;
  onGoToGame: () => void;
  onDismiss: () => void;
}

export const TurnReminderCard: React.FC<TurnReminderCardProps> = ({ roomCode, onGoToGame, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-5 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />
      
      {/* Card */}
      <div 
        className={`relative w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'}`}
      >
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-500 z-10" />

        <div className="relative z-10 flex flex-col items-center p-8 text-center pt-10">
          <div className="text-5xl mb-4">⏰</div>
          
          <h2 className="mb-2 text-2xl font-black text-white">It's Your Turn!</h2>
          <p className="mb-6 text-gray-300">
            Action is required in your game<br/>
            {roomCode && <span className="text-sm opacity-70">Room: {roomCode}</span>}
          </p>

          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={onDismiss} fullWidth>
              Later
            </Button>
            <Button variant="primary" onClick={onGoToGame} fullWidth>
              Go to Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
