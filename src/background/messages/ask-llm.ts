import type { PlasmoMessaging } from "@plasmohq/messaging"

type AskLlmRequest = {
  text?: string
}

type AskLlmResponse = {
  answer?: string
  error?: string
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
    text?: string
  }>
  error?: {
    message?: string
  }
  output_text?: string
}

const DEBUG_PREFIX = "[Ask LLM background]"

const MOCK_ANSWERS = [
  "Mock answer: this selected text looks like content you can summarize, explain, or turn into follow-up questions.",
  "Mock answer: the main point appears to be the selected passage. Add an API key to receive a real model response.",
  "Mock answer: I would answer based on the selected text here. This response is generated locally for button testing."
]

const handler: PlasmoMessaging.MessageHandler<
  AskLlmRequest,
  AskLlmResponse
> = async (req, res) => {
  const text = req.body?.text?.trim()
  console.debug(`${DEBUG_PREFIX} received ask-llm message`, {
    hasText: Boolean(text),
    textLength: text?.length ?? 0,
    preview: text?.slice(0, 120) ?? ""
  })

  if (!text) {
    console.debug(`${DEBUG_PREFIX} sending validation error`)
    res.send({ error: "Select some text first." })
    return
  }

  try {
    console.debug(`${DEBUG_PREFIX} sending LLM request`)
    const answer = await sendAIRequest(text)
    console.debug(`${DEBUG_PREFIX} sending answer to content script`, {
      answerLength: answer.length
    })
    res.send({ answer })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The LLM request failed."
    console.debug(`${DEBUG_PREFIX} sending error to content script`, {
      message
    })
    res.send({
      error: message
    })
  }
}

export default handler

async function sendAIRequest(text: string) {
  const endpoint =
    process.env.PLASMO_PUBLIC_LLM_ENDPOINT ??
    "https://api.openai.com/v1/chat/completions"
  const apiKey = await getApiKey()
  const model = process.env.PLASMO_PUBLIC_LLM_MODEL ?? "gpt-4o-mini"

  if (!apiKey && endpoint.includes("api.openai.com")) {
    console.debug(`${DEBUG_PREFIX} using mock answer: no API key configured`)
    return getMockAnswer(text)
  }

  console.debug(`${DEBUG_PREFIX} fetch starting`, {
    endpoint,
    hasApiKey: Boolean(apiKey),
    model,
    textLength: text.length
  })

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Answer clearly and concisely. Use the selected text as the user's context."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.2
    })
  })

  const data = (await response
    .json()
    .catch(() => ({}))) as ChatCompletionResponse

  console.debug(`${DEBUG_PREFIX} fetch completed`, {
    ok: response.ok,
    status: response.status
  })

  if (!response.ok) {
    throw new Error(
      data.error?.message ?? `The LLM request failed with ${response.status}.`
    )
  }

  const answer =
    data.choices?.[0]?.message?.content ??
    data.choices?.[0]?.text ??
    data.output_text

  if (!answer) {
    throw new Error("The LLM returned an empty response.")
  }

  return answer.trim()
}

function getMockAnswer(text: string) {
  const index = text.length % MOCK_ANSWERS.length
  return `${MOCK_ANSWERS[index]}\n\nSelected text preview: "${text.slice(
    0,
    180
  )}${text.length > 180 ? "..." : ""}"`
}

async function getApiKey() {
  const result = await chrome.storage.local.get("askLlmApiKey")
  const savedApiKey =
    typeof result.askLlmApiKey === "string" ? result.askLlmApiKey.trim() : ""

  console.debug(`${DEBUG_PREFIX} API key lookup complete`, {
    hasSavedApiKey: Boolean(savedApiKey),
    hasEnvApiKey: Boolean(process.env.PLASMO_PUBLIC_LLM_API_KEY)
  })

  return savedApiKey || process.env.PLASMO_PUBLIC_LLM_API_KEY
}
