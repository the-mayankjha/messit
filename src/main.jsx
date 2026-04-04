import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register';
import { Auth0Provider } from '@auth0/auth0-react';

// Register PWA Service Worker
if (import.meta.env.PROD) {
  window.__messitUpdateAvailable = false;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.__messitUpdateAvailable = true;
      window.dispatchEvent(new CustomEvent('messit-update-available'));
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('messit-offline-ready'));
    }
  });
  window.__messitUpdateSW = updateSW;
} else {
  window.__messitUpdateSW = null;
  window.__messitUpdateAvailable = false;
}

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
)
