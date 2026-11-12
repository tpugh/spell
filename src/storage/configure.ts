import { setStorageAdapter } from '../db'
import { createChromeStorageAdapter, getChromeStorage } from './chromeStorage'

/**
 * Called once at startup. Inside the Chrome extension the page has access to
 * chrome.storage.local, so we swap the default IndexedDB adapter for it.
 * On the web nothing changes.
 */
export function configureStorage(): void {
  const area = getChromeStorage()
  if (area) setStorageAdapter(createChromeStorageAdapter(area))
}
