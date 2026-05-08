import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface SymptomCheckRequest {
  symptoms: string[];
  duration_days?: number;
  spreading_rapidly?: boolean;
}

// ─── POST /api/symptom-check ──────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const { symptoms = [], duration_days = 0, spreading_rapidly = false }: SymptomCheckRequest = req.body;

  if (!symptoms.length) {
    return res.status(400).json({ error: 'At least one symptom is required' });
  }

  try {
    const prompt = `You are a medical triage AI assisting ASHA (Accredited Social Health Activist) workers in India.
Apply WHO and ICMR guidelines to evaluate the following patient symptoms.

Patient Symptoms: ${symptoms.join(', ')}
Duration: ${duration_days} days
Spreading Rapidly: ${spreading_rapidly ? 'Yes' : 'No'}

Respond STRICTLY with a JSON object. Do NOT include markdown wrappers like \`\`\`json. The JSON must exactly match this interface:
{
  "results": [
    {
      "symptom": string,
      "action": string (e.g., "refer_doctor", "home_care", "monitor_closely"),
      "advice": string (Specific first-aid or home remedy advice),
      "urgency": "low" | "medium" | "high" 
    }
  ],
  "overall_urgency": "low" | "medium" | "high",
  "summary": string (A brief 1-2 sentence summary of what the ASHA worker should do)
}

Rules:
- High urgency requires referral to PHC (Primary Health Centre).
- IF diarrhea > 2 days, or fever > 3 days, or rapidly spreading rash, set urgency to high.
- Keep advice actionable for a village health worker.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2, // low temp for diagnostic accuracy
      max_tokens: 1024,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Robust JSON extraction
    let cleanJson = responseContent.trim();
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    } else {
      cleanJson = cleanJson.replace(/^```json/i, '').replace(/```$/i, '').trim();
    }

    const output = JSON.parse(cleanJson);
    return res.json(output);

  } catch (error) {
    console.error("Groq API error in /api/symptom-check:", error);
    // Fallback in case LLM is unreachable
    return res.json({
      results: [{ symptom: symptoms.join(', '), action: 'refer_doctor', advice: 'Unable to process automatically via AI. Please rely on standard ASHA handbook or consult supervisor.', urgency: 'medium' }],
      overall_urgency: 'medium',
      summary: 'System offline. Rely on manual evaluation.'
    });
  }
});

export default router;
