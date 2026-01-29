
import { useGameStore } from './src/store/gameStore.js';

// Mock get/set for zustand (simplified for node environment if possible, 
// but zustand/persist might need browser API.
// Actually, running this in Node might fail due to "window is not defined" if persist is used without storage shim.
// We'll see.
console.log('Testing addXP...');

try {
    const store = useGameStore.getState();
    console.log('Initial XP:', store.currentXP);
    console.log('Initial Level:', store.level);

    store.addXP(1);

    const updatedStore = useGameStore.getState();
    console.log('Updated XP:', updatedStore.currentXP);
    console.log('Updated Level:', updatedStore.level);

    if (updatedStore.currentXP === (store.currentXP + 1) % 10) {
        console.log('SUCCESS: XP added correctly.');
    } else {
        console.log('FAILURE: XP not added correctly.');
    }
} catch (e) {
    console.error('Error running test:', e);
}
