export type AskLlmHistoryItem = {
  id: string
  answer?: string
  createdAt: number
  error?: string
  pageTitle?: string
  pageUrl?: string
  text: string
}

export const ASK_LLM_HISTORY_KEY = "askLlmHistory"
export const ASK_LLM_HISTORY_LIMIT = 20

export async function getAskLlmHistory() {
  const result = await chrome.storage.local.get(ASK_LLM_HISTORY_KEY)
  const history = result[ASK_LLM_HISTORY_KEY]

  return Array.isArray(history) ? (history as AskLlmHistoryItem[]) : []
}

export async function addAskLlmHistoryItem(
  item: Omit<AskLlmHistoryItem, "id" | "createdAt">
) {
  const history = await getAskLlmHistory()
  const nextHistory: AskLlmHistoryItem[] = [
    {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    },
    ...history
  ].slice(0, ASK_LLM_HISTORY_LIMIT)

  await chrome.storage.local.set({ [ASK_LLM_HISTORY_KEY]: nextHistory })

  return nextHistory
}

export async function clearAskLlmHistory() {
  await chrome.storage.local.set({ [ASK_LLM_HISTORY_KEY]: [] })
}
