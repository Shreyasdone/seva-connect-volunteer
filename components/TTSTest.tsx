'use client';

import { useState, useEffect } from 'react';

export default function TTSTest() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [testMessage, setTestMessage] = useState('This is a test of the speech synthesis functionality');
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSpeechSupported(false);
      return;
    }

    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(testMessage);
      
      // Set the selected voice if available
      if (selectedVoice) {
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      }
      
      // Event handlers
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Failed to speak:', error);
    }
  };

  if (!speechSupported) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 rounded mb-4">
        <p>Speech synthesis is not supported in your browser.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
      <h3 className="text-lg font-semibold mb-3">Text-to-Speech Test</h3>
      
      <div className="mb-3">
        <label htmlFor="testMessage" className="block mb-1">Test message:</label>
        <textarea 
          id="testMessage"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="w-full p-2 border rounded dark:bg-gray-700"
          rows={2}
        />
      </div>
      
      <div className="mb-3">
        <label htmlFor="voiceSelect" className="block mb-1">Select voice:</label>
        <select 
          id="voiceSelect"
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          className="w-full p-2 border rounded dark:bg-gray-700"
        >
          {voices.map(voice => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang}) {voice.default ? '- Default' : ''}
            </option>
          ))}
        </select>
      </div>
      
      <button
        onClick={handleSpeak}
        disabled={isSpeaking}
        className={`px-4 py-2 rounded-md ${
          isSpeaking 
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {isSpeaking ? 'Speaking...' : 'Test Speech'}
      </button>
      
      <div className="mt-3 text-sm">
        <p>Available voices: {voices.length}</p>
        <p className="mt-1">
          Note: If you don't hear anything, check if your browser has permissions to play audio.
        </p>
      </div>
    </div>
  );
} 