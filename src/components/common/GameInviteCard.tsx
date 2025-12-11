import React, { useEffect, useState } from 'react';
import type { GameInvite } from '../../types';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { Button } from './Button';

interface GameInviteCardProps {
  invite: GameInvite;
  onJoin: (roomCode: string) => void;
  onDecline: () => void;
}

export const GameInviteCard: React.FC<GameInviteCardProps> = ({ invite, onJoin, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-5 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDecline} />
      
      {/* Card */}
      <div 
        className={`relative w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'}`}
      >
        {/* Gradient Header */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center p-8 text-center">
          <AvatarDisplay
            size={80}
            playerId={invite.fromUserId}
          />
          
          <h2 className="mt-4 mb-2 text-2xl font-black text-white">Game Invite!</h2>
          <p className="mb-6 text-gray-300">
            <strong className="text-white">{invite.fromUsername}</strong> invited you to play<br/>
            in Room <strong className="text-blue-400">{invite.roomCode}</strong>
          </p>

          <div className="flex gap-3 w-full mt-2">
            <Button 
              variant="secondary" 
              onClick={onDecline}
              fullWidth
            >
              Decline
            </Button>
            <Button 
              variant="primary" 
              onClick={() => onJoin(invite.roomCode)}
              fullWidth
            >
              Join Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
