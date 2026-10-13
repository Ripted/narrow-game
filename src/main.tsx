import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root')!;
// Drop the pre-boot placeholder so React owns the container outright.
document.getElementById('boot')?.remove();

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
