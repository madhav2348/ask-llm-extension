import cssText from "data-text:~/styles.css"
import { useEffect, useState } from "react"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const OFFICIAL_WEBSITE_URL = "https://ask-llm-extension.vercel.app"

function IndexPopup() {
  const [enabled, setEnabledState] = useState(true)
  const [apiKey, setApiKey] = useState("")
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState("")

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
  }, [])

  const setEnabled = async (value: boolean) => {
    setEnabledState(value)
    await chrome.storage.local.set({ askLlmEnabled: value })
  }

  const openWebsite = () => {
    chrome.tabs.create({ url: OFFICIAL_WEBSITE_URL })
  }

  const openSettings = () => {
    chrome.runtime.openOptionsPage()
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
        background: "#3b3b3b",
        color: "#f5f5f5",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        margin: 0,
        minWidth: 340,
        padding: 12,
        border: 0
      }}>
      <div style={{ display: "grid", gap: 12 }}>
        <header
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
            justifyContent: "space-between"
          }}>
          <button
            type="button"
            onClick={openWebsite}
            style={logoButtonStyle}
            title="Open Ask LLM website"
            aria-label="Open Ask LLM website">
            <img
              src={chrome.runtime.getURL("assets/icon.png")}
              alt=""
              style={{
                height: 28,
                width: 28
              }}
            />
            <span style={{ fontSize: 16, fontWeight: 800 }}>Ask LLM</span>
          </button>

          <button
            type="button"
            onClick={openSettings}
            style={headerIconButtonStyle}
            title="Settings"
            aria-label="Settings">
            <SettingsIcon />
          </button>
        </header>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            backgroundColor: "#242424",
            border: "1px solid #4b4b4b",
            borderRadius: 8,
            gap: 24
          }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              Enable "Ask LLM"
            </div>
            {/*<div style={{ fontSize: 12, color: "#c7c7c7", marginTop: 2 }}>
              Query an AI model inline
            </div>*/}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              aria-checked={enabled}
              aria-label="Enable Ask LLM"
              role="switch"
              style={{
                position: "relative",
                width: 40,
                height: 22,
                borderRadius: 99,
                backgroundColor: enabled ? "#f5f5f5" : "#666666",
                cursor: "pointer",
                transition: "background 0.2s",
                flexShrink: 0,
                border: 0,
                padding: 0
              }}>
              <div
                style={{
                  position: "absolute",
                  width: 16,
                  height: 16,
                  top: 3,
                  left: 3,
                  borderRadius: "50%",
                  backgroundColor: enabled ? "#3b3b3b" : "#f5f5f5",
                  transform: enabled ? "translateX(18px)" : "translateX(0)",
                  transition: "transform 0.2s"
                }}
              />
            </button>
            <span style={{ fontSize: 12, color: "#c7c7c7", width: 20 }}>
              {enabled ? "On" : "Off"}
            </span>
          </div>
        </div>

        <section
          style={{
            backgroundColor: "#242424",
            border: "1px solid #4b4b4b",
            borderRadius: 8,
            padding: "12px 14px"
          }}>
          <form
            onSubmit={handleSaveApiKey}
            style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                OpenAI API Key
              </div>
              <div style={{ color: "#c7c7c7", fontSize: 12, marginTop: 2 }}>
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
                background: "#3b3b3b",
                border: "1px solid #5f5f5f",
                borderRadius: 6,
                color: "#f5f5f5",
                fontSize: 13,
                outline: "none",
                padding: "9px 10px",
                width: "93%"
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
              <span style={{ color: "#c7c7c7", fontSize: 12, minHeight: 16 }}>
                {apiKeyStatus}
              </span>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  disabled={!apiKey && !apiKeySaved}
                  style={{
                    ...secondaryButtonStyle,
                    cursor: !apiKey && !apiKeySaved ? "not-allowed" : "pointer",
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
      </div>
    </div>
  )
}

const logoButtonStyle = {
  alignItems: "center",
  background: "transparent",
  border: 0,
  color: "#f5f5f5",
  cursor: "pointer",
  display: "inline-flex",
  gap: 8,
  lineHeight: 1,
  padding: 0
} as const

const headerIconButtonStyle = {
  alignItems: "center",
  background: "#3b3b3b",
  border: "1px solid #5f5f5f",
  borderRadius: 6,
  color: "#f5f5f5",
  cursor: "pointer",
  display: "inline-flex",
  fontSize: 11,
  fontWeight: 700,
  height: 30,
  justifyContent: "center",
  lineHeight: 1,
  minWidth: 30,
  padding: "0 8px"
} as const

const primaryButtonStyle = {
  background: "#f5f5f5",
  border: "1px solid #f5f5f5",
  borderRadius: 6,
  color: "#3b3b3b",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  height: 30,
  padding: "0 12px"
} as const

const secondaryButtonStyle = {
  background: "#3b3b3b",
  border: "1px solid #5f5f5f",
  borderRadius: 6,
  color: "#f5f5f5",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  height: 30,
  padding: "0 12px"
} as const

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default IndexPopup
