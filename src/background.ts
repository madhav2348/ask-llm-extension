import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const message = await sendAIRequest(req.body)

  res.send({
    message
  })
}

export default handler

async function sendAIRequest(text: string) {
  const response = fetch("", { headers: {}, body: "" })
  return await response
}
