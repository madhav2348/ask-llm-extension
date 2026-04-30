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

const handler: PlasmoMessaging.MessageHandler<
  AskLlmRequest,
  AskLlmResponse
> = async (req, res) => {
  const text = req.body?.text?.trim()

  if (!text) {
    res.send({ error: "Select some text first." })
    return
  }

  try {
    const answer = await sendAIRequest(text)
    res.send({ answer })
  } catch (error) {
    res.send({
      error: error instanceof Error ? error.message : "The LLM request failed."
    })
  }
}

export default handler

async function sendAIRequest(text: string) {
  const endpoint =
    process.env.PLASMO_PUBLIC_LLM_ENDPOINT ??
    "https://api.openai.com/v1/chat/completions"
  const apiKey = process.env.PLASMO_PUBLIC_LLM_API_KEY
  const model = process.env.PLASMO_PUBLIC_LLM_MODEL ?? "gpt-4o-mini"

  if (!apiKey && endpoint.includes("api.openai.com")) {
    throw new Error(
      "Set PLASMO_PUBLIC_LLM_API_KEY in your env before asking the LLM."
    )
  }

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
