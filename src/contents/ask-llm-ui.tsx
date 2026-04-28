import cssText from "data-text:~/styles.css"

import { sendToBackground } from "@plasmohq/messaging"

import { useEffect, useRef, useState } from "~node_modules/@types/react"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function AskLlmUi() {
  const [select, setSelect] = useState("")
  const lastTextRef = useRef("")
  const timeoutRef = useRef(null)

  const handleSelection = () => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const selection = window.getSelection()
      const text = selection ? selection.toString().trim() : ""
      if (text && text !== lastTextRef.current) {
        lastTextRef.current = text
        setSelect(text)
      }
    }, 200)
  }
  const handleClick = async () => {
    if (select) {
      await sendToBackground({
        name: "ask-llm",
        body: select
      })
    }
  }

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelection)
    return () => {
      document.removeEventListener("selectionchange", handleSelection)
    }
  }, [])

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
              onClick={handleClick}
              style={{
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer"
              }}>
              Ask LLM
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AskLlmUi
