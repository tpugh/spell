import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { configureStorage } from './storage/configure'
import './index.css'

// IndexedDB on the web, chrome.storage.local inside the extension.
configureStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
