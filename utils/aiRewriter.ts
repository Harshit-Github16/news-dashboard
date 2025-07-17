import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: 'AIzaSyBY3JWyJ8rEyZDHvsvSBNQdKVUiYVeM2go' });

export async function rewriteNews(news: any) {
  const prompt = `
    You are a professional news editor. Rewrite the following news article.
    YOUR TASK:
    1.  Create a completely new, unique, and engaging headline.
    2.  Write a detailed, well-structured description between 300 and 500 words. The tone should be professional and human-like, not robotic.
    3.  Generate a new, creative image URL relevant to the content.
    4.  Set the author to 'Harshit Sharma'.
    5.  Keep the original 'category' and 'url'.

    YOU MUST OUTPUT ONLY A VALID JSON OBJECT, AND NOTHING ELSE. Do not include any text before or after the JSON.
    The JSON object must have these keys: "headline", "author", "time", "description", "image", "category", "url".

    EXAMPLE OUTPUT:
    {"headline": "New Creative Headline...", "author": "Harshit Sharma", "time": "...", "description": "A detailed description of 300-500 words...", "image": "https://...", "category": "...", "url": "..."}

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
    if (!jsonMatch) return { ...news, author: 'Harshit Sharma', image: news.image || '' };
    const jsonString = jsonMatch[0];
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.headline && parsed.description) {
      return { ...parsed, author: 'Harshit Sharma' };
    } else {
      return { ...news, author: 'Harshit Sharma', image: news.image || '' };
    }
  } catch (err: any) {
    console.error('Gemini SDK rewriter error:', err.message);
    return { ...news, author: 'Harshit Sharma', image: news.image || '' };
  }
} 