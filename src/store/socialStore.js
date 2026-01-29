import { create } from 'zustand';
import { useGameStore } from './gameStore';
import { socket } from './onlineGameStore';

// Removed separate socket initialization to avoid double connections
// const socket = io(window.location.origin);

export const useSocialStore = create((set, get) => ({
    friends: [],
    searchResults: [],
    isSearching: false,
    isLoading: false,
    pendingInvitations: [],
    socialNotification: false,
    leaderboard: [],
    globalLeaderboard: [],
    gameInvitation: null, // { roomCode, fromName }
    directMessages: {}, // { friendId: [messages] }
    unreadMessages: {}, // { friendId: count }
    typingStatus: {}, // { friendId: isTyping }
    activeChatId: null, // Peer ID for the currently open chat

    setSocialNotification: (val) => {
        set({ socialNotification: val });
        // If we set it to false but still have unreads, it should probably stay true
        // unless it's an explicit cleanup.
        if (val && !Object.keys(get().unreadMessages).length) {
            setTimeout(() => {
                // Only hide if no new unreads came in during the timeout
                if (!Object.keys(get().unreadMessages).length) {
                    set({ socialNotification: false });
                }
            }, 5000);
        }
    },
    setGameInvitation: (val) => {
        set({ gameInvitation: val });
        if (val) {
            setTimeout(() => set({ gameInvitation: null }), 10000); // 10s for game invites
        }
    },

    registerUser: (id, name, emoji, vibeId) => {
        socket.emit('register_user', { id: String(id), name, emoji, vibeId });
    },

    fetchFriends: async (userId) => {
        if (!userId) return;
        const stringId = String(userId);
        set({ isLoading: true });
        try {
            const res = await fetch(`/api/social/friends/${stringId}`);
            if (res.ok) {
                const data = await res.json();
                set({ friends: data });
            }
        } catch (err) {
            console.error('[SOCIAL] Fetch friends error:', err);
        } finally {
            set({ isLoading: false });
        }
    },

    searchUsers: async (query) => {
        if (!query.trim()) return;
        set({ isSearching: true });
        try {
            const res = await fetch(`/api/social/search?query=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                const currentUserId = useGameStore.getState().userProfile?.id;
                set({ searchResults: data.filter(u => u.id !== currentUserId) });
            }
        } catch (err) {
            console.error('[SOCIAL] Search error:', err);
        } finally {
            set({ isSearching: false });
        }
    },

    sendFriendRequest: async (userId, friendId) => {
        try {
            const res = await fetch('/api/social/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, friendId })
            });
            if (res.ok) {
                get().fetchFriends(userId);
            }
            return res.ok;
        } catch (err) {
            console.error('[SOCIAL] Request error:', err);
            return false;
        }
    },

    acceptFriendRequest: async (userId, friendId) => {
        try {
            const res = await fetch('/api/social/friends/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, friendId })
            });
            if (res.ok) {
                get().fetchFriends(userId);
            }
            return res.ok;
        } catch (err) {
            console.error('[SOCIAL] Accept error:', err);
            return false;
        }
    },

    deleteFriend: async (userId, friendId) => {
        try {
            const res = await fetch('/api/social/friends/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, friendId })
            });
            if (res.ok) {
                get().fetchFriends(userId);
            }
            return res.ok;
        } catch (err) {
            console.error('[SOCIAL] Delete error:', err);
            return false;
        }
    },

    inviteFriend: (friendId, roomCode, fromName) => {
        socket.emit('invite_friend', { friendId: String(friendId), roomCode, fromName });
    },

    fetchLeaderboard: async (userId) => {
        if (!userId) return;
        const stringId = String(userId);
        try {
            const res = await fetch(`/api/social/leaderboard/${stringId}`);
            if (res.ok) {
                const data = await res.json();
                set({ leaderboard: data });
            }
        } catch (err) {
            console.error('[SOCIAL] Fetch leaderboard error:', err);
        }
    },

    fetchGlobalLeaderboard: async () => {
        try {
            const res = await fetch('/api/social/leaderboard/global');
            if (res.ok) {
                const data = await res.json();
                set({ globalLeaderboard: data });
            }
        } catch (err) {
            console.error('[SOCIAL] Fetch global leaderboard error:', err);
        }
    },

    clearSearchResults: () => set({ searchResults: [] }),

    updatePresence: (userId, status) => {
        const stringId = String(userId);
        set(state => ({
            friends: state.friends.map(f =>
                String(f.id) === stringId ? { ...f, isOnline: status !== 'OFFLINE', currentStatus: status } : f
            )
        }));
    },

    setActiveChatId: (friendId) => {
        set({ activeChatId: friendId });
        if (friendId) {
            get().markMessagesAsRead(friendId);
        }
    },

    markMessagesAsRead: (friendId) => {
        set(state => {
            const newUnread = { ...state.unreadMessages };
            delete newUnread[friendId];

            // Check if any unread messages remain to update global notification
            const hasUnread = Object.keys(newUnread).length > 0;

            return {
                unreadMessages: newUnread,
                socialNotification: hasUnread
            };
        });
    },

    sendPrivateMessage: (toId, text) => {
        console.log('[CHAT] Sending message to:', toId, text);
        socket.emit('private_message', { toId, text });
        // Optimistically add to our own store
        const fromId = useGameStore.getState().userProfile?.id;
        if (!fromId) return;

        const msg = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            fromId,
            toId: String(toId),
            text,
            timestamp: Date.now(),
            isMe: true
        };

        set(state => ({
            directMessages: {
                ...state.directMessages,
                [toId]: [...(state.directMessages[toId] || []), msg]
            }
        }));
    },

    setTyping: (toId, isTyping) => {
        socket.emit('chat_typing', { toId, isTyping });
    }
}));

// Socket listeners
socket.on('friend_request', () => {
    useSocialStore.getState().setSocialNotification(true);
});

socket.on('game_invitation', (invitation) => {
    useSocialStore.getState().setGameInvitation(invitation);
});

socket.on('user_presence_update', ({ userId, status }) => {
    useSocialStore.getState().updatePresence(userId, status);
});

socket.on('presence_refresh', () => {
    const userId = useGameStore.getState().userProfile?.id;
    if (userId) {
        useSocialStore.getState().fetchFriends(userId);
    }
});

socket.on('private_message', (msg) => {
    console.log('[CHAT] Received socket message:', msg);
    const myId = useGameStore.getState().userProfile?.id;
    const isFromMe = String(msg.fromId) === String(myId);
    const peerId = isFromMe ? String(msg.toId) : String(msg.fromId);
    const peerIdStr = String(peerId);

    console.log('[CHAT] Processing message:', { peerIdStr, isFromMe, myId });

    useSocialStore.setState(state => ({
        directMessages: {
            ...state.directMessages,
            [peerIdStr]: [...(state.directMessages[peerIdStr] || []), { ...msg, isMe: isFromMe }]
        }
    }));

    if (!isFromMe) {
        const state = useSocialStore.getState();
        // If chat with this person is not open, increment unread count
        if (String(state.activeChatId) !== peerIdStr) {
            console.log('[CHAT] Unread count increment for:', peerIdStr);
            useSocialStore.setState(state => ({
                unreadMessages: {
                    ...state.unreadMessages,
                    [peerIdStr]: (state.unreadMessages[peerIdStr] || 0) + 1
                },
                socialNotification: true
            }));

            // Play notification sound (from any component that has access to useFeedback, 
            // but we can't call hooks here. We'll rely on the Dashboard or Navbar to react to socialNotification)
            // Wait, I can try to find a way to play sound here or just ensure it's picked up by a component.
        } else {
            console.log('[CHAT] Marking as read:', peerIdStr);
            state.markMessagesAsRead(peerIdStr);
        }
    }
});

socket.on('chat_typing', ({ fromId, isTyping }) => {
    const state = useSocialStore.getState();
    useSocialStore.setState({
        typingStatus: {
            ...state.typingStatus,
            [fromId]: isTyping
        }
    });
});
