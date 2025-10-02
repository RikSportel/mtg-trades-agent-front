import React, { useRef, useEffect } from 'react';

// useSpeech.js
export function useSpeech({ onResult, onInterimResult, onStart, onEnd }) {
  const recognition = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Your browser doesn't support speech recognition"); 
      return;
    }

    recognition.current = new window.webkitSpeechRecognition();
    recognition.current.lang = 'en-US';
    recognition.current.interimResults = true;
    recognition.current.maxAlternatives = 1;

    recognition.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      if (onInterimResult && interimTranscript) onInterimResult(interimTranscript);
      if (onResult && finalTranscript) onResult(finalTranscript);
    };
    if (onStart) recognition.current.onstart = onStart;
    if (onEnd) recognition.current.onend = onEnd;
  }, [onResult, onInterimResult, onStart, onEnd]);

  return () => {
    if (recognition.current) {
      recognition.current.start();
    }
  };
}
