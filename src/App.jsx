import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import ImagePreloader from './components/ui/ImagePreloader';
import { UpdateProvider } from './components/UpdatePrompt';
import { SocketProvider } from './components/SocketProvider';
import { VersionCheck } from './components/VersionCheck';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IntroScreen } from './components/IntroScreen';

import { Toaster } from 'react-hot-toast';
import ReloadPrompt from './components/ReloadPrompt';

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
            <Toaster
              position="bottom-center"
              toastOptions={{
                className: '!bg-slate-900/95 !backdrop-blur-xl !border !border-white/10 !text-white !rounded-2xl !shadow-2xl',
                style: {
                  background: 'rgba(15, 23, 42, 0.95)',
                  color: '#fff',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '16px 24px', // Bigger padding
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  fontSize: '16px', // Bigger font
                  fontWeight: '700',
                  letterSpacing: '0.025em',
                  maxWidth: '500px', // Wider
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: 'white',
                  },
                  style: {
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    background: 'rgba(6, 78, 59, 0.9)', // Slight tint for success
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: 'white',
                  },
                  style: {
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(127, 29, 29, 0.9)', // Slight tint for error
                  }
                },
              }}
            />
            <ReloadPrompt />
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
