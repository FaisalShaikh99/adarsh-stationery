"use client";

import { useEffect, useState, useRef } from "react";
import { Mic } from "lucide-react";
import useVoiceSearch from "@/hooks/useVoiceSearch";
import { toast } from "sonner";

/**
 * Reusable Voice Search micro-animated mic button.
 * @param {Function} onResult - Callback triggered when transcript is finalized.
 * @param {string} className - Optional styling classes.
 */
export default function VoiceSearchButton({ onResult, className = "" }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { 
    isSupported, 
    isListening, 
    transcript, 
    error, 
    startListening, 
    stopListening 
  } = useVoiceSearch("en-IN");

  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Fire callback on successful transcription
  useEffect(() => {
    if (transcript) {
      onResultRef.current(transcript);
    }
  }, [transcript]);

  // Gracefully toast Speech API errors
  useEffect(() => {
    if (error) {
      if (error === "not-allowed") {
        toast.error("Microphone access denied, please enable it in browser settings.");
      } else if (error === "no-speech") {
        toast.warning("No speech detected. Please try again.");
      } else {
        toast.error(`Voice recognition error: ${error}`);
      }
    }
  }, [error]);

  if (!mounted || !isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`relative inline-flex items-center justify-center p-2 rounded-full transition-all duration-300 bg-transparent border-none outline-none ${
        isListening
          ? "text-red-500 scale-110"
          : "text-zinc-500 hover:text-zinc-300"
      } ${className}`}
      title={isListening ? "Listening... Click to stop" : "Voice Search (en-IN)"}
    >
      <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      
      {isListening && (
        <span className="absolute inset-1 rounded-full border border-red-500/30 animate-ping pointer-events-none" />
      )}
    </button>
  );
}
