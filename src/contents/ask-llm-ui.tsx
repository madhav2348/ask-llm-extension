import cssText from "data-text:~/styles.css"

import { useStorage } from "@plasmohq/storage/hook"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function AskLlmUi() {
  const [enabled, setEnabled] = useStorage(false)

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
            <div
             onClick={() => setEnabled(!enabled)}
            
            style={{ 
                
                fontSize: 14, 
                fontWeight: 500, 
                cursor: "pointer",
                }}>Ask LLM</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AskLlmUi
