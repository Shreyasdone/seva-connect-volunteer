'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { 
  Accessibility, 
  PlusCircle, 
  MinusCircle, 
  Sun, 
  Palette, 
  VolumeX, 
  Volume2 
} from 'lucide-react';
// import TTSTest from './TTSTest';

const KeyboardShortcuts = {
  TOGGLE_MENU: {
    mac: '⌘+J',
    windows: 'Ctrl+J',
  },
  INCREASE_FONT: {
    mac: '⌘+Plus',
    windows: 'Ctrl+Plus',
  },
  DECREASE_FONT: {
    mac: '⌘+Minus',
    windows: 'Ctrl+Minus',
  },
  HIGH_CONTRAST: {
    mac: '⌘+H',
    windows: 'Ctrl+H',
  },
  TOGGLE_TTS: {
    mac: '⌘+T',
    windows: 'Ctrl+T',
  },
};

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { 
    fontSize, 
    highContrast, 
    colorBlindMode, 
    ttsEnabled,
    increaseFontSize,
    decreaseFontSize,
    toggleHighContrast,
    setColorBlindMode,
    toggleTTS
  } = useAccessibility();

  // Detect OS for keyboard shortcuts
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle menu: Cmd+J (Mac) / Ctrl+J (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (isOpen) {
        // Increase font size: Cmd/Ctrl + Plus
        if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
          e.preventDefault();
          increaseFontSize();
        }
        
        // Decrease font size: Cmd/Ctrl + Minus
        if ((e.metaKey || e.ctrlKey) && e.key === '-') {
          e.preventDefault();
          decreaseFontSize();
        }
        
        // Toggle high contrast: Cmd/Ctrl + H
        if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
          e.preventDefault();
          toggleHighContrast();
        }
        
        // Toggle text-to-speech: Cmd/Ctrl + T
        if ((e.metaKey || e.ctrlKey) && e.key === 't') {
          e.preventDefault();
          toggleTTS();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, increaseFontSize, decreaseFontSize, toggleHighContrast, toggleTTS]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Text-to-speech functionality
  useEffect(() => {
    let speechUtterance: SpeechSynthesisUtterance | null = null;
    let speakTimeout: NodeJS.Timeout | null = null;
    
    // Check if speech synthesis is available
    const isSpeechAvailable = 'speechSynthesis' in window;
    
    const handleTextHover = (e: MouseEvent) => {
      if (!ttsEnabled || !isSpeechAvailable) return;
      
      const target = e.target as HTMLElement;
      
      // Skip elements that are too small or are already highlighted
      if (!target.textContent || 
          target.textContent.trim() === '' || 
          target.classList.contains('tts-highlight') ||
          target.tagName === 'BUTTON' ||
          target.closest('button')) {
        return;
      }
      
      // Add a highlight class
      target.classList.add('tts-highlight');
      
      // Clear any existing timeout
      if (speakTimeout) {
        clearTimeout(speakTimeout);
      }
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create a small delay to prevent rapid firing
      speakTimeout = setTimeout(() => {
        try {
          // Create a new utterance
          speechUtterance = new SpeechSynthesisUtterance(target.textContent || '');
          
          // Set language to match page
          speechUtterance.lang = document.documentElement.lang || 'en-US';
          
          // Set speech rate slightly faster
          speechUtterance.rate = 1.1;
          
          // Only speak if the text has content
          if (target.textContent && target.textContent.trim() !== '') {
            console.log('Speaking text:', target.textContent.trim());
            window.speechSynthesis.speak(speechUtterance);
          }
        } catch (error) {
          console.error('Speech synthesis error:', error);
        }
      }, 200);
    };
    
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      target.classList.remove('tts-highlight');
      
      // Clear timeout if exists
      if (speakTimeout) {
        clearTimeout(speakTimeout);
        speakTimeout = null;
      }
      
      // Cancel speech when mouse leaves
      if (isSpeechAvailable) {
        window.speechSynthesis.cancel();
      }
    };
    
    // Speech synthesis onend event handler
    const handleSpeechEnd = () => {
      // Remove highlight from all elements when speech ends
      document.querySelectorAll('.tts-highlight').forEach(el => {
        el.classList.remove('tts-highlight');
      });
    };
    
    if (ttsEnabled && isSpeechAvailable) {
      // Check if speech synthesis is ready
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          console.log('Speech voices loaded:', window.speechSynthesis.getVoices().length);
        };
      }
      
      document.addEventListener('mouseover', handleTextHover);
      document.addEventListener('mouseout', handleMouseOut);
      
      // Add onend event listener for utterance
      if (speechUtterance) {
        speechUtterance.onend = handleSpeechEnd;
      }
    }
    
    return () => {
      document.removeEventListener('mouseover', handleTextHover);
      document.removeEventListener('mouseout', handleMouseOut);
      
      if (speakTimeout) {
        clearTimeout(speakTimeout);
      }
      
      if (isSpeechAvailable) {
        window.speechSynthesis.cancel();
      }
    };
  }, [ttsEnabled]);

  return (
    <div 
      ref={menuRef}
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
    >
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-2 flex flex-col gap-3 w-64">
          <div className="text-lg font-semibold mb-2">Accessibility Settings</div>
          
          {/* Font Size Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={decreaseFontSize}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Decrease font size"
              >
                <MinusCircle size={18} />
              </button>
              <span>Font Size: {fontSize}%</span>
              <button
                onClick={increaseFontSize}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Increase font size"
              >
                <PlusCircle size={18} />
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {isMac ? KeyboardShortcuts.INCREASE_FONT.mac : KeyboardShortcuts.INCREASE_FONT.windows}
            </span>
          </div>
          
          {/* High Contrast Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleHighContrast}
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                highContrast 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              aria-label="Toggle high contrast"
            >
              <Sun size={18} />
              <span>High Contrast</span>
            </button>
            <span className="text-xs text-gray-500">
              {isMac ? KeyboardShortcuts.HIGH_CONTRAST.mac : KeyboardShortcuts.HIGH_CONTRAST.windows}
            </span>
          </div>
          
          {/* Color Blindness Filter */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Palette size={18} />
              <span>Color Blindness Filter</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { id: 'none', label: 'None' },
                { id: 'protanopia', label: 'Protanopia' },
                { id: 'deuteranopia', label: 'Deuteranopia' },
                { id: 'tritanopia', label: 'Tritanopia' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setColorBlindMode(filter.id)}
                  className={`px-2 py-1 text-sm rounded-md ${
                    colorBlindMode === filter.id
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                  aria-label={`Set color filter to ${filter.label}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Text-to-Speech Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleTTS}
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                ttsEnabled 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              aria-label="Toggle text-to-speech"
            >
              {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span>Text-to-Speech</span>
            </button>
            <span className="text-xs text-gray-500">
              {isMac ? KeyboardShortcuts.TOGGLE_TTS.mac : KeyboardShortcuts.TOGGLE_TTS.windows}
            </span>
          </div>

          {/* TTS Test Component */}
          {/* {ttsEnabled && <TTSTest />} */}
        </div>
      )}
      
      {/* Floating Accessibility Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors flex items-center gap-2"
        aria-label="Accessibility Menu"
      >
        <Accessibility size={20} />
        {!isOpen && <span className="text-sm">Accessibility</span>}
        <span className="text-xs ml-1">
          {isMac ? KeyboardShortcuts.TOGGLE_MENU.mac : KeyboardShortcuts.TOGGLE_MENU.windows}
        </span>
      </button>
    </div>
  );
} 