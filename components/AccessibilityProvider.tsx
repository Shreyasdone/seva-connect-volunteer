'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  fontSize: number;
  highContrast: boolean;
  colorBlindMode: string;
  ttsEnabled: boolean;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleHighContrast: () => void;
  setColorBlindMode: (mode: string) => void;
  toggleTTS: () => void;
}

const defaultContext: AccessibilityContextType = {
  fontSize: 100,
  highContrast: false,
  colorBlindMode: 'none',
  ttsEnabled: false,
  increaseFontSize: () => {},
  decreaseFontSize: () => {},
  toggleHighContrast: () => {},
  setColorBlindMode: () => {},
  toggleTTS: () => {},
};

const AccessibilityContext = createContext<AccessibilityContextType>(defaultContext);

export const useAccessibility = () => useContext(AccessibilityContext);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState('none');
  const [ttsEnabled, setTtsEnabled] = useState(false);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFontSize(settings.fontSize || 100);
      setHighContrast(settings.highContrast || false);
      setColorBlindMode(settings.colorBlindMode || 'none');
      setTtsEnabled(settings.ttsEnabled || false);
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem(
      'accessibilitySettings',
      JSON.stringify({
        fontSize,
        highContrast,
        colorBlindMode,
        ttsEnabled,
      })
    );

    // Apply global CSS variable for font size
    document.documentElement.style.setProperty('--accessibility-font-size', `${fontSize}%`);
    
    // Apply high contrast class
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Apply color blind filter
    document.documentElement.setAttribute('data-color-blind-mode', colorBlindMode);
  }, [fontSize, highContrast, colorBlindMode, ttsEnabled]);

  // Functions to modify settings
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 10, 200));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 10, 70));
  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleTTS = () => setTtsEnabled(prev => !prev);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        highContrast,
        colorBlindMode,
        ttsEnabled,
        increaseFontSize,
        decreaseFontSize,
        toggleHighContrast,
        setColorBlindMode,
        toggleTTS,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
} 