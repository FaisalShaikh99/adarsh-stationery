"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Reusable voice search hook wrapping browser native Web Speech API.
 * @param {string} locale - Speech recognition language locale (default en-IN)
 */
export default function useVoiceSearch(locale = "en-IN") {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Feature detection for native SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false; // stops listening when user stops speaking
      rec.interimResults = false; // only final transcripts
      rec.lang = locale;
      recognitionRef.current = rec;
    }
  }, [locale]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    setError(null);
    setTranscript("");
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Failed to start Speech Recognition:", e);
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    setIsListening(false);
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error("Failed to stop Speech Recognition:", e);
    }
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported || !recognitionRef.current) return;

    const rec = recognitionRef.current;

    const onResult = (event) => {
      const resultText = event.results[0]?.[0]?.transcript || "";
      setTranscript(resultText);
      setIsListening(false);
    };

    const onError = (event) => {
      console.error("Speech Recognition Error:", event.error);
      setError(event.error);
      setIsListening(false);
    };

    const onEnd = () => {
      setIsListening(false);
    };

    rec.addEventListener("result", onResult);
    rec.addEventListener("error", onError);
    rec.addEventListener("end", onEnd);

    return () => {
      rec.removeEventListener("result", onResult);
      rec.removeEventListener("error", onError);
      rec.removeEventListener("end", onEnd);
    };
  }, [isSupported]);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  };
}
