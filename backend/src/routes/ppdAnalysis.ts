import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface PpdAnalysisRequest {
  epds_answers: number[];
  score: number;
  risk_level: string;
}

const EPDS_QUESTIONS = [
  "I have been able to laugh and see the funny side of things",
  "I have looked forward with enjoyment to things",
  "I have blamed myself unnecessarily when things went wrong",
  "I have been anxious or worried for no good reason",
  "I have felt scared or panicky for no very good reason",
  "Things have been getting on top of me",
  "I have been so unhappy that I have had difficulty sleeping",
  "I have felt sad or miserable",
  "I have been so unhappy that I have been crying",
  "The thought of harming myself has occurred to me"
];

// ─── POST /api/ppd-analysis ──────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const { epds_answers = [], score = 0, risk_level = 'low' }: PpdAnalysisRequest = req.body;

  if (epds_answers.length !== 10) {
    return res.status(400).json({ error: 'Must provide exactly 10 EPDS answers' });
  }

  try {
    const qnaText = epds_answers.map((ans, i) => `Q: ${EPDS_QUESTIONS[i]} | Score Output: ${ans}/3`).join('\n');
    const isSelfHarm = epds_answers[9] > 0;

    const prompt = `You are an expert maternal mental health supervisor assisting an ASHA worker in India.
The ASHA worker just administered the EPDS (Edinburgh Postnatal Depression Scale) to a new mother.

Total Score: ${score}/30
Overall Risk Level: ${risk_level.toUpperCase()}
Self-Harm Risk Detected: ${isSelfHarm ? 'YES - CRITICAL URGENCY' : 'No'}

Detailed Question Breakdown:
${qnaText}

Return exactly a JSON object providing tailored guidance for the ASHA worker. Do NOT wrap in \`\`\`json. The JSON MUST exactly match this structure:
{
  "counseling_script": "A short, compassionate 2-3 sentence script the ASHA worker can say out loud to comfort the mother right now.",
  "action_plan": [
    "Array of 2-3 clear, actionable steps for the ASHA worker safely managing this specific symptom profile."
  ],
  "referral_summary": "A 1-2 sentence professional medical summary of the mother's state to be read to the PHC Doctor over the phone."
}

Rules:
- Be extremely empathetic but professional.
- If self-harm is YES, instruct the ASHA NEVER to leave the mother alone and to contact family immediately.
- Keep the language simple so a rural health worker can easily understand it.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3, // low temperature for clinical reliability 
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
    console.error("Groq API error in /api/ppd-analysis:", error);
    // Fallback in case LLM is unreachable
    return res.json({
      counseling_script: score >= 13 ? "I understand this is very hard. You are not alone, and we will get you medical help today." : "You are doing your best. It is normal to feel overwhelmed, but I am here to support you.",
      action_plan: [
        "Record the total score in your physical register.",
        score >= 10 ? "Discuss with the Medical Officer at the PHC." : "Schedule a follow-up visit next week."
      ],
      referral_summary: `The mother scored ${score}/30 on the EPDS, indicating a ${risk_level} risk of postpartum depression.`
    });
  }
});

export default router;
