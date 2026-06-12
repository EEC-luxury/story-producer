export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body;
  const apiKey = req.headers['x-elevenlabs-key'];

  if (!apiKey) return res.status(401).json({ error: 'No ElevenLabs key provided.' });
  if (!text || text.trim().length === 0)
    return res.status(400).json({ error: 'text field is required.' });

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
        body: JSON.stringify({
          text: text.trim(),
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `ElevenLabs ${response.status}: ${errText}` });
    }
    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="voiceover.mp3"');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    res.status(500).json({ error: 'ElevenLabs request failed: ' + err.message });
  }
}
