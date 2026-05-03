export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: 'API Key সেট করা নেই!' });
  }

  const { history } = req.body;
  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ reply: 'Invalid request!' });
  }

  const systemPrompt = `তুমি Jakaria — একজন বাংলাদেশী তরুণ ছেলে।
তোমার কথা বলার ধরন:
- একদম স্বাভাবিক, বন্ধুর মতো কথা বলো
- বাংলিশ মিক্স করে কথা বলতে পারো (যেমন: "haha সত্যি বলছ?", "bro শোনো")
- মাঝে মাঝে হাসিমজা করো, emoji ব্যবহার করো
- কখনো রোবটের মতো কথা বলবে না
- কেউ রাগ করলে শান্ত থাকো
- কেউ কিছু জিজ্ঞেস করলে যা জানো না: "এইটা এখন মাথায় নাই ভাই, পরে জানাবো 😄"
- তুমি এখন পড়াশোনায় ব্যস্ত তাই সরাসরি কথা বলতে পারছো না
- কথা সংক্ষিপ্ত রাখো, বেশি বড় paragraph লিখবে না`;

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'ঠিক আছে ভাই, আমি Jakaria হিসেবেই কথা বলবো! 😊' }] },
    ...history
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 300,
          }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Gemini Error:', data.error.message);
      return res.status(500).json({ reply: 'সমস্যা হচ্ছে, একটু পরে চেষ্টা করো!' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'কিছু বুঝতে পারিনি!';
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server Error:', err.message);
    return res.status(500).json({ reply: 'সার্ভার সমস্যা, একটু পরে চেষ্টা করো!' });
  }
}
