import React, { useState } from 'react';
import { ReactMic } from 'react-mic';
import './VoiceChatbot.css';

const VoiceChatbot = () => {
  const [recording, setRecording] = useState(false);
  const [blobURL, setBlobURL] = useState(null);
  const [transcript, setTranscript] = useState(''); // State for the transcribed text

  const startRecording = () => {
    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
  };

  const onData = (recordedBlob) => {
    console.log('chunk of real-time data is: ', recordedBlob);
  };

  const onStop = async (recordedBlob) => {
    console.log('recordedBlob is: ', recordedBlob);
      
    // Create a URL for the recorded audio blob
    const audioBlob = new Blob([recordedBlob.blob], { type: 'audio/webm' }); // Change to 'audio/webm'
    const audioUrl = URL.createObjectURL(audioBlob);
    setBlobURL(audioUrl);
  
    const formData = new FormData();
    formData.append('audio', audioBlob); // Change to 'audioBlob'
  
    // Remaining code...
  
  
    try {
      const response = await fetch('http://localhost:5000/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json(); // Expecting JSON response
      console.log('Transcribed text:', data.text); // Log the transcribed text
      setTranscript(data.text); // Set the transcript state

      // Play audio directly after creating the object URL
      const audioData = await response.blob(); // Assuming you want to handle audio as well
      const responseAudioUrl = URL.createObjectURL(audioData);
      const audio = new Audio(responseAudioUrl);
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
      });

    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h1>Voice Chatbot</h1>
      <ReactMic
        record={recording}
        className="sound-wave"
        onStop={onStop}
        onData={onData}
        strokeColor="#000000"
        backgroundColor="#FF4081"
      />
      <div>
        <button onClick={startRecording} type="button">
          Start Recording
        </button>
        <button onClick={stopRecording} type="button">
          Stop Recording
        </button>
      </div>
      {blobURL && <audio src={blobURL} controls="controls" autoPlay />}
      
      {/* New area for displaying transcribed text */}
      <div className="transcript-area">
        {transcript ? (
          <p>Transcribed Text: {transcript}</p>
        ) : (
          <p>No transcription available.</p>
        )}
      </div>
    </div>
  );
};

export default VoiceChatbot;
