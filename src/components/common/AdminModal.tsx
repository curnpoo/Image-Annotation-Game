import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/admin';
import { formatCurrency } from '../../services/currency';
import type { UserAccount } from '../../types';

interface AdminModalProps {
    onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ onClose }) => {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        const allUsers = await AdminService.getAllUsers();
        setUsers(allUsers);
        setIsLoading(false);
    };

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const toggleAll = () => {
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            const allIds = new Set(users.map(u => u.id));
            setSelectedUsers(allIds);
        }
    };

    const handleGrant = async () => {
        if (selectedUsers.size === 0) return;

        setIsSending(true);
        setStatusMessage('Sending stimulus... 💸');

        try {
            const count = await AdminService.grantStimulusToUsers(Array.from(selectedUsers), 50);
            setStatusMessage(`Success! Sent $50 to ${count} users! 🤑`);

            // Refresh list to show new balances
            await loadUsers();

            // Reset selection
            setSelectedUsers(new Set());

            setTimeout(() => {
                setStatusMessage(null);
                setIsSending(false);
            }, 2000);
        } catch (error) {
            setStatusMessage('Failed to send funds 😢');
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

            <div className="relative z-10 bg-white rounded-[2rem] w-full max-w-lg p-6 shadow-2xl pointer-events-auto flex flex-col max-h-[85vh] animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">GOD MODE ⚡️</h2>
                        <p className="text-gray-500 text-sm font-bold">Manage the economy</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin text-4xl">⚡️</div>
                        </div>
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="flex justify-between items-center mb-2 px-1">
                                <button
                                    onClick={toggleAll}
                                    className="text-sm font-bold text-purple-600 hover:bg-purple-50 px-2 py-1 rounded"
                                >
                                    {selectedUsers.size === users.length ? 'Deselect All' : 'Select All'}
                                </button>
                                <span className="text-sm font-bold text-gray-500">
                                    {selectedUsers.size} Selected
                                </span>
                            </div>

                            {/* User List */}
                            <div className="flex-1 overflow-y-auto space-y-2 p-1">
                                {users.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98] ${selectedUsers.has(user.id)
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedUsers.has(user.id) ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                                                }`}>
                                                {selectedUsers.has(user.id) && <span className="text-white text-xs">✓</span>}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{user.username}</div>
                                                <div className="text-xs text-gray-400 font-mono">{user.id.slice(0, 6)}...</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-green-600">
                                            {formatCurrency(user.currency || 0)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex-shrink-0">
                    <button
                        onClick={handleGrant}
                        disabled={selectedUsers.size === 0 || isSending}
                        className={`w-full py-4 rounded-xl font-black text-xl shadow-lg transition-all ${selectedUsers.size === 0 || isSending
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-500 text-white hover:bg-green-600 active:scale-95 hover:shadow-green-500/30'
                            }`}
                    >
                        {statusMessage ? statusMessage : `Grant $50 to ${selectedUsers.size} Users 💸`}
                    </button>
                    {statusMessage && statusMessage.includes('Success') && (
                        <p className="text-center text-xs text-green-600 font-bold mt-2 animate-pulse">
                            Transaction Complete!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
