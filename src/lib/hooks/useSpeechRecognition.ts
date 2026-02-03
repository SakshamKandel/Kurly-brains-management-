import { useState, useEffect, useCallback, useRef } from "react";

export type SpeechLanguage = "en-US" | "hi-IN" | "ne-NP";

interface UseSpeechRecognitionReturn {
    isListening: boolean;
    transcript: string;
    startListening: (lang?: SpeechLanguage) => void;
    stopListening: () => void;
    resetTranscript: () => void;
    hasRecognitionSupport: boolean;
    error: string | null;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<any>(null); // Type 'any' because SpeechRecognition is not standard in all TS configs
    const finalTranscriptRef = useRef("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!window.isSecureContext) {
                setError("insecure-context");
                return;
            }
            // @ts-ignore - Vendor prefixes
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognitionInstance = new SpeechRecognition();
                recognitionInstance.continuous = true; // Keep listening until user stops
                recognitionInstance.interimResults = true;

                recognitionInstance.onresult = (event: any) => {
                    let interimTranscript = "";

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const chunk = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscriptRef.current += chunk;
                        } else {
                            interimTranscript += chunk;
                        }
                    }

                    const combined = (finalTranscriptRef.current + interimTranscript).trim();
                    if (combined) {
                        setTranscript(combined);
                    }
                    setError(null); // Clear error on successful result
                };

                recognitionInstance.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    if (event.error === 'network') {
                        setError("network"); // Specific network error
                    } else if (event.error === 'not-allowed') {
                        setError("permission");
                    } else if (event.error === 'service-not-allowed') {
                        setError("service-not-allowed");
                    } else if (event.error === 'no-speech') {
                        // Ignore no-speech, it just means silence
                        return;
                    } else {
                        setError(event.error);
                    }
                    setIsListening(false);
                };

                recognitionInstance.onend = () => {
                    setIsListening(false);
                };

                setRecognition(recognitionInstance);
            } else {
                setError("unsupported");
            }
        }
    }, []);

    const startListening = useCallback((lang?: SpeechLanguage) => {
        if (!recognition) {
            setError("unsupported");
            return;
        }
        if (!window.isSecureContext) {
            setError("insecure-context");
            return;
        }
        if (!navigator.onLine) {
            setError("offline");
            return;
        }
        if (recognition) {
            // If lang is provided, use it. Otherwise, let browser auto-detect or default to navigator.language.
            if (lang) {
                recognition.lang = lang;
            } else {
                // Try to remove lang property to reset to default, or set to navigator.language
                recognition.lang = navigator.language || "en-US";
            }

            try {
                setError(null);
                finalTranscriptRef.current = "";
                recognition.start();
                setIsListening(true);
                setTranscript("");
            } catch (e) {
                console.error("Failed to start recognition", e);
            }
        }
    }, [recognition]);

    const stopListening = useCallback(() => {
        if (recognition) {
            recognition.stop();
            setIsListening(false);
        }
    }, [recognition]);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setError(null);
    }, []);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        hasRecognitionSupport: !!recognition,
        error,
    };
}
