import { useState, useEffect } from 'react';

export const useMediaStream = () => {
  const [stream, setStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initStream = async () => {
      try {
        // Stop any existing tracks before requesting new ones
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(newStream);
        setError(null);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setError(error.message);
      }
    };

    initStream();

    // Cleanup function to stop all tracks when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Remove stream from dependencies

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    toggleAudio,
    toggleVideo
  };
};