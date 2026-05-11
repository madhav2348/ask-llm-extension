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
  const [history, setHistory] = useState<AskLlmHistoryItem[]>([])

  const refreshHistory = async () => {
    setHistory(await getAskLlmHistory())
  }

  useEffect(() => {
    refreshHistory()
  }, [])

  const handleClearHistory = async () => {
    await clearAskLlmHistory()
    setHistory([])
  }

  return (
    <main
      style={{
        background: "#303030",
        color: "#f5f5f5",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        minHeight: "100vh"
      }}>
      <div
        style={{
          margin: "0 auto",
          maxWidth: 960,
          padding: "28px 18px 40px"
        }}>
        <header
          style={{
            alignItems: "center",
            display: "flex",
            gap: 12,
            justifyContent: "space-between",
            marginBottom: 18
          }}>
          <div>
            <h1
              style={{
                fontSize: 24,
                lineHeight: 1.2,
                margin: 0
              }}>
              Settings
            </h1>
            <p
              style={{
                color: "#c7c7c7",
                fontSize: 13,
                margin: "5px 0 0"
              }}>
              History is available here. More settings can be added later.
            </p>
          </div>
        </header>

        <section
          style={{
            backgroundColor: "#242424",
            border: "1px solid #4b4b4b",
            borderRadius: 8,
            overflow: "hidden"
          }}>
          <div
            style={{
              alignItems: "center",
              borderBottom: "1px solid #4b4b4b",
              display: "flex",
              gap: 12,
              justifyContent: "space-between",
              padding: "14px 16px"
            }}>
            <div>
              <h2
                style={{
                  fontSize: 16,
                  lineHeight: 1.2,
                  margin: 0
                }}>
                History
              </h2>
              <div style={{ color: "#c7c7c7", fontSize: 12, marginTop: 3 }}>
                Last {history.length} saved asks
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={refreshHistory}
                style={secondaryButtonStyle}
                title="Refresh history"
                aria-label="Refresh history">
                Refresh
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={history.length === 0}
                style={{
                  ...secondaryButtonStyle,
                  cursor: history.length === 0 ? "not-allowed" : "pointer",
                  opacity: history.length === 0 ? 0.45 : 1
                }}
                title="Clear history"
                aria-label="Clear history">
                Clear
              </button>
            </div>
          </div>

          <div
            style={{
              maxHeight: "calc(100vh - 190px)",
              minHeight: 260,
              overflowY: "auto"
            }}>
            {history.length === 0 ? (
              <div
                style={{
                  color: "#c7c7c7",
                  fontSize: 14,
                  padding: 28,
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
    </main>
  )
}

const secondaryButtonStyle = {
  background: "#3b3b3b",
  border: "1px solid #5f5f5f",
  borderRadius: 6,
  color: "#f5f5f5",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  height: 32,
  padding: "0 12px"
} as const

function HistoryItem({ item }: { item: AskLlmHistoryItem }) {
  const answer = item.error || item.answer || "No answer saved."
  const host = getHostname(item.pageUrl)

  return (
    <article
      style={{
        borderBottom: "1px solid #4b4b4b",
        display: "grid",
        gap: 9,
        padding: "14px 16px"
      }}>
      <div
        style={{
          alignItems: "center",
          color: "#c7c7c7",
          display: "flex",
          fontSize: 12,
          gap: 10,
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
            month: "short",
            year: "numeric"
          })}
        </time>
      </div>

      <div
        style={{
          color: "#f5f5f5",
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.4
        }}>
        {item.text}
      </div>

      <div
        style={{
          color: item.error ? "#fecaca" : "#d7d7d7",
          fontSize: 13,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap"
        }}>
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
