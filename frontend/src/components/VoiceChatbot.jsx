import React, { useState } from 'react';
import { ReactMic } from 'react-mic';

const VoiceChatbot = () => {
  const [recording, setRecording] = useState(false);
  const [blobURL, setBlobURL] = useState(null);

  const startRecording = () => {
    setRecording(true);
  };

  const stopRecording = async () => {
    setRecording(false);
  };

  const onData = (recordedBlob) => {
    console.log('chunk of real-time data is: ', recordedBlob);
  };

  const onStop = async (recordedBlob) => {
    console.log('recordedBlob is: ', recordedBlob);
    setBlobURL(URL.createObjectURL(recordedBlob.blob));

    const formData = new FormData();
    formData.append('audio', recordedBlob.blob);

    try {
      const response = await fetch('http://localhost:5000/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const audioData = await response.blob();
      const audioUrl = URL.createObjectURL(audioData);

      const audio = new Audio(audioUrl);
      audio.play();
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
      {blobURL && <audio src={blobURL} controls="controls" />}
    </div>
  );
};

export default VoiceChatbot;
