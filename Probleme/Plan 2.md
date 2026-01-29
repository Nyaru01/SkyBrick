 Implementation Checklist
Phase 1: Dashboard.jsx Modifications
Changes Required:

 Import useOnlineGameStore at the top
 Add state checks:

javascript  const onlineStarted = useOnlineGameStore(state => state.onlineStarted);
  const activeState = useOnlineGameStore(state => state.activeState);
  const leaveRoom = useOnlineGameStore(state => state.leaveRoom);

 Create derived states:

javascript  const isGameInProgress = onlineStarted && activeState?.started === true;
  const isInLobby = activeState?.roomId && !activeState?.started;
  const isInOnlineSession = isGameInProgress || isInLobby;

 Implement effectiveTab logic:

javascript  const effectiveTab = isInOnlineSession ? 'virtual' : activeTab;

 Update renderContent() to use effectiveTab instead of activeTab
 Conditionally render BottomNav:

javascript  {!isInOnlineSession && <BottomNav ... />}

 Add "Quitter" button when isGameInProgress === true
 Add handleQuitGame function
 Test: Verify Dashboard stays mounted during game


Phase 2: VirtualGame.jsx Refinements
Changes Required:

 Review auto-navigation useEffect
 Add explicit check for activeState?.started === true
 Add game-end detection:

javascript  if (!onlineStarted && screen === 'game') {
    setScreen('lobby');
  }

 Ensure onBackToMenu calls leaveRoom() from store
 Add comprehensive logging for state transitions
 Test: Verify smooth transition from lobby → game → lobby


Phase 3: onlineGameStore.js Verification
Ensure the following methods exist and work correctly:

 leaveRoom() - Cleans up room state and emits socket event
 State updates on 'gameStarted' event set started: true
 State updates on 'gameEnded' event reset properly
 onlineStarted flag is set/unset correctly

Example leaveRoom implementation:
javascriptleaveRoom: () => {
  const { socket, activeState } = get();
  
  if (socket && activeState?.roomId) {
    socket.emit('leaveRoom', { roomId: activeState.roomId });
  }
  
  set({
    activeState: null,
    onlineStarted: false,
    // Reset other game states
  });
},

🧪 Testing Plan
Test 1: Normal Flow (2 players)
Steps:

Player 1: Open app → Dashboard → Click "Jouer en ligne"
Player 1: Click "Créer une partie"
Player 2: Join via room code
Player 1: Click "Lancer la partie"

Expected Results:

✅ Dashboard stays mounted (check logs: NO "Dashboard UNMOUNTED")
✅ VirtualGame transitions from lobby to game screen
✅ BottomNav disappears
✅ "Quitter" button appears
✅ Game loads correctly without blank screen
✅ Both players see the game board

Logs to verify:
[VG] Auto-nav check: onlineStarted=true, hasActiveState=true, gameIsStarted=true, currentScreen=lobby
[VG] ✅ Transitioning to game screen!
[VG] Rendering... screen=game, initialScreen=lobby
[VG] Render: screen=game, isOnline=true, myIdx=0
// NO "[DASH] Dashboard UNMOUNTED" here!

Test 2: Page Refresh During Game
Steps:

Start a game (as in Test 1)
Player refreshes page (F5)

Expected Results:

✅ Socket reconnects
✅ Game state is restored from activeState
✅ Dashboard force-shows 'virtual' tab
✅ VirtualGame auto-navigates to 'game' screen
✅ Player can continue playing

Logs to verify:
[SOCKET] Global Connected: <new-socket-id>
[VG] Auto-nav check: onlineStarted=true, hasActiveState=true, gameIsStarted=true
[VG] ✅ Transitioning to game screen!

Test 3: Quit Game
Steps:

Start a game
Click "Quitter" button
Confirm quit

Expected Results:

✅ Confirmation dialog appears
✅ leaveRoom() is called
✅ Dashboard returns to 'home' tab
✅ BottomNav reappears
✅ Socket emits 'leaveRoom' event

Logs to verify:
[VG] 🔙 User requested back to menu
[Socket] Leaving room: <roomId>
[VG] ⬅️ Game ended, returning to lobby
[DASH] ActiveTab set to: home

Test 4: Game End (Natural)
Steps:

Play game to completion
Server emits 'gameEnded'

Expected Results:

✅ Game shows results screen
✅ After results, return to lobby
✅ Can start new game or leave


Test 5: Connection Loss
Steps:

Start game
Disconnect internet
Reconnect after 5 seconds

Expected Results:

✅ Socket reconnects automatically
✅ Game state is restored
✅ No blank screen


🐛 Debug Logs to Add
Add these temporary logs for debugging:
javascript// Dashboard.jsx
useEffect(() => {
  console.log('🔍 [DASH] State update:', {
    activeTab,
    effectiveTab,
    isGameInProgress,
    isInLobby,
    isInOnlineSession,
    onlineStarted,
    activeStateExists: !!activeState,
    activeStateStarted: activeState?.started,
    roomId: activeState?.roomId
  });
}, [activeTab, effectiveTab, isGameInProgress, isInLobby, isInOnlineSession, onlineStarted, activeState]);

// VirtualGame.jsx
useEffect(() => {
  console.log('🔍 [VG] Screen transition check:', {
    currentScreen: screen,
    shouldBeGame: onlineStarted && activeState?.started,
    shouldBeLobby: !onlineStarted || !activeState?.started,
    activeState: activeState ? 'present' : 'null',
    started: activeState?.started
  });
}, [screen, onlineStarted, activeState]);

⚠️ Common Pitfalls to Avoid

Don't use navigate() anywhere in game start flow

Use state changes only


Don't call setActiveTab() when game starts

Let effectiveTab handle it


Don't forget to clean up socket listeners

Always return cleanup functions in useEffect


Don't assume socket.id stays the same

Always use dbId as fallback


Don't let Dashboard unmount during game

This is the whole point of the fix!




🎯 Success Criteria
The implementation is successful when:

✅ No "Dashboard UNMOUNTED" log appears during game start
✅ No "VirtualGame UNMOUNTED" log appears during game start
✅ No blank screen after clicking "Lancer la partie"
✅ Both players can see and play the game
✅ Page refresh maintains game state
✅ Quit button works correctly
✅ Navigation is locked during game