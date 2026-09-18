import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { EnvironmentProvider } from './context/EnvironmentContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <EnvironmentProvider>
        <App />
      </EnvironmentProvider>
    </ThemeProvider>
  </StrictMode>,
);

