import cssText from "data-text:~/styles.css"
import { useCallback, useEffect, useRef, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import { addAskLlmHistoryItem } from "../history"

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

const DEBUG_PREFIX = "[Ask LLM]"
const LOADING_PREVIEW_MS = 2000
const PASSIVE_EVENT_OPTIONS: AddEventListenerOptions = { passive: true }
const CAPTURE_PASSIVE_EVENT_OPTIONS: AddEventListenerOptions = {
  capture: true,
  passive: true
}
const CAPTURE_EVENT_OPTIONS: AddEventListenerOptions = { capture: true }

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function getSelectionRect(selection: Selection) {
  if (selection.rangeCount === 0) {
    return null
  }

  const range = selection.getRangeAt(0).cloneRange()
  return getRangeRect(range)
}

function getActiveSelection() {
  const selection = window.getSelection()
  const selectedText = selection?.toString().trim() ?? ""

  if (!selection || !selectedText || selection.rangeCount === 0) {
    return null
  }

  return {
    range: selection.getRangeAt(0).cloneRange(),
    selection,
    selectedText
  }
}

function getRangeRect(range: Range) {
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

function waitForLoadingPreview() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, LOADING_PREVIEW_MS)
  })
}

function AskLlmUi() {
  const [bubble, setBubble] = useState<BubbleState>(initialBubbleState)
  const askLlmEnabledRef = useRef(false)
  const bubbleVisibleRef = useRef(false)
  const lastTextRef = useRef("")
  const positionFrameRef = useRef<number>()
  const selectionFrameRef = useRef<number>()
  const bubbleRef = useRef<HTMLDivElement>(null)
  const selectedRangeRef = useRef<Range | null>(null)

  const hideBubble = useCallback(() => {
    if (!bubbleVisibleRef.current && !lastTextRef.current) {
      return
    }

    console.debug(`${DEBUG_PREFIX} hiding bubble`)
    bubbleVisibleRef.current = false
    lastTextRef.current = ""
    selectedRangeRef.current = null
    setBubble(initialBubbleState)
  }, [])

  const updateBubblePosition = useCallback(() => {
    if (!bubbleVisibleRef.current || !selectedRangeRef.current) {
      return
    }

    const rect = getRangeRect(selectedRangeRef.current)

    if (!rect) {
      console.debug(`${DEBUG_PREFIX} position update skipped: no range rect`)
      hideBubble()
      return
    }

    const bubbleWidth = Math.min(340, window.innerWidth - 24)
    const { x, y } = getBubbleCoordinates(rect, bubbleWidth)

    console.debug(`${DEBUG_PREFIX} position updated`, { x, y })
    setBubble((current) => ({
      ...current,
      x,
      y
    }))
  }, [hideBubble])

  const schedulePositionUpdate = useCallback(() => {
    window.cancelAnimationFrame(positionFrameRef.current ?? 0)
    positionFrameRef.current =
      window.requestAnimationFrame(updateBubblePosition)
  }, [updateBubblePosition])

  const handleSelection = useCallback(() => {
    window.cancelAnimationFrame(selectionFrameRef.current ?? 0)

    selectionFrameRef.current = window.requestAnimationFrame(() => {
      const isEnabled = askLlmEnabledRef.current
      console.debug(`${DEBUG_PREFIX} selection changed`, { isEnabled })

      if (isEnabled === false) {
        console.debug(`${DEBUG_PREFIX} selection ignored: feature disabled`)
        hideBubble()
        return
      }

      const activeSelection = getActiveSelection()
      const selection = activeSelection?.selection
      const selectedText = activeSelection?.selectedText ?? ""
      console.debug(`${DEBUG_PREFIX} selected text captured`, {
        length: selectedText.length,
        preview: selectedText.slice(0, 120)
      })

      if (
        !selection ||
        !selectedText ||
        isSelectionInsideBubble(selection, bubbleRef.current)
      ) {
        console.debug(`${DEBUG_PREFIX} selection ignored`, {
          hasSelection: Boolean(selection),
          hasText: Boolean(selectedText),
          insideBubble: Boolean(
            selection && isSelectionInsideBubble(selection, bubbleRef.current)
          )
        })
        hideBubble()
        return
      }

      if (selectedText === lastTextRef.current && bubbleVisibleRef.current) {
        console.debug(`${DEBUG_PREFIX} selection ignored: unchanged`)
        return
      }

      const rect = getRangeRect(activeSelection.range)

      if (!rect) {
        console.debug(`${DEBUG_PREFIX} selection ignored: no selection rect`)
        hideBubble()
        return
      }

      const bubbleWidth = Math.min(340, window.innerWidth - 24)
      const { x, y } = getBubbleCoordinates(rect, bubbleWidth)

      lastTextRef.current = selectedText
      selectedRangeRef.current = activeSelection.range
      console.debug(`${DEBUG_PREFIX} showing ask button`, {
        selectedTextLength: selectedText.length,
        x,
        y
      })
      bubbleVisibleRef.current = true
      setBubble({
        answer: "",
        error: "",
        isLoading: false,
        selectedText,
        visible: true,
        x,
        y
      })
    })
  }, [hideBubble])

  const handleSelectionFallback = useCallback(
    (source: string) => {
      console.debug(`${DEBUG_PREFIX} selection fallback event`, { source })
      handleSelection()
    },
    [handleSelection]
  )

  const handleAskLlm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    console.debug(`${DEBUG_PREFIX} ask button clicked`, {
      hasSelectedText: Boolean(bubble.selectedText),
      isLoading: bubble.isLoading,
      selectedTextLength: bubble.selectedText.length
    })

    if (!bubble.selectedText || bubble.isLoading) {
      console.debug(`${DEBUG_PREFIX} ask click ignored`)
      return
    }

    setBubble((current) => ({
      ...current,
      answer: "",
      error: "",
      isLoading: true
    }))

    const loadingPreview = waitForLoadingPreview()

    try {
      console.debug(`${DEBUG_PREFIX} sending message to background`, {
        textLength: bubble.selectedText.length
      })

      const response = await sendToBackground<{ text: string }, AskLlmResponse>(
        {
          name: "ask-llm",
          body: {
            text: bubble.selectedText
          }
        }
      )

      await loadingPreview

      console.debug(`${DEBUG_PREFIX} received background response`, {
        hasAnswer: Boolean(response.answer),
        hasError: Boolean(response.error)
      })

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
      await loadingPreview

      const message =
        error instanceof Error ? error.message : "Could not ask the LLM."

      console.debug(`${DEBUG_PREFIX} background request failed`, {
        message
      })

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
    chrome.storage.local.get("askLlmEnabled").then((result) => {
      askLlmEnabledRef.current = result.askLlmEnabled === true
      console.debug(`${DEBUG_PREFIX} enabled state loaded`, {
        isEnabled: askLlmEnabledRef.current
      })
    })

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "local" || !changes.askLlmEnabled) {
        return
      }

      askLlmEnabledRef.current = changes.askLlmEnabled.newValue === true
      console.debug(`${DEBUG_PREFIX} enabled state changed`, {
        isEnabled: askLlmEnabledRef.current
      })

      if (!askLlmEnabledRef.current) {
        hideBubble()
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!bubbleRef.current?.contains(event.target as Node)) {
        console.debug(`${DEBUG_PREFIX} outside pointer down`)
        hideBubble()
        return
      }

      console.debug(`${DEBUG_PREFIX} pointer down inside bubble`)
    }

    const handlePointerUp = () => {
      handleSelectionFallback("pointerup")
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        console.debug(`${DEBUG_PREFIX} escape pressed`)
        hideBubble()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === "Shift" ||
        event.key.startsWith("Arrow") ||
        event.key === "Home" ||
        event.key === "End"
      ) {
        handleSelectionFallback(`keyup:${event.key}`)
      }
    }

    const handleFocusChange = () => {
      handleSelectionFallback("focus-change")
    }

    const handleScrollOrResize = () => {
      if (bubbleVisibleRef.current) {
        console.debug(`${DEBUG_PREFIX} scroll/resize detected`)
        schedulePositionUpdate()
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    document.addEventListener("selectionchange", handleSelection)
    document.addEventListener(
      "pointerdown",
      handlePointerDown,
      PASSIVE_EVENT_OPTIONS
    )
    document.addEventListener(
      "pointerup",
      handlePointerUp,
      CAPTURE_PASSIVE_EVENT_OPTIONS
    )
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener(
      "keyup",
      handleKeyUp,
      CAPTURE_PASSIVE_EVENT_OPTIONS
    )
    window.addEventListener("blur", handleFocusChange, CAPTURE_EVENT_OPTIONS)
    window.addEventListener(
      "scroll",
      handleScrollOrResize,
      CAPTURE_PASSIVE_EVENT_OPTIONS
    )
    window.addEventListener(
      "resize",
      handleScrollOrResize,
      PASSIVE_EVENT_OPTIONS
    )
    document.addEventListener(
      "scroll",
      handleScrollOrResize,
      CAPTURE_PASSIVE_EVENT_OPTIONS
    )

    return () => {
      window.cancelAnimationFrame(selectionFrameRef.current ?? 0)
      window.cancelAnimationFrame(positionFrameRef.current ?? 0)
      chrome.storage.onChanged.removeListener(handleStorageChange)
      document.removeEventListener("selectionchange", handleSelection)
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
        PASSIVE_EVENT_OPTIONS
      )
      document.removeEventListener(
        "pointerup",
        handlePointerUp,
        CAPTURE_PASSIVE_EVENT_OPTIONS
      )
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener(
        "keyup",
        handleKeyUp,
        CAPTURE_PASSIVE_EVENT_OPTIONS
      )
      window.removeEventListener(
        "blur",
        handleFocusChange,
        CAPTURE_EVENT_OPTIONS
      )
      window.removeEventListener(
        "scroll",
        handleScrollOrResize,
        CAPTURE_PASSIVE_EVENT_OPTIONS
      )
      window.removeEventListener(
        "resize",
        handleScrollOrResize,
        PASSIVE_EVENT_OPTIONS
      )
      document.removeEventListener(
        "scroll",
        handleScrollOrResize,
        CAPTURE_PASSIVE_EVENT_OPTIONS
      )
    }
  }, [
    handleSelection,
    handleSelectionFallback,
    hideBubble,
    schedulePositionUpdate
  ])

  if (!bubble.visible) {
    return null
  }

  return (
    <div
      ref={bubbleRef}
      className={`ask-llm-bubble${
        bubble.isLoading || bubble.answer || bubble.error ? " is-expanded" : ""
      }`}
      style={{
        left: bubble.x,
        top: bubble.y
      }}>
      <button
        className="ask-llm-button"
        disabled={bubble.isLoading}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          console.debug(`${DEBUG_PREFIX} button pointer down`)
        }}
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          console.debug(`${DEBUG_PREFIX} button mouse down`)
        }}
        onClick={handleAskLlm}>
        {bubble.isLoading ? "Loading" : "Ask LLM"}
      </button>

      {bubble.isLoading && (
        <div className="ask-llm-loading" role="status" aria-live="polite">
          <span className="ask-llm-loading-spinner" aria-hidden="true" />
          <span className="ask-llm-loading-copy">
            <span className="ask-llm-loading-title">Checking meta context</span>
            <span className="ask-llm-loading-detail">
              Preparing the selected text for the LLM.
            </span>
          </span>
        </div>
      )}

      {(bubble.answer || bubble.error) && (
        <div className={bubble.error ? "ask-llm-error" : "ask-llm-answer"}>
          {bubble.error || bubble.answer}
        </div>
      )}
    </div>
  )
}

export default AskLlmUi
