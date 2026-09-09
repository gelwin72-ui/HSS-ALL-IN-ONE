import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { StorageService } from './utils/storage.ts';
import './index.css';

// Ensure storage defaults are seeded if first time
try {
  StorageService.init();
} catch (e) {
  console.warn('StorageService init warning:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

