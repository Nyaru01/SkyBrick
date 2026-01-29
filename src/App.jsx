import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import ImagePreloader from './components/ui/ImagePreloader';
import { UpdateProvider } from './components/UpdatePrompt';
import { SocketProvider } from './components/SocketProvider';
import { VersionCheck } from './components/VersionCheck';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IntroScreen } from './components/IntroScreen';

function App() {
  const [showIntro, setShowIntro] = useState(true);

  // Always force dark mode on mount
  // This ensures dark theme works even if localStorage has stale darkMode: false
  useEffect(() => {
    // Always add 'dark' class - this app is dark-mode only
    document.documentElement.classList.add('dark');
    console.log('🚀 [APP] App MOUNTED');
    return () => console.log('💀 [APP] App UNMOUNTED');
  }, []);

  console.log('🔄 [APP] Rendering App...');

  return (
    <ErrorBoundary>
      {showIntro && <IntroScreen onComplete={() => setShowIntro(false)} />}
      <div>
        <UpdateProvider>
          <SocketProvider>
            <VersionCheck />
            <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-100 dark:selection:bg-emerald-900">
              <ImagePreloader>
                <Dashboard />
              </ImagePreloader>
            </div>
          </SocketProvider>
        </UpdateProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;
