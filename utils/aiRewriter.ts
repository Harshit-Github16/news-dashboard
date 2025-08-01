import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function rewriteNews(all_news: any[]) {

const prompt = `
You are a financial news rewriter focused on stock market impact.

### OBJECTIVE:
Extract and rewrite relevant stock market-impacting news from the provided dataset.

### GUIDELINES:
1. **Include only** news that directly affects the stock market (ignore political, economic, or business news that has no market impact).
2. **Rewriting rules:**
   - Fetch and read content from each \`news.sourcelink\`.
   - Rewrite the headline and news in **simple, accurate English**.
   - Keep the news description to **exactly 300 characters** (do not exceed).
   - Provide a **separate short paragraph (20–30 words)** explaining how this news could impact the stock market.

3. **Strictly preserve** all numerical data (like stock prices, indices, dates, financial terms).
4. **Detect and remove duplicate news** (based on core event similarity), only keep one version.
5. **Set sentiment score (0–5):**
   - 0 = very negative, 5 = very positive, 2–3 = neutral.
6. **Set impact weightage**:
   - Based on sentiment + market relevance: High, Moderate, Low.
   - Derive a final score (e.g., High + 5 sentiment = high weightage).
7. **Zone**:
   - If news is about India/Indian market, use \`india\`.
   - If global/international, use \`world\`.

8. **Created date**:
   - Format: \`DD-MM-YYYY-hh:mm\` (use current IST time).

9. **Allowed categories** (must choose only one):
   stocks, nifty, sensex, bse, nse, ipo, market, commodity, futures, options, bond, banknifty, share, sebi, rbi, fii, dii, gst, rupee, dollar, forex, trade, budget, taxation, corporate, msme, nbfc, insurance, psu, business, economy, finance

10. **FORMAT** output strictly as an array of JSON objects:
[
  {
    "title": "Rewritten headline here",
    "description": "Exactly 300 characters rewritten news in simple English.",
    "impact_summary": "Short 20–30 word explanation on how this affects the stock market.",
    "url": "original news.sourcelink",
    "category": "choose from allowed categories only",
    "zone": "india or world",
    "sentiment": 0-5,
    "weightage": "final weightage score (e.g., High, Moderate, Low)",
    "createddate": "DD-MM-YYYY-hh:mm"
  },
  ...
]

### DATA TO PROCESS:
${JSON.stringify(all_news)}

IMPORTANT:
- Strictly process articles **from today's date only**.
- **Do NOT include** anything outside the defined structure.
- Final output must be **valid JSON**.

Begin now.
`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response from Gemini');
    // Robust JSON parsing
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const jsonString = jsonMatch[0];
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      return [];
    }
  } catch (err: any) {
    console.error('Gemini SDK rewriter error:', err.message);
    return [];
  }
} 