import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function rewriteNews(all_news: any[]) {
  const prompt = `
INSTRUCTIONS:
- Rewrite each headline in a suspenseful yet professional way.
- Only include news that may impact the economy, stock market, or financial/Indian/global markets. Discard irrelevant news.
- Strictly get news article from each news[sourcelink] and then rewrite each news article while maintaining accuracy.
- Ensure rewritten content is **exactly 300 characters**.
- Format into well-structured paragraphs.
- Strictly preserve numerical data, stock indices, and key facts.
- Strictly include only unique articles from {today_date}, avoiding duplicates.
- Strictly identify and remove duplicate articles that convey the same core event or information, even if phrased differently, and keep only one.
- Analyze the news content and assign a sentiment score from -5 to 5, where -5 to -4 is "worse," -3 to -1 is "bad," 0 is "average," 1 to 3 is "good," 4 is "better," and 5 is "best," returning only the numerical score.
- Analyze the news content and calculate its overall weightage based on its economic impact (High, Moderate, Low) and sentiment score (-5 to 5). Assign a final weightage score that reflects both factors, emphasizing news with high impact and high sentiment scores.
- For each news, decide the zone as either 'india' or 'world' based on the news content and source. If the news is about India or Indian markets, set zone to 'india'. If it is about global or international markets, set zone to 'world'.
- For each news, set createddate as the current date and time in DD-MM-YYYY-hhh:mm format.
- Follow this JSON format strictly:
The output must be an array where each news article follows this structure:

[
  {
    "title": "Rewritten Headline",
    "description": "Rewritten News should be in simple english - easy to understand (strictly in 300 characters only)",
    "url": "take Source Link as it is from the provided data",
    "category": "Decide the most relevant category (e.g. economy, stocks, business, etc.)",
    "zone": "Decide zone as either 'india' or 'world' based on the news content and source.",
    "sentiment": "Numerical score from -5 to 5 as described above.",
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