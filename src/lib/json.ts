// Extracts a JSON object from an LLM response.
//
// The model is asked to return JSON, but it may wrap it in a ```json fence,
// add stray prose, or return it bare. The old code assumed an exact fence and
// used slice(7, length-3), which breaks the moment the format shifts slightly.
export function extractJson(text: string): any {
  const cleaned = (text || '').trim()

  // 1. Strip a markdown code fence if present (```json ... ``` or ``` ... ```)
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = fenced ? fenced[1] : cleaned

  try {
    return JSON.parse(candidate)
  } catch {
    // 2. Fall back to the outermost {...} block in the text
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1))
    }
    throw new Error(`Model did not return valid JSON: ${cleaned.slice(0, 200)}`)
  }
}
