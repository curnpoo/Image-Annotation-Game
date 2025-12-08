import React from 'react';
import type { GameRoom } from '../../types';
import { AvatarDisplay } from '../common/AvatarDisplay';

interface UploadScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    onUploadImage: (file: File) => void;
    onShowSettings?: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
    room,
    currentPlayerId,
    onUploadImage,
    onShowSettings
}) => {
    const currentUploaderId = room.currentUploaderId || room.hostId;
    const isUploader = currentPlayerId === currentUploaderId;
    const uploader = room.players.find(p => p.id === currentUploaderId);
    const uploaderName = uploader ? uploader.name : 'Unknown';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onUploadImage(e.target.files[0]);
        }
    };

    return (
        <div className="min-h-screen p-4 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: 'var(--theme-bg-primary)' }}>

            {/* Settings Button - Top Left with Safe Area */}
            <button
                onClick={onShowSettings}
                className="absolute left-4 bg-white/10 backdrop-blur-md p-2 rounded-xl text-white hover:bg-white/20 transition-all active:scale-95 border border-white/10 z-50"
                style={{ top: 'max(1rem, env(safe-area-inset-top) + 0.5rem)' }}
            >
                ⚙️
            </button>

            {/* Decorative elements */}
            <div className="absolute top-10 left-10 text-6xl animate-bounce">📸</div>
            <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDelay: '0.5s' }}>🖼️</div>

            <div className="w-full max-w-md space-y-8 relative z-10 text-center pop-in">

                <div className="rounded-[2rem] p-8 shadow-2xl"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: '2px solid var(--theme-border)'
                    }}>
                    <h2 className="text-3xl font-black mb-6" style={{ color: 'var(--theme-text)' }}>
                        Round {room.roundNumber + 1}
                    </h2>

                    {isUploader ? (
                        <div className="space-y-6">
                            <div className="text-xl font-bold" style={{ color: 'var(--theme-text-secondary)' }}>
                                It's your turn to pick the image!
                            </div>

                            <div className="rounded-3xl p-8 border-4 border-dashed relative cursor-pointer hover:scale-105 transition-transform group"
                                style={{
                                    backgroundColor: 'var(--theme-bg-secondary)',
                                    borderColor: 'var(--theme-accent)'
                                }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📤</div>
                                <div className="font-bold" style={{ color: 'var(--theme-accent)' }}>
                                    Tap to Upload Image
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <AvatarDisplay
                                    strokes={uploader?.avatarStrokes || []}
                                    avatar={uploader?.avatar}
                                    frame={uploader?.frame}
                                    color={uploader?.color}
                                    backgroundColor={uploader?.backgroundColor}
                                    size={120}
                                    className="animate-bounce"
                                />
                            </div>

                            <div className="text-xl font-bold" style={{ color: 'var(--theme-text-secondary)' }}>
                                Waiting for <span style={{ color: uploader?.color, fontWeight: 'bold' }}>{uploaderName}</span>...
                            </div>

                            <div className="font-bold animate-pulse" style={{ color: 'var(--theme-text-secondary)' }}>
                                They are choosing an image for us to draw!
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
