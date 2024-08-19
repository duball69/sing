// utils.js
import { fft, util as fftUtil } from "fft-js";

// Define note frequencies for notes A to G
export const generateNoteFrequencies = () => {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const noteNames = ["La", "Si", "Do", "Re", "Mi", "Fa", "Sol"];
  const frequencies = {};
  let octave = 0;
  let frequency = C0;

  while (frequency <= 900) {
    noteNames.forEach((note, index) => {
      frequencies[`${note}${octave}`] = frequency * Math.pow(2, index / 12);
    });
    frequency *= 2;
    octave += 1;
  }

  return frequencies;
};

export const noteFrequencies = generateNoteFrequencies();

export const detectPitchFFT = (dataArray, sampleRate) => {
  const phasors = fft(dataArray);
  const magnitudes = fftUtil.fftMag(phasors);
  const frequencies = fftUtil.fftFreq(phasors, sampleRate);

  // Find the peak frequency
  const maxMagnitude = Math.max(...magnitudes);
  const indexOfMax = magnitudes.indexOf(maxMagnitude);

  return frequencies[indexOfMax];
};

export const frequencyToNote = (frequency) => {
  if (frequency <= 0) return "Unknown";

  // Find the closest note
  const notes = Object.keys(noteFrequencies);
  const closestNote = notes.reduce((prev, curr) =>
    Math.abs(noteFrequencies[curr] - frequency) <
    Math.abs(noteFrequencies[prev] - frequency)
      ? curr
      : prev
  );

  return closestNote;
};
