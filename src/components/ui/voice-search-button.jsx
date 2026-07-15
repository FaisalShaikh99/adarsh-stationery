"use client";

import { useEffect } from "react";
import { Mic } from "lucide-react";
import useVoiceSearch from "@/hooks/useVoiceSearch";
import { toast } from "sonner";

/**
 * Reusable Voice Search micro-animated mic button.
 * @param {Function} onResult - Callback triggered when transcript is finalized.
 * @param {string} className - Optional styling classes.
 */
export default function VoiceSearchButton({ onResult, className = "" }) {
  const { 
    isSupported, 
    isListening, 
    transcript, 
    error, 
    startListening, 
    stopListening 
  } = useVoiceSearch("en-IN");

  // Fire callback on successful transcription
  useEffect(() => {
    if (transcript) {
      onResult(transcript);
    }
  }, [transcript, onResult]);

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

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${
        isListening
          ? "bg-red-500/25 text-red-500 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.25)] animate-pulse"
          : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 border border-zinc-750"
      } ${className}`}
      title={isListening ? "Listening... Click to stop" : "Voice Search (en-IN)"}
    >
      <Mic className={`w-4 h-4 ${isListening ? "scale-110" : ""}`} />
      
      {isListening && (
        <span className="absolute -inset-0.5 rounded-xl border border-red-500/30 animate-ping pointer-events-none" />
      )}
    </button>
  );
}
