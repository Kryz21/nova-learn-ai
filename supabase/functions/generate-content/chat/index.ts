// supabase/functions/chat/index.ts
// Deploy with: supabase functions deploy chat
// Requires secret: supabase secrets set GEMINI_API_KEY=your-key

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const GEMINI_API_KEY          = Deno.env.get('AQ.Ab8RN6IfqfLscUfiPQQt2dQ_NreFbMvNTrbF7ii8JkTE-t_goA')
const SUPABASE_URL            = Deno.env.get('https://lqeqwqqvoayfkzfpxiik.supabase.co')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZXF3cXF2b2F5Zmt6ZnB4aWlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg4OTgzNSwiZXhwIjoyMDk3NDY1ODM1fQ.NFM2bDMQl2cGuQqFyn6gSQaQ-OdLbRt5ULD0cjEYF64')

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing auth' }, 401)

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401)

    const { messages, system } = await req.json()
    if (!messages?.length) return json({ error: 'No messages provided' }, 400)

    if (!GEMINI_API_KEY) {
      return json({ error: 'GEMINI_API_KEY secret not set.' }, 500)
    }

    // Convert messages to Gemini format
    // Gemini uses "user" and "model" roles (not "assistant")
    const geminiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1000,
          },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      return json({ error: `Gemini API error: ${err}` }, 500)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    return json({ text })
  } catch (err) {
    console.error(err)
    return json({ error: err?.message ?? 'Internal error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
