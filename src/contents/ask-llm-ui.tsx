import cssText from "data-text:~/styles.css"
import { useCallback, useEffect, useRef, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import { addAskLlmHistoryItem } from "~history"

type AskLlmResponse = {
  answer?: string
  error?: string
}

type BubbleState = {
  answer: string
  error: string
  isLoading: boolean
  selectedText: string
  visible: boolean
  x: number
  y: number
}

const initialBubbleState: BubbleState = {
  answer: "",
  error: "",
  isLoading: false,
  selectedText: "",
  visible: false,
  x: 0,
  y: 0
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

async function getAskLlmEnabled() {
  const result = await chrome.storage.local.get("askLlmEnabled")
  return result.askLlmEnabled !== false
}

function getSelectionRect(selection: Selection) {
  if (selection.rangeCount === 0) {
    return null
  }

  const range = selection.getRangeAt(0).cloneRange()
  const rect = range.getBoundingClientRect()

  if (rect.width > 0 || rect.height > 0) {
    return rect
  }

  return range.getClientRects()[0] ?? null
}

function isSelectionInsideBubble(
  selection: Selection,
  bubbleElement: HTMLDivElement | null
) {
  const anchorNode = selection.anchorNode
  return Boolean(anchorNode && bubbleElement?.contains(anchorNode))
}

function getBubbleCoordinates(rect: DOMRect, bubbleWidth: number) {
  const x = Math.min(
    Math.max(rect.left, 12),
    window.innerWidth - bubbleWidth - 12
  )
  const belowY = rect.bottom + 8
  const aboveY = rect.top - 48
  const y =
    belowY > window.innerHeight - 48 && aboveY >= 12
      ? aboveY
      : Math.max(belowY, 12)

  return { x, y }
}

function AskLlmUi() {
  const [bubble, setBubble] = useState<BubbleState>(initialBubbleState)
  const lastTextRef = useRef("")
  const timeoutRef = useRef<number>()
  const bubbleRef = useRef<HTMLDivElement>(null)

  const hideBubble = useCallback(() => {
    lastTextRef.current = ""
    setBubble(initialBubbleState)
  }, [])

  const handleSelection = useCallback(() => {
    window.clearTimeout(timeoutRef.current)

    timeoutRef.current = window.setTimeout(async () => {
      const isEnabled = await getAskLlmEnabled()

      if (isEnabled === false) {
        hideBubble()
        return
      }

      const selection = window.getSelection()
      const selectedText = selection?.toString().trim() ?? ""

      if (
        !selection ||
        !selectedText ||
        isSelectionInsideBubble(selection, bubbleRef.current)
      ) {
        hideBubble()
        return
      }

      if (selectedText === lastTextRef.current && bubble.visible) {
        return
      }

      const rect = getSelectionRect(selection)

      if (!rect) {
        hideBubble()
        return
      }

      const bubbleWidth = Math.min(340, window.innerWidth - 24)
      const { x, y } = getBubbleCoordinates(rect, bubbleWidth)

      lastTextRef.current = selectedText
      setBubble({
        answer: "",
        error: "",
        isLoading: false,
        selectedText,
        visible: true,
        x,
        y
      })
    }, 120)
  }, [bubble.visible, hideBubble])

  const handleAskLlm = async () => {
    if (!bubble.selectedText || bubble.isLoading) {
      return
    }

    setBubble((current) => ({
      ...current,
      answer: "",
      error: "",
      isLoading: true
    }))

    try {
      const response = await sendToBackground<{ text: string }, AskLlmResponse>(
        {
          name: "ask-llm",
          body: {
            text: bubble.selectedText
          }
        }
      )

      await addAskLlmHistoryItem({
        answer: response.answer,
        error: response.error,
        pageTitle: document.title,
        pageUrl: window.location.href,
        text: bubble.selectedText
      })

      setBubble((current) => ({
        ...current,
        answer: response.answer ?? "",
        error: response.error ?? "",
        isLoading: false
      }))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not ask the LLM."

      await addAskLlmHistoryItem({
        error: message,
        pageTitle: document.title,
        pageUrl: window.location.href,
        text: bubble.selectedText
      })

      setBubble((current) => ({
        ...current,
        error: message,
        isLoading: false
      }))
    }
  }

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!bubbleRef.current?.contains(event.target as Node)) {
        hideBubble()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideBubble()
      }
    }

    document.addEventListener("selectionchange", handleSelection)
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(timeoutRef.current)
      document.removeEventListener("selectionchange", handleSelection)
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleSelection, hideBubble])

  if (!bubble.visible) {
    return null
  }

  return (
    <div
      ref={bubbleRef}
      className="ask-llm-bubble"
      style={{
        left: bubble.x,
        top: bubble.y
      }}>
      <button
        className="ask-llm-button"
        disabled={bubble.isLoading}
        onMouseDown={(event) => event.preventDefault()}
        onClick={handleAskLlm}>
        {bubble.isLoading ? "Asking..." : "Ask LLM"}
      </button>

      {(bubble.answer || bubble.error) && (
        <div className={bubble.error ? "ask-llm-error" : "ask-llm-answer"}>
          {bubble.error || bubble.answer}
        </div>
      )}
    </div>
  )
}

export default AskLlmUi
