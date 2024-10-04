const express = require('express');
const multer = require('multer');
const axios = require('axios');
const AWS = require('aws-sdk'); // Add the AWS SDK
const fs = require('fs');

const cors = require('cors'); // Import cors

const app = express();
const port = 5000;
app.use(cors());


// Configure AWS SDK with your access keys from environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create a client for Polly
const polly = new AWS.Polly();

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

// Endpoint to handle the speech-to-text process
app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  console.log(req.file); // Log the uploaded file for debugging
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  } 

  try {
    // Log the file to see if it's coming through
    console.log('Uploaded file:', req.file);

    // Upload the audio file to AssemblyAI
    const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', req.file.buffer, {
      headers: {
        'Authorization': process.env.ASSEMBLYAI_KEY, // Ensure this is correctly set
        'Content-Type': 'application/json',
      },
    });
    

    const audioUrl = uploadResponse.data.upload_url;

    // Request transcription
    const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
      audio_url: audioUrl,
    }, {
      headers: {
        'Authorization': process.env.ASSEMBLYAI_KEY, // Use environment variable
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
          'Authorization': process.env.ASSEMBLYAI_KEY, // Use environment variable
        },
      });
      transcript = transcriptResult.data;
    } while (transcript.status === 'processing');

    console.log('Transcription:', transcript.text);

    // Call AWS Polly for Text-to-Speech
    const ttsParams = {
      Text: transcript.text,
      OutputFormat: 'mp3',
      VoiceId: 'Joanna', // Choose a voice
    };

    polly.synthesizeSpeech(ttsParams, (err, data) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).send('Error processing the audio.');
      } else if (data.AudioStream instanceof Buffer) {
        // Send the audio back to the frontend
        res.set('Content-Type', 'audio/mpeg');
        res.send(data.AudioStream);
      }
    });
  } catch (error) {
    console.error('Error processing the audio:', error.message || error);
    res.status(500).send('Error processing the audio.');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
