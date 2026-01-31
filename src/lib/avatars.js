export const AVATARS = [
    { id: 'cyber_1', name: 'CORE-01', emoji: '🤖', path: '/avatars/cyber_1.png' },
    { id: 'cyber_2', name: 'NEON-V8', emoji: '👩‍💻', path: '/avatars/cyber_2.png' },
    { id: 'cyber_3', name: 'SHADOW_EXE', emoji: '🥷', path: '/avatars/cyber_3.png' },
    { id: 'cyber_4', name: 'DRONE_EYE', emoji: '👁️', path: '/avatars/cyber_4.png' },
];

export const getAvatarPath = (id) => {
    const avatar = AVATARS.find(a => a.id === id);
    return avatar ? avatar.path : '/avatars/cyber_1.png';
};
