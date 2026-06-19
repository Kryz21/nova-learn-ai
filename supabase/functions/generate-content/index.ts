// supabase/functions/generate-content/index.ts
//
// Deploy with: supabase functions deploy generate-content
// Requires secrets set with:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Receives a resource source (raw text, or a YouTube URL), gets a transcript
// if needed, asks Claude for structured notes/quiz/flashcards, and writes
// the result into the resources table using the service role (bypasses RLS,
// but we manually scope every query to the authenticated user's id).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
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

    // Cap input size to keep latency/cost sane
    const trimmed = sourceText.slice(0, 60000)

    const generated = await generateWithClaude(trimmed)

    const { data: inserted, error: insertErr } = await supabase
      .from('resources')
      .insert({
        user_id: userId,
        title,
        source_type: sourceType,
        source_meta: youtubeUrl ? { youtubeUrl } : {},
        status: 'ready',
        notes_json: generated.notes,
        quiz_json: generated.quiz,
        flashcards_json: generated.flashcards,
      })
      .select('id')
      .single()

    if (insertErr) return json({ error: insertErr.message }, 500)

    return json({ resourceId: inserted.id })
  } catch (err) {
    console.error(err)
    return json({ error: err.message ?? 'Internal error' }, 500)
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

  // Pull the watch page to find the caption track URL (unofficial, best-effort).
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

async function generateWithClaude(sourceText: string) {
  const systemPrompt = `You are Novalearn AI's content engine. Given source material, produce a JSON study set.
Return ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "notes": {
    "sections": [ { "heading": string, "points": string[] } ],
    "keyTerms": [ { "term": string, "definition": string } ]
  },
  "quiz": {
    "questions": [
      { "question": string, "options": string[4], "correctIndex": number, "explanation": string }
    ]
  },
  "flashcards": {
    "cards": [ { "front": string, "back": string } ]
  }
}
Rules:
- 3 to 6 note sections, 3-6 bullet points each, drawn only from the source.
- 5 to 8 key terms.
- 6 to 10 quiz questions, exactly 4 options each, correctIndex is 0-based.
- 10 to 16 flashcards covering the most testable facts/concepts.
- Be accurate to the source. Do not invent facts not supported by it.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Source material:\n\n${sourceText}`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Claude API error: ${errText}`)
  }

  const data = await res.json()
  const raw = data.content?.find((b: any) => b.type === 'text')?.text ?? '{}'
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '')
  return JSON.parse(cleaned)
}
