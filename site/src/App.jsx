import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Portal from './pages/Portal';

// Rota simples por hash: "/" = landing pública, "#portal" = área do cliente.
export default function App() {
  const [view, setView] = useState(window.location.hash === '#portal' ? 'portal' : 'home');

  useEffect(() => {
    const onHash = () => setView(window.location.hash === '#portal' ? 'portal' : 'home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const irPortal = () => { window.location.hash = 'portal'; window.scrollTo(0, 0); };
  const irHome = () => { window.location.hash = ''; window.scrollTo(0, 0); };

  return view === 'portal' ? <Portal onBack={irHome} /> : <Landing onPortal={irPortal} />;
}
