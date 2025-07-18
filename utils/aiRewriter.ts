import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function rewriteNews(news: any) {
  const prompt = `
You are a professional news editor. Rewrite the following news article.
YOUR TASK:
1. Create a completely new, unique, and engaging headline.
2. Write a well-structured HTML description between 300 and 500 words using proper HTML tags:
   - Use <h2> or <h3> for subheadings.
   - Use <p> for each paragraph.
   - If referring to any links, wrap them with <a href="...">text</a>.
   - The HTML must be clean, readable, and useful for frontend rendering.
3. Generate a new, creative image URL relevant to the content.
4. Set the author to ''.
5. Keep the original 'category' and 'url'.

YOU MUST OUTPUT ONLY A VALID JSON OBJECT, AND NOTHING ELSE.
The JSON object must have these keys: "headline", "author", "time", "description", "image", "category", "url".

EXAMPLE OUTPUT:
{
  "headline": "Stock Markets Soar as Inflation Cools Down",
  "author": " ",
  "time": "2025-07-18T10:30:00Z",
  "description": "<h2>Markets Rally on Economic Hopes</h2><p>In a surprising turn of events, the stock markets showed a strong upward trend today...</p><h3>Investor Sentiments Improve</h3><p>Experts believe the rally is a result of...</p><p>Read more at <a href='https://example.com/news'>this link</a>.</p>",
  "image": "https://example.com/image.jpg",
  "category": "Business",
  "url": "https://originalnewsurl.com/article"
}

ORIGINAL NEWS ARTICLE TO REWRITE:
${JSON.stringify(news)}
`;
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response from Gemini');
    // Robust JSON parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ...news, author: '', image: news.image || '' };
    const jsonString = jsonMatch[0];
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.headline && parsed.description) {
      return { ...parsed, author: '' };
    } else {
      return { ...news, author: '', image: news.image || '' };
    }
  } catch (err: any) {
    console.error('Gemini SDK rewriter error:', err.message);
    return { ...news, author: '', image: news.image || '' };
  }
} 