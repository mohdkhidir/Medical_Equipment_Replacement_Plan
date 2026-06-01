import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa-install-dismissed') === '1');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed PWA — don't show banner
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  }

  function dismiss() {
    localStorage.setItem('pwa-install-dismissed', '1');
    setDismissed(true);
  }

  if (installed || dismissed || !prompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex gap-3 items-start border border-slate-700">
        <div className="shrink-0 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Smartphone size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Install App</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Add to your home screen for a full-screen app experience — works offline too.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={install}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={13} />
              Install
            </button>
            <button
              onClick={dismiss}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
