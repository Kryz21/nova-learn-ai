// supabase/functions/generate-content/index.ts
//
// Deploy with: supabase functions deploy generate-content
// Requires secret:
//   supabase secrets set GEMINI_API_KEY=your-key-here

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
    const userId = userData.user.id

    const { title, sourceType, text, youtubeUrl } = await req.json()
    if (!title) return json({ error: 'Title is required' }, 400)

    let sourceText = text ?? ''

    if (sourceType === 'youtube') {
      if (!youtubeUrl) return json({ error: 'youtubeUrl is required' }, 400)
      sourceText = await fetchYoutubeTranscript(youtubeUrl)
      if (!sourceText || sourceText.length < 40) {
        return json(
          { error: "Couldn't find captions for that video. Try one with captions enabled." },
          422
        )
      }
    }

    if (!sourceText || sourceText.length < 40) {
      return json({ error: 'Not enough source text to work with.' }, 400)
    }

    const trimmed = sourceText.slice(0, 60000)
    const generated = await generateWithGemini(trimmed)

    const { data: inserted, error: insertErr } = await supabase
      .from('resources')
      .insert({
        user_id: userId,
        title: title,
        source_type: sourceType,
        source_meta: youtubeUrl ? { youtubeUrl } : {},
        status: 'ready',
        notes_json: generated.notes,
        quiz_json: generated.quiz,
        flashcards_json: generated.flashcards,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('Insert error:', JSON.stringify(insertErr))
      return json({ error: `DB insert failed: ${insertErr.message}` }, 500)
    }

    return json({ resourceId: inserted.id })
  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: err?.message ?? 'Internal error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function fetchYoutubeTranscript(url: string): Promise<string> {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  const videoId = match?.[1]
  if (!videoId) throw new Error('Invalid YouTube URL')

  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  const html = await pageRes.text()
  const captionsMatch = html.match(/"captionTracks":(\[.*?\])/)
  if (!captionsMatch) return ''

  const tracks = JSON.parse(captionsMatch[1])
  const track = tracks.find((t: any) => t.languageCode?.startsWith('en')) ?? tracks[0]
  if (!track?.baseUrl) return ''

  const transcriptRes = await fetch(track.baseUrl)
  const xml = await transcriptRes.text()
  const text = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) =>
      m[1]
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/<[^>]+>/g, '')
    )
    .join(' ')

  return text.trim()
}

async function generateWithGemini(sourceText: string) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY secret is not set. Run: supabase secrets set GEMINI_API_KEY=your-key')

  const prompt = `You are a study content engine. Analyze the source material below and return ONLY valid JSON with no markdown fences, no explanation, no extra text — just raw JSON.

The JSON must match this exact shape:
{
  "notes": {
    "sections": [
      { "heading": "string", "points": ["string", "string"] }
    ],
    "keyTerms": [
      { "term": "string", "definition": "string" }
    ]
  },
  "quiz": {
    "questions": [
      {
        "question": "string",
        "options": ["option A", "option B", "option C", "option D"],
        "correctIndex": 0,
        "explanation": "string"
      }
    ]
  },
  "flashcards": {
    "cards": [
      { "front": "string", "back": "string" }
    ]
  }
}

Guidelines:
- notes: 4-8 sections, each with 3-6 bullet points; 5-10 key terms
- quiz: 8-12 multiple choice questions covering the main ideas
- flashcards: 10-15 cards focused on key facts, definitions, and concepts
- correctIndex is 0-based (0 = first option, 1 = second, etc.)

Source material:
${sourceText}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${txt}`)
  }

  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('JSON parse failed. Raw response:', raw)
    throw new Error('Gemini returned invalid JSON. Check function logs for the raw response.')
  }
}
