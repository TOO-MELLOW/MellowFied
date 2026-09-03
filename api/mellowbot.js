// ... (unchanged imports and setup)

async function callGroq(messages, useSchema, tools = TOOLS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const tokenEstimate = messages.reduce((acc, m) => acc + (m.content ? m.content.length : 0) + 50, 0);
    console.log(`[Groq] Estimating ~${tokenEstimate} chars, useSchema=${useSchema}`);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages,
        ...(useSchema ? { response_format: RESPONSE_SCHEMA } : {}),
        tools: useSchema ? undefined : tools,
        tool_choice: useSchema ? 'none' : 'auto',
        reasoning_effort: 'low',
        temperature: 0.2,
        max_completion_tokens: useSchema ? 700 : 300,   // reduced further
        parallel_tool_calls: false,
        stream: false
      }),
      signal: controller.signal
    });
    return response;
  } finally { clearTimeout(timeout); }
}

// ... rest of the file unchanged (the handler is exactly as before, but with the updated callGroq)
