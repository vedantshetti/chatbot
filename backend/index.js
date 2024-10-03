const express = require('express');
const multer = require('multer');
const axios = require('axios');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const path = require('path');

const app = express();
const port = 5000;

// Replace with your AssemblyAI API key
const assemblyAIKey = 'f077e8b6be294893bb9426c2dbc6b896';

// Create a client for the Text-to-Speech API
const client = new textToSpeech.TextToSpeechClient();

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

// Endpoint to handle the speech-to-text process
app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Upload the audio file to AssemblyAI
    const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', req.file.buffer, {
      headers: {
        'Authorization': assemblyAIKey,
        'Content-Type': 'application/json',
      },
    });

    const audioUrl = uploadResponse.data.upload_url;

    // Request transcription
    const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
      audio_url: audioUrl,
    }, {
      headers: {
        'Authorization': assemblyAIKey,
      },
    });

    // Wait for transcription to complete
    const transcriptId = transcriptResponse.data.id;

    // Polling for transcription completion
    let transcript;
    do {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3 seconds
      const transcriptResult = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': assemblyAIKey,
        },
      });
      transcript = transcriptResult.data;
    } while (transcript.status === 'processing');

    console.log('Transcription:', transcript.text);

    // Call Text-to-Speech API
    const ttsRequest = {
      input: { text: transcript.text },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    // Perform the Text-to-Speech request
    const [response] = await client.synthesizeSpeech(ttsRequest);
    
    // Send the audio back to the frontend
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);

  } catch (error) {
    console.error('Error processing the audio:', error);
    res.status(500).send('Error processing the audio.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
