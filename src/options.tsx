import cssText from "data-text:~/styles.css"
import { useEffect, useState } from "react"

import {
  clearAskLlmHistory,
  getAskLlmHistory,
  type AskLlmHistoryItem
} from "./history"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function OptionsPage() {
  const [apiKey, setApiKey] = useState("")
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState("")
  const [history, setHistory] = useState<AskLlmHistoryItem[]>([])

  const refreshHistory = async () => {
    setHistory(await getAskLlmHistory())
  }

  useEffect(() => {
    chrome.storage.local.get("askLlmApiKey").then((result) => {
      const savedApiKey =
        typeof result.askLlmApiKey === "string" ? result.askLlmApiKey : ""

      setApiKey(savedApiKey)
      setApiKeySaved(savedApiKey.trim().length > 0)
    })

    refreshHistory()
  }, [])

  const handleSaveApiKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextApiKey = apiKey.trim()

    if (!nextApiKey) {
      setApiKey("")
      setApiKeySaved(false)
      setApiKeyStatus("API key required.")
      await chrome.storage.local.set({ askLlmEnabled: false })
      await chrome.storage.local.remove("askLlmApiKey")
      return
    }

    await chrome.storage.local.set({ askLlmApiKey: nextApiKey })
    setApiKey(nextApiKey)
    setApiKeySaved(true)
    setApiKeyStatus("API key saved.")
  }

  const handleClearApiKey = async () => {
    await chrome.storage.local.remove("askLlmApiKey")
    await chrome.storage.local.set({ askLlmEnabled: false })
    setApiKey("")
    setApiKeySaved(false)
    setApiKeyStatus("API key cleared. Ask LLM was disabled.")
  }

  const handleClearHistory = async () => {
    await clearAskLlmHistory()
    setHistory([])
  }

  return (
    <main className="ask-llm-options">
      <div className="ask-llm-options-container">
        <header className="ask-llm-options-header">
          <div>
            <h1 className="ask-llm-options-title">Settings</h1>
            <p className="ask-llm-options-description">
              Configure your API key and review saved asks.
            </p>
          </div>
        </header>

        <section className="ask-llm-settings-card">
          <form onSubmit={handleSaveApiKey} className="ask-llm-form">
            <div>
              <h2 className="ask-llm-section-title">OpenAI API Key</h2>
              <div className="ask-llm-muted">
                {apiKeySaved
                  ? "Saved locally in this browser."
                  : "Required before enabling Ask LLM."}
              </div>
            </div>

            <input
              type="password"
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value)
                setApiKeyStatus("")
              }}
              placeholder="sk-..."
              autoComplete="off"
              spellCheck={false}
              className="ask-llm-input"
              aria-label="OpenAI API key"
            />

            <div className="ask-llm-form-footer">
              <span
                className={`ask-llm-status${
                  apiKeyStatus.includes("required") ? " is-error" : ""
                }`}>
                {apiKeyStatus}
              </span>

              <div className="ask-llm-actions">
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  disabled={!apiKey && !apiKeySaved}
                  className="ask-llm-secondary-button">
                  Clear
                </button>
                <button type="submit" className="ask-llm-primary-button">
                  Save
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="ask-llm-history-card">
          <div className="ask-llm-card-header">
            <div>
              <h2 className="ask-llm-section-title">History</h2>
              <div className="ask-llm-muted">
                Last {history.length} saved asks
              </div>
            </div>

            <div className="ask-llm-actions">
              <button
                type="button"
                onClick={refreshHistory}
                className="ask-llm-secondary-button"
                title="Refresh history"
                aria-label="Refresh history">
                Refresh
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={history.length === 0}
                className="ask-llm-secondary-button"
                title="Clear history"
                aria-label="Clear history">
                Clear
              </button>
            </div>
          </div>

          <div className="ask-llm-history-list">
            {history.length === 0 ? (
              <div className="ask-llm-empty-history">
                Ask about selected text and it will appear here.
              </div>
            ) : (
              history.map((item) => <HistoryItem key={item.id} item={item} />)
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function HistoryItem({ item }: { item: AskLlmHistoryItem }) {
  const answer = item.error || item.answer || "No answer saved."
  const host = getHostname(item.pageUrl)

  return (
    <article className="ask-llm-history-item">
      <div className="ask-llm-history-meta">
        <span className="ask-llm-history-source" title={item.pageTitle || host}>
          {item.pageTitle || host || "Saved ask"}
        </span>
        <time className="ask-llm-history-date">
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric"
          })}
        </time>
      </div>

      <div className="ask-llm-history-text">{item.text}</div>

      <div className={`ask-llm-history-answer${item.error ? " is-error" : ""}`}>
        {answer}
      </div>
    </article>
  )
}

function getHostname(url?: string) {
  if (!url) {
    return ""
  }

  try {
    return new URL(url).hostname
  } catch {
    return ""
  }
}

export default OptionsPage
