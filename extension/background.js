// Spell Chrome extension background service worker (Manifest V3).
// Clicking the toolbar icon opens the app in a tab, reusing the existing tab
// when it is still open. No host permissions and no remote code.

const SPELL_PAGE = 'extension.html'
const TAB_KEY = 'spell:tabId'

chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL(SPELL_PAGE)

  try {
    const stored = await chrome.storage.session.get(TAB_KEY)
    const tabId = stored[TAB_KEY]

    if (typeof tabId === 'number') {
      const tab = await chrome.tabs.get(tabId)
      if (tab && tab.url === url) {
        await chrome.tabs.update(tabId, { active: true })
        await chrome.windows.update(tab.windowId, { focused: true })
        return
      }
    }
  } catch {
    // The tab was closed or cannot be inspected - open a new one below.
  }

  const tab = await chrome.tabs.create({ url })

  if (tab.id !== undefined) {
    await chrome.storage.session.set({ [TAB_KEY]: tab.id })
  }
})
