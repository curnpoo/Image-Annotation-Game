
import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, Player } from '../../types';
import { StorageService } from '../../services/storage';
import { generateId } from '../../utils/id';

interface FloatingChatProps {
    roomCode: string;
    player: Player;
    messages: ChatMessage[];
}

interface Bubble {
    id: string;
    message: ChatMessage;
    x: number;
    y: number;
    rotation: number;
    createdAt: number;
}

export const FloatingChat = ({ roomCode, player, messages }: FloatingChatProps) => {
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [inputText, setInputText] = useState('');
    const [isInputVisible, setIsInputVisible] = useState(false);
    const lastProcessedIdRef = useRef<string | null>(null);

    // Initial load: don't show old messages as bubbles, only new ones
    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (!lastProcessedIdRef.current) {
                lastProcessedIdRef.current = lastMsg.id;
            }
        }
    }, []);

    // Effect: Handle new messages
    useEffect(() => {
        if (messages.length === 0) return;

        // Find index of last processed
        const lastIndex = messages.findIndex(m => m.id === lastProcessedIdRef.current);
        const actualNewMessages = lastIndex === -1
            ? messages // All new if last not found (or fresh load)
            : messages.slice(lastIndex + 1);

        if (actualNewMessages.length > 0) {
            const newBubbles = actualNewMessages.map(msg => createBubble(msg));
            setBubbles(prev => [...prev, ...newBubbles]);
            lastProcessedIdRef.current = actualNewMessages[actualNewMessages.length - 1].id;
        }

    }, [messages]);

    // Effect: Cleanup old bubbles (every 1s check)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setBubbles(prev => prev.filter(b => now - b.createdAt < 10000)); // 10 seconds
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const createBubble = (msg: ChatMessage): Bubble => {
        // Random position logic:
        // Truly random scattering (avoiding dead center 30-70%X, 30-70%Y)
        // We defined "Zones" before, but user wants "random place on screen"
        // Let's make it a bit more chaotic but still safe-ish.

        // Random Rotation (-15 to 15 degrees)
        const rotation = Math.random() * 30 - 15;

        let x, y;

        // Try to generate a valid position (up to 5 attempts)
        for (let i = 0; i < 5; i++) {
            x = 5 + Math.random() * 90;
            y = 10 + Math.random() * 80;

            // Simple check if it's in the middle (30-70% X and Y)
            if (x > 30 && x < 70 && y > 30 && y < 70) {
                continue; // Try again
            }
            break; // Good enough
        }

        return {
            id: generateId(),
            message: msg,
            x: x || 50,
            y: y || 85,
            rotation,
            createdAt: Date.now()
        };
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        try {
            await StorageService.sendChatMessage(roomCode, player, inputText);
            setInputText('');
            setIsInputVisible(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-50">
            {/* Removed overflow-hidden to prevent clipping issues with input/keyboard */}
            {/* Bubbles */}
            {bubbles.map(b => (
                <div
                    key={b.id}
                    className="absolute flex flex-col items-center animate-float-fade"
                    style={{
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        maxWidth: '200px',
                        transform: 'translate(-50%, -50%)', // Centering logic handles the position
                        // CSS custom property for dynamic rotation in animation
                        '--bubble-rotate': `${b.rotation}deg`
                    } as React.CSSProperties}
                >
                    {/* Avatar/Name */}
                    <div
                        className="w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center text-sm shadow-md mb-1 z-10 relative"
                        style={{ borderColor: b.message.playerName === player.name ? '#FF69B4' : '#ccc' }}
                    >
                        {/* Use emoji or initial */}
                        {b.message.playerAvatar || b.message.playerName.charAt(0)}
                    </div>

                    {/* Message Bubble - 90s Style */}
                    <div
                        className="bg-white/95 px-4 py-2 rounded-2xl shadow-lg border-2 text-sm font-bold text-gray-800 break-words w-full text-center relative bubble-tail"
                        style={{
                            borderColor: b.message.playerName === player.name ? '#FF69B4' : '#9B59B6',
                            transform: `rotate(${b.rotation}deg)`
                        }}
                    >
                        {b.message.text}
                    </div>
                </div>
            ))}

            {/* Input Trigger / Field */}
            <div className="absolute bottom-24 right-4 pointer-events-auto flex items-center justify-end">
                {/* Collapsed/Expanded Container */}
                <div
                    className={`bg-white rounded-full shadow-xl flex items-center border-2 border-purple-500 overflow-hidden transition-all duration-300 ease-out ${isInputVisible ? 'w-[280px] p-1' : 'w-12 h-12 p-0 justify-center cursor-pointer hover:scale-110 active:scale-95'
                        }`}
                    onClick={() => !isInputVisible && setIsInputVisible(true)}
                >
                    {!isInputVisible ? (
                        <span className="text-2xl">💬</span>
                    ) : (
                        <div className="flex w-full gap-2 pl-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-sm font-medium"
                                placeholder="Say something..."
                                maxLength={50}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                onBlur={() => {
                                    // Delay closing to allow button click
                                    setTimeout(() => {
                                        // optional: if empty close?
                                    }, 200);
                                }}
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSend(); }}
                                className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold hover:bg-purple-700 transition-colors flex-shrink-0"
                            >
                                ↑
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Click outside to close input */}
            {isInputVisible && (
                <div
                    className="fixed inset-0 z-[-1] pointer-events-auto"
                    onClick={() => setIsInputVisible(false)}
                />
            )}
        </div>
    );
};
