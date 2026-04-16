const { ApiResponse, asyncHandler } = require('../utils/apiResponse')
const { logger } = require('../config/logger')

const SYSTEM_PROMPT = `You are an AI assistant built into FreelanceFlow, a freelance management SaaS app. Help freelancers with:
1. Using the app features (invoices, clients, projects, time tracking)
2. Financial advice (pricing, revenue optimization)
3. Business growth tips (finding clients, proposals)
4. India-specific GST/TDS/freelance tax questions
5. General freelancing questions

Be concise, helpful, and friendly. Use emojis sparingly. Focus on actionable advice.`

const chat = asyncHandler(async (req, res) => {
  const { messages } = req.body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'Messages array is required' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ success: false, message: 'AI service not configured' })
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content
      }))
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    logger.error({ status: response.status, error: errorData }, 'Anthropic API error')
    return res.status(response.status).json({ success: false, message: 'AI service unavailable' })
  }

  const data = await response.json()
  const answer = data.content?.[0]?.text || "I couldn't process that. Please try again!"

  return res.status(200).json({
    success: true,
    message: 'AI response generated',
    data: { content: answer }
  })
})

module.exports = { chat }
