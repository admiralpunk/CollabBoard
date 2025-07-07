import { useState, useEffect, useRef } from 'react';

export const useMediaStream = () => {
  const [stream, setStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const initStream = async () => {
      try {
        // Removed console.log('[useMediaStream] Requesting media permissions...');
        
        // Stop any existing tracks before requesting new ones
        if (streamRef.current) {
          // Removed console.log('[useMediaStream] Stopping existing tracks...');
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        // Removed console.log('[useMediaStream] Got media stream:', newStream.id);
        streamRef.current = newStream;
        setStream(newStream);
        setError(null);
      } catch (error) {
        // Removed console.error('[useMediaStream] Error accessing media devices:', error);
        setError(error.message);
      }
    };

    initStream();

    // Cleanup function to stop all tracks when component unmounts
    return () => {
      if (streamRef.current) {
        // Removed console.log('[useMediaStream] Cleanup: stopping tracks...');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []); // Empty dependency array

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

  const stopStream = () => {
    if (streamRef.current) {
      console.log('[useMediaStream] stopStream called');
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      streamRef.current = null;
      setStream(null);
    }
  };

  return {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    toggleAudio,
    toggleVideo,
    stopStream
  };
};