import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function rewriteNews(all_news: any[]) {
  const prompt = `
You are a financial news blog expert specializing in rewriting stock-market-related news blog into detailed, structured content. Include all the things that a common man needs to know to stay updated about financial market include the history to understand context in a better way. 

OBJECTIVE: 

Rewrite today's important financial news items (from each news.sourcelink) into well-structured, informative content that explains the origin, current news, person and organisations involved, impact on the stock market, economy, job market and GDP. 

FORMAT (strictly follow this format for each item): 
{ 

"title": "Clean, impactful, catchy, click bait rewritten headline (max 15 words)", 

 "description": "Exactly 1400-1500 words rewritten in HTML format. Use <h2>, <h3>, <strong>, and <ul><li> for structure and readability. Avoid markdown or LaTeX.", 

 "impact_summary": "Short paragraph (1 line, max 100 words) clearly stating why this news matters to the Indian or global stock market and economy.", 

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

3. Use <h2> for section titles like Introduction, History, Recent news, Key Highlights, Market Reaction, Expert Insights, Impact on Stock Market or Economy, etc. This is must to use proper headings and must use impact on stock market section. 

4. Use <ul><li> for bullet points, <strong> for important info. 

5. Must be easy to read, clean HTML. No markdown. 

6. Must be exactly 1400-1500 words per item. 

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
