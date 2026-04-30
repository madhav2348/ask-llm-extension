// import { useState } from "react"
// import cssText from "data-text:~/contents/styles.css"
// export const getStyle = () => {
//   const style = document.createElement("style")
//   style.textContent = cssText
//   return style
// }

// function IndexPopup() {
//   const [data, setData] = useState("")

//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "row",
//         alignItems: "center",
//         justifyContent: "center",
//         width: 100,
//         padding: 16,
//         background: "grey"
//       }}>
//       <p>Enable "Ask LLm"
// </p>

//       <label
//         className="toggle-switch square"
//         style={{
//           position: "relative",
//           display: "inline-block",
//           width: "60px",

//           height: "30px"
//         }}>
//         <input
//           type="checkbox"
//           style={{
//             opacity: 0,
//             width: 0,
//             height: 0
//           }}
//         />
//         <span className="slider"></span>
//       </label>
//     </div>
//   )
// }

// export default IndexPopup
import cssText from "data-text:~/styles.css"
import { useEffect, useState } from "react"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function IndexPopup() {
  const [enabled, setEnabledState] = useState(true)

  useEffect(() => {
    chrome.storage.local.get("askLlmEnabled").then((result) => {
      setEnabledState(result.askLlmEnabled !== false)
    })
  }, [])

  const setEnabled = async (value: boolean) => {
    setEnabledState(value)
    await chrome.storage.local.set({ askLlmEnabled: value })
  }

  return (
    <>
      <div style={{ padding: 0, margin: 0, minWidth: 300 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            gap: "48px"
          }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              Enable "Ask LLM"
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
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
            <span style={{ fontSize: 12, color: "#888", width: 20 }}>
              {enabled ? "On" : "Off"}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default IndexPopup
