export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { history, systemInstruction } = req.body;
  const apiKey = req.headers['x-gemini-key'];

  if (!apiKey) return res.status(401).json({ error: 'No Gemini key provided.' });
  if (!Array.isArray(history) || history.length === 0)
    return res.status(400).json({ error: 'history array is required.' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: history,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Gemini ${response.status}: ${err}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Gemini request failed: ' + err.message });
  }
}
