export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty text field.' });
  }

  // Accept key from request header (sent by client) or fall back to env variable
  const apiKey = req.headers['x-elevenlabs-key'] || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ error: 'No ElevenLabs API key provided.' });
  }

  try {
    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      return res.status(elevenRes.status).json({
        error: `ElevenLabs error ${elevenRes.status}: ${errText}`,
      });
    }

    // Stream audio bytes back to client
    const audioBuffer = await elevenRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="voiceover.mp3"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(Buffer.from(audioBuffer));

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal proxy error: ' + err.message });
  }
         }
          
