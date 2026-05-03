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

function IndexPopup() {
  const [enabled, setEnabledState] = useState(true)
  const [apiKey, setApiKey] = useState("")
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState("")
  const [history, setHistory] = useState<AskLlmHistoryItem[]>([])

  const refreshHistory = async () => {
    setHistory(await getAskLlmHistory())
  }

  useEffect(() => {
    chrome.storage.local.get("askLlmEnabled").then((result) => {
      setEnabledState(result.askLlmEnabled !== false)
    })

    chrome.storage.local.get("askLlmApiKey").then((result) => {
      const savedApiKey =
        typeof result.askLlmApiKey === "string" ? result.askLlmApiKey : ""

      setApiKey(savedApiKey)
      setApiKeySaved(savedApiKey.length > 0)
    })

    refreshHistory()
  }, [])

  const setEnabled = async (value: boolean) => {
    setEnabledState(value)
    await chrome.storage.local.set({ askLlmEnabled: value })
  }

  const handleClearHistory = async () => {
    await clearAskLlmHistory()
    setHistory([])
  }

  const handleSaveApiKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextApiKey = apiKey.trim()

    if (!nextApiKey) {
      await chrome.storage.local.remove("askLlmApiKey")
      setApiKey("")
      setApiKeySaved(false)
      setApiKeyStatus("API key cleared.")
      return
    }

    await chrome.storage.local.set({ askLlmApiKey: nextApiKey })
    setApiKey(nextApiKey)
    setApiKeySaved(true)
    setApiKeyStatus("API key saved.")
  }

  const handleClearApiKey = async () => {
    await chrome.storage.local.remove("askLlmApiKey")
    setApiKey("")
    setApiKeySaved(false)
    setApiKeyStatus("API key cleared.")
  }

  return (
    <div
      style={{
        background: "#f8fafc",
        color: "#111827",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        margin: 0,
        minWidth: 340,
        padding: 12
      }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
            gap: 24
          }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              Enable "Ask LLM"
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Query an AI model inline
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              onClick={() => setEnabled(!enabled)}
              style={{
                position: "relative",
                width: 40,
                height: 22,
                borderRadius: 99,
                backgroundColor: enabled ? "#3b82f6" : "#ccc",
                cursor: "pointer",
                transition: "background 0.2s",
                flexShrink: 0
              }}>
              <div
                style={{
                  position: "absolute",
                  width: 16,
                  height: 16,
                  top: 3,
                  left: 3,
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  transform: enabled ? "translateX(18px)" : "translateX(0)",
                  transition: "transform 0.2s"
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#64748b", width: 20 }}>
              {enabled ? "On" : "Off"}
            </span>
          </div>
        </div>

        <section
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
            padding: "12px 14px"
          }}>
          <form onSubmit={handleSaveApiKey} style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                OpenAI API Key
              </div>
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                {apiKeySaved
                  ? "Saved locally in this browser."
                  : "Required before asking the LLM."}
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
              style={{
                background: "#f8fafc",
                border: "1px solid #dbe3ee",
                borderRadius: 6,
                color: "#111827",
                fontSize: 13,
                outline: "none",
                padding: "9px 10px",
                width: "100%"
              }}
              aria-label="OpenAI API key"
            />

            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 8,
                justifyContent: "space-between"
              }}>
              <span style={{ color: "#64748b", fontSize: 12, minHeight: 16 }}>
                {apiKeyStatus}
              </span>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  disabled={!apiKey && !apiKeySaved}
                  style={{
                    ...secondaryButtonStyle,
                    cursor:
                      !apiKey && !apiKeySaved ? "not-allowed" : "pointer",
                    opacity: !apiKey && !apiKeySaved ? 0.45 : 1
                  }}>
                  Clear
                </button>
                <button type="submit" style={primaryButtonStyle}>
                  Save
                </button>
              </div>
            </div>
          </form>
        </section>

        <section
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
            overflow: "hidden"
          }}>
          <div
            style={{
              alignItems: "center",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px"
            }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>History</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>
                Last {history.length} saved asks
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={refreshHistory}
                style={iconButtonStyle}
                title="Refresh history"
                aria-label="Refresh history">
                R
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={history.length === 0}
                style={{
                  ...iconButtonStyle,
                  cursor: history.length === 0 ? "not-allowed" : "pointer",
                  opacity: history.length === 0 ? 0.45 : 1
                }}
                title="Clear history"
                aria-label="Clear history">
                X
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {history.length === 0 ? (
              <div
                style={{
                  color: "#64748b",
                  fontSize: 13,
                  padding: 16,
                  textAlign: "center"
                }}>
                Ask about selected text and it will appear here.
              </div>
            ) : (
              history.map((item) => <HistoryItem key={item.id} item={item} />)
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

const iconButtonStyle = {
  alignItems: "center",
  background: "#f8fafc",
  border: "1px solid #dbe3ee",
  borderRadius: 6,
  color: "#334155",
  cursor: "pointer",
  display: "inline-flex",
  fontSize: 16,
  fontWeight: 700,
  height: 30,
  justifyContent: "center",
  lineHeight: 1,
  padding: 0,
  width: 30
} as const

const primaryButtonStyle = {
  background: "#2563eb",
  border: "1px solid #2563eb",
  borderRadius: 6,
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  height: 30,
  padding: "0 12px"
} as const

const secondaryButtonStyle = {
  background: "#f8fafc",
  border: "1px solid #dbe3ee",
  borderRadius: 6,
  color: "#334155",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  height: 30,
  padding: "0 12px"
} as const

function HistoryItem({ item }: { item: AskLlmHistoryItem }) {
  const answer = item.error || item.answer || "No answer saved."
  const host = getHostname(item.pageUrl)

  return (
    <article
      style={{
        borderBottom: "1px solid #edf2f7",
        display: "grid",
        gap: 7,
        padding: "11px 12px"
      }}>
      <div
        style={{
          alignItems: "center",
          color: "#64748b",
          display: "flex",
          fontSize: 11,
          gap: 8,
          justifyContent: "space-between"
        }}>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
          title={item.pageTitle || host}>
          {item.pageTitle || host || "Saved ask"}
        </span>
        <time style={{ flexShrink: 0 }}>
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short"
          })}
        </time>
      </div>

      <div style={{ color: "#111827", fontSize: 13, lineHeight: 1.35 }}>
        {truncate(item.text, 120)}
      </div>

      <div
        style={{
          color: item.error ? "#991b1b" : "#475569",
          fontSize: 12,
          lineHeight: 1.4
        }}>
        {truncate(answer, 180)}
      </div>
    </article>
  )
}

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit).trim()}...` : value
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

export default IndexPopup
