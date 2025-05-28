import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

type Sound = {
  id: string;
  title: string;
  type: 'white' | 'rain' | 'ocean' | 'lullaby';
};

type WhiteNoiseContextType = {
  isPlaying: boolean;
  currentSound: Sound | null;
  timer: number;
  playSound: (sound: Sound) => void;
  stopSound: () => void;
  setTimer: (minutes: number) => void;
};

const WhiteNoiseContext = createContext<WhiteNoiseContextType | undefined>(undefined);

let audioContext: AudioContext | null = null;
let sourceNode: AudioBufferSourceNode | OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let oscillatorNode: OscillatorNode | null = null;
let modulationNode: OscillatorNode | null = null;
let waveGain: GainNode | null = null;
let noiseGain: GainNode | null = null;
let melodyInterval: NodeJS.Timeout | null = null;

if (Platform.OS === 'web') {
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  gainNode = audioContext.createGain();
  filterNode = audioContext.createBiquadFilter();
  gainNode.connect(audioContext.destination);
}

function createWhiteNoise() {
  if (!audioContext || !gainNode || !filterNode) return null;

  const bufferSize = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  filterNode.type = 'bandpass';
  filterNode.frequency.value = 1000;
  filterNode.Q.value = 0.5;

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  source.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.gain.value = 0.15;

  return source;
}

function createRainSound() {
  if (!audioContext || !gainNode || !filterNode) return null;

  const bufferSize = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const dropIntensity = Math.random() < 0.1 ? 0.8 : 0.2;
    data[i] = (Math.random() * 2 - 1) * dropIntensity;
  }

  filterNode.type = 'bandpass';
  filterNode.frequency.value = 2500;
  filterNode.Q.value = 0.2;

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  source.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.gain.value = 0.2;

  return source;
}

function createOceanWaves() {
  if (!audioContext || !gainNode || !filterNode) return null;

  // Clean up any existing nodes
  if (oscillatorNode) {
    oscillatorNode.stop();
    oscillatorNode.disconnect();
  }
  if (modulationNode) {
    modulationNode.stop();
    modulationNode.disconnect();
  }
  if (waveGain) {
    waveGain.disconnect();
  }
  if (noiseGain) {
    noiseGain.disconnect();
  }

  // Create new nodes
  oscillatorNode = audioContext.createOscillator();
  modulationNode = audioContext.createOscillator();
  waveGain = audioContext.createGain();
  noiseGain = audioContext.createGain();

  // Configure oscillators
  oscillatorNode.type = 'sine';
  oscillatorNode.frequency.setValueAtTime(0.1, audioContext.currentTime);
  modulationNode.type = 'sine';
  modulationNode.frequency.setValueAtTime(0.05, audioContext.currentTime);

  // Create wave texture
  const bufferSize = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 0.3;
  }

  // Configure filter
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 400;
  filterNode.Q.value = 0.7;

  // Create and configure source
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Connect nodes
  oscillatorNode.connect(waveGain);
  modulationNode.connect(waveGain.gain);
  source.connect(noiseGain);
  waveGain.connect(filterNode);
  noiseGain.connect(filterNode);
  filterNode.connect(gainNode);

  // Set gains
  waveGain.gain.value = 0.5;
  noiseGain.gain.value = 0.3;
  gainNode.gain.value = 0.25;

  // Start oscillators
  oscillatorNode.start();
  modulationNode.start();

  return source;
}

function createLullaby() {
  if (!audioContext || !gainNode || !filterNode) return null;

  // Clean up any existing nodes
  if (oscillatorNode) {
    oscillatorNode.stop();
    oscillatorNode.disconnect();
  }
  if (modulationNode) {
    modulationNode.stop();
    modulationNode.disconnect();
  }
  if (melodyInterval) {
    clearInterval(melodyInterval);
  }

  // Create new nodes
  oscillatorNode = audioContext.createOscillator();
  modulationNode = audioContext.createOscillator();
  const melodyGain = audioContext.createGain();
  const modGain = audioContext.createGain();

  // Configure oscillators
  oscillatorNode.type = 'sine';
  modulationNode.type = 'sine';
  modulationNode.frequency.setValueAtTime(0.2, audioContext.currentTime);

  // Configure filter
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 800;
  filterNode.Q.value = 0.5;

  // Connect nodes
  oscillatorNode.connect(melodyGain);
  modulationNode.connect(modGain);
  modGain.connect(melodyGain.gain);
  melodyGain.connect(filterNode);
  filterNode.connect(gainNode);

  // Set gains
  melodyGain.gain.value = 0.3;
  modGain.gain.value = 0.1;
  gainNode.gain.value = 0.2;

  // Start modulation
  modulationNode.start();

  // Create melody pattern
  const notes = [262, 294, 330, 349, 392, 440, 494, 523];
  let noteIndex = 0;

  melodyInterval = setInterval(() => {
    if (oscillatorNode) {
      oscillatorNode.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
      noteIndex = (noteIndex + 1) % notes.length;
    }
  }, 1000);

  oscillatorNode.start();
  return oscillatorNode;
}

export function WhiteNoiseProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [timer, setTimer] = useState(30);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      stopSound();
    };
  }, []);

  const playSound = (sound: Sound) => {
    if (!audioContext) return;

    // Stop any currently playing sound
    stopSound();

    // Resume audio context if it's suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create appropriate sound based on type
    switch (sound.type) {
      case 'white':
        sourceNode = createWhiteNoise();
        break;
      case 'rain':
        sourceNode = createRainSound();
        break;
      case 'ocean':
        sourceNode = createOceanWaves();
        break;
      case 'lullaby':
        sourceNode = createLullaby();
        break;
    }

    if (sourceNode) {
      if (sourceNode instanceof AudioBufferSourceNode) {
        sourceNode.start();
      }
      setIsPlaying(true);
      setCurrentSound(sound);

      // Set timer to stop sound
      if (timeoutId) clearTimeout(timeoutId);
      const newTimeoutId = setTimeout(() => {
        stopSound();
      }, timer * 60 * 1000);
      setTimeoutId(newTimeoutId);
    }
  };

  const stopSound = () => {
    if (sourceNode) {
      try {
        if (sourceNode instanceof AudioBufferSourceNode) {
          sourceNode.stop();
          sourceNode.disconnect();
        } else {
          sourceNode.stop();
          sourceNode.disconnect();
        }
      } catch (e) {
        // Ignore errors if sound is already stopped
      }
      sourceNode = null;
    }
    if (oscillatorNode) {
      oscillatorNode.stop();
      oscillatorNode.disconnect();
      oscillatorNode = null;
    }
    if (modulationNode) {
      modulationNode.stop();
      modulationNode.disconnect();
      modulationNode = null;
    }
    if (waveGain) {
      waveGain.disconnect();
      waveGain = null;
    }
    if (noiseGain) {
      noiseGain.disconnect();
      noiseGain = null;
    }
    if (melodyInterval) {
      clearInterval(melodyInterval);
      melodyInterval = null;
    }
    setIsPlaying(false);
    setCurrentSound(null);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  const updateTimer = (minutes: number) => {
    setTimer(minutes);
    if (isPlaying && currentSound) {
      // Restart the timer with new duration
      if (timeoutId) clearTimeout(timeoutId);
      const newTimeoutId = setTimeout(() => {
        stopSound();
      }, minutes * 60 * 1000);
      setTimeoutId(newTimeoutId);
    }
  };

  return (
    <WhiteNoiseContext.Provider
      value={{
        isPlaying,
        currentSound,
        timer,
        playSound,
        stopSound,
        setTimer: updateTimer,
      }}>
      {children}
    </WhiteNoiseContext.Provider>
  );
}

export function useWhiteNoiseContext() {
  const context = useContext(WhiteNoiseContext);
  if (context === undefined) {
    throw new Error('useWhiteNoiseContext must be used within a WhiteNoiseProvider');
  }
  return context;
}