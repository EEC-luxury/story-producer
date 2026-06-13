export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text } = req.body;
  const apiKey = req.headers['x-elevenlabs-key'];

  if (!apiKey) return res.status(401).json({ error: 'No ElevenLabs key provided.' });
  if (!text || text.trim().length === 0)
    return res.status(400).json({ error: 'text field is required.' });

  // Voices confirmed working on free tier from request log:
  // ErXwobaYiN019PkySvjV = Antoni (14x 200 on Jun 7 — primary)
  // CwhRBWXzGAHq8TQ4Fs17 = your saved voice (fetched successfully multiple times — fallback)
  const tryVoices = ['ErXwobaYiN019PkySvjV', 'CwhRBWXzGAHq8TQ4Fs17'];

  try {
    for (const voiceId of tryVoices) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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
      if (response.status === 402 || response.status === 403 || response.status === 404) continue;
      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `ElevenLabs ${response.status}: ${errText}` });
      }
      const audioBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="voiceover.mp3"');
      return res.status(200).send(Buffer.from(audioBuffer));
    }
    return res.status(402).json({ error: 'All voices failed. Check your ElevenLabs key or free tier limits.' });
  } catch (err) {
    res.status(500).json({ error: 'ElevenLabs request failed: ' + err.message });
  }
}
