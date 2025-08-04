import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function rewriteNews(all_news: any[]) {
  const prompt = `
You are a financial news expert specializing in rewriting stock-market-related news into detailed, structured content.

OBJECTIVE:
Rewrite today's important financial news items (from each news.sourcelink) into well-structured, informative content that explains the impact on the stock market.

FORMAT (strictly follow this format for each item):
{
  "title": "Clean, rewritten headline (max 15 words)",
  "description": "Exactly 600–700 words rewritten in HTML format. Use <h2>, <h3>, <strong>, and <ul><li> for structure and readability. Avoid markdown or LaTeX.",
  "impact_summary": "Short paragraph (1 line, max 30 words) clearly stating why this news matters to the Indian or global stock market.",
  "url": "news.sourcelink",
  "category": "one of: stocks, nifty, sensex, bse, nse, ipo, market, commodity, futures, options, bond, banknifty, share, sebi, rbi, fii, dii, gst, rupee, dollar, forex, trade, budget, taxation, corporate, msme, nbfc, insurance, psu, business, economy, finance",
  "zone": "india" or "world",
  "sentiment": 0-5,
  "weightage": "High" | "Moderate" | "Low",
  "createddate": "DD-MM-YYYY-hh:mm"
}

RULES TO FOLLOW:
1. Fetch each article from news.sourcelink.
2. Only rewrite news from today’s date.
3. Use <h2> for section titles like Introduction, Key Highlights, Market Reaction, Expert Insights, etc.
4. Use <ul><li> for bullet points, <strong> for important info.
5. Must be easy to read, clean HTML. No markdown.
6. Must be exactly 600–700 words per item.
7. Eliminate duplicates. Use only one if sources are repeated.
8. Be numerically accurate (stock prices, index data, etc.).
9. Output must be a valid JSON array: [ {...}, {...} ]

TODAY'S DATA:
${JSON.stringify(all_news)}

IMPORTANT:
- Output must be 100% valid JSON, directly parsable by JSON.parse().
- No markdown, no explanation, no intro.
- No invalid characters. Only proper escaped JSON.
Start processing now.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response from Gemini');

    // Try to extract clean JSON block
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');

    const jsonString = jsonMatch[0];
    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      throw new Error('Parsed result is not an array');
    }

  } catch (err: any) {
    console.error('Gemini SDK rewriter error:', err.message);
    return [];
  }
}
