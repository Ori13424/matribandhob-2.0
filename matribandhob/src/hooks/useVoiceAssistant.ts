
import { useState, useRef, useEffect, useCallback } from "react";

interface UseVoiceAssistantProps {
    lang: 'en' | 'bn';
    onResult?: (text: string) => void;
    autoSend?: boolean;
}

export function useVoiceAssistant({ lang, onResult, autoSend = false }: UseVoiceAssistantProps) {
    const [isListening, setIsListening] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startListening = useCallback(() => {
        setErrorMsg("");
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = lang === 'bn' ? 'bn-IN' : 'en-US';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true; // Changed to true for faster feedback

            recognitionRef.current.onstart = () => setIsListening(true);

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    // @ts-ignore
                    .map(result => result[0].transcript)
                    .join('');

                if (event.results[0].isFinal) {
                    if (onResult) onResult(transcript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                setIsListening(false);
                if (event.error === 'not-allowed') setErrorMsg("Please allow microphone access.");
                console.error("Speech Recognition Error:", event.error);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.start();
        } else {
            setErrorMsg("Voice not supported in this browser.");
        }
    }, [lang, onResult]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const playTTS = async (text: string, language: string) => {
        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                body: JSON.stringify({ text, language }),
            });
            const data = await res.json();
            if (data.audio) {
                if (audioRef.current) audioRef.current.pause();
                audioRef.current = new Audio(`data:audio/mp3;base64,${data.audio}`);
                audioRef.current.play();
            }
        } catch (e) { console.error(e); }
    };

    return {
        isListening,
        errorMsg,
        startListening,
        stopListening,
        playTTS
    };
}
