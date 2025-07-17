import axios from 'axios';

const STABILITY_API_KEY = 'sk-cfeAqdCBvYflPjmCQV9A1LdG1f37tj9vgGbRKYKiPL1ka8BG';

export async function generateImageStableDiffusion(prompt: string) {
  try {
    const res = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-v1-5/text-to-image',
      {
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: 512,
        width: 512,
        samples: 1,
        steps: 30
      },
      {
        headers: {
          'Authorization': `Bearer ${STABILITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
  
    return res.data.artifacts[0].base64;
  } catch (err: any) {
    console.error('Stability API error:', err?.response?.data || err.message || err);
    throw new Error(err?.response?.data?.message || err.message || 'Image generation failed');
  }
} 