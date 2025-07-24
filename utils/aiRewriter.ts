import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function rewriteNews(all_news: any[]) {
  const prompt = `
INSTRUCTIONS:
- Only include news that directly impacts the stock market (ignore all other news, even if they are about general economy, politics, or business but do not affect the stock market).
- For each news, explain in the description how and why this news could affect the stock market (e.g., "This news may cause volatility in Nifty stocks due to...", "This IPO could attract new investors to the market because...").
- Strictly get news article from each news[sourcelink] and then rewrite each news article while maintaining accuracy.
- Ensure rewritten content is **exactly 300 characters**.
- Format into well-structured paragraphs.
- Strictly preserve numerical data, stock indices, and key facts.
- Strictly include only unique articles from {today_date}, avoiding duplicates.
- Strictly identify and remove duplicate articles that convey the same core event or information, even if phrased differently, and keep only one.
- Analyze the news content and assign a sentiment score from 0 to 5, where 0 is lowest (negative impact), 5 is highest (positive impact), and 2-3 is neutral/average.
- Analyze the news content and calculate its overall weightage based on its stock market impact (High, Moderate, Low) and sentiment score (0 to 5). Assign a final weightage score that reflects both factors, emphasizing news with high impact and high sentiment scores.
- For each news, decide the zone as either 'india' or 'world' based on the news content and source. If the news is about India or Indian markets, set zone to 'india'. If it is about global or international markets, set zone to 'world'.
- For each news, set createddate as the current date and time in DD-MM-YYYY-hhh:mm format.
- Use only these categories: stocks, nifty, sensex, bse, nse, ipo, market, commodity, futures, options, bond, banknifty, share, sebi, rbi, fii, dii, gst, rupee, dollar, forex, trade, budget, taxation, corporate, msme, nbfc, insurance, psu, business, economy, finance.
- Do NOT use any other category. If the news does not fit any of these, discard it.
- Follow this JSON format strictly:
The output must be an array where each news article follows this structure:

[
  {
    "title": "Rewritten Headline",
    "description": "Rewritten News should be in simple english - easy to understand (strictly in 300 characters only), and must explain how this news could affect the stock market.",
    "url": "take Source Link as it is from the provided data",
    "category": "Choose only from the allowed categories above.",
    "zone": "Decide zone as either 'india' or 'world' based on the news content and source.",
    "sentiment": "Numerical score from 0 to 5 as described above.",
    "weightage": "Final weightage score as described above.",
    "createddate": "Current date and time in DD-MM-YYYY-hhh:mm format."
  },
  {next news in the same format}, ...
]

EXTRACT ALL NEWS ARTICLES FROM THE FOLLOWING DATA AND STRICTLY FOLLOW THE ABOVE INSTRUCTIONS:

${JSON.stringify(all_news)}

REMEMBER: Strictly from this whole data above identify and remove duplicate articles that convey the same core event or information, even if phrased differently, and keep only one.
`;
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
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