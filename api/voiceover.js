export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, voiceId = 'pNInz6obpg7GgKO75B6p' } = req.body;
  const apiKey = req.headers['x-elevenlabs-key'];

  if (!apiKey) return res.status(401).json({ error: 'No ElevenLabs key provided.' });
  if (!text || text.trim().length === 0)
    return res.status(400).json({ error: 'text field is required.' });

  const tryVoices = [voiceId, '29vD33N1CtxCmqQRPOHJ', 'ErXwobaYiN019PkySvjV'];

  try {
    for (const vid of tryVoices) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${vid}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
          body: JSON.stringify({
            text: text.trim(),
            model_id: 'eleven_turbo_v2_5',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );
      if (response.status === 402 || response.status === 403) continue;
      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `ElevenLabs ${response.status}: ${errText}` });
      }
      const audioBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="voiceover.mp3"');
      return res.status(200).send(Buffer.from(audioBuffer));
    }
    return res.status(402).json({ error: 'All voices failed: free tier voice limit reached.' });
  } catch (err) {
    res.status(500).json({ error: 'ElevenLabs request failed: ' + err.message });
  }
}
