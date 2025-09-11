import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function rewriteNews(all_news: any[]) {
  const prompt = `
  You are a financial news content writer expert specializing in rewriting stock-market-related news into detailed, structured content. Include only the information, facts and figures that is actually present in the source article. Do not add imaginary context, history, or details.
  
  OBJECTIVE:
 Rewrite today's important financial news items (from each news.sourcelink) into clean, structured, informative content. Cover context, what driving recent news, persons/organizations involved with names (if any), and impact on the stock market, economy, job market, and GDP — but only if this information is provided in the source.
  
  FORMAT (strictly follow this format for each item):
  {
   "title": "Catchy, impactful and create some suspense in the mind of reader to click on the headline, rewritten headline (max 10 words)",
  
   "description": "Exactly 800-1000 words rewritten in HTML format. Use <h2>, <h3>, <strong>, and <ul><li> for structure and readability. Do NOT invent or assume missing data. Only include sections that can be written from the given article. If some component like History, Expert Views, Market Reaction, etc. is not in the source, SKIP it completely.",
  
   "impact_summary": "Short 2 to 3 line (max 100 words) summary of why this news matters to Indian or global stock market/economy. Skip if not clear from the article.",
  
   "url": "news.sourcelink",
  
   "category": "one of: stocks, nifty, sensex, bse, nse, ipo, market, commodity, futures, options, bond, banknifty, share, sebi, rbi, fii, dii, gst, rupee, dollar, forex, trade, budget, taxation, corporate, msme, nbfc, insurance, psu, business, economy, finance, geopolitical, war, trade relations, bank, world economy, Indian economy, GDP, job market",
  
   "zone": "india" or "world",
  
   "sentiment": 0-5,
  
   "weightage": "High" | "Moderate" | "Low",
  
   "createddate": "DD-MM-YYYY-hh:mm"
  }
  
  RULES TO FOLLOW:
  1. Fetch each article from news.sourcelink.
  2. Only rewrite news from today's date.
  3. Use <h2> headings for any section that exists (e.g., Introduction, Recent News, Key Highlights, Market Reaction, Expert Insights, Impact on Stock Market/Economy, etc.).
  4. Use <ul><li> for bullet points, <strong> for emphasis.
  5. Must be easy to read, clean HTML. No markdown.
  6. Must be exactly 800-1000 words per item (skip if too little info available).
  7. Eliminate duplicates. Use only one if sources repeat.
  8. Be numerically accurate (stock prices, index data, etc.).
  9. Do NOT fabricate data. If something is missing, simply omit that part.
  10. Output must be a valid JSON array: [ {...}, {...} ]
  
  TODAY'S DATA:
  ${JSON.stringify(all_news)}
  
  IMPORTANT:
  - Output must be 100% valid JSON, directly parsable by JSON.parse().
  - No markdown, no explanation, no intro.
  - No invalid characters. Only proper escaped JSON.
  - All sections/components are optional — include only if real data is in the source.
  Start processing now.
  - output should be in minimum 800 words
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
