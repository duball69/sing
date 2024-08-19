import React from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto"; // Automatically register all components

const PitchVisualizer = ({ micNoteRanges = [], mp3NoteRanges = [] }) => {
  // Prepare data for the chart
  const chartData = {
    labels: Array.from(
      new Set([...micNoteRanges, ...mp3NoteRanges].map((point) => point.time))
    ), // Unique time points on x-axis
    datasets: [
      {
        label: "MP3 Frequency (Hz)",
        data: mp3NoteRanges.map((point) => ({
          x: point.time,
          y: point.frequency,
        })), // MP3 Frequency on y-axis
        borderColor: "rgba(0, 153, 255, 1)",
        backgroundColor: "rgba(0, 153, 255, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 3,
        lineTension: 0.2, // Adjust for a smoother curve
      },
      {
        label: "Microphone Frequency (Hz)",
        data: micNoteRanges.map((point) => ({
          x: point.time,
          y: point.frequency,
        })), // Microphone Frequency on y-axis
        borderColor: "rgba(255, 102, 0, 1)",
        backgroundColor: "rgba(255, 102, 0, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 3,
        lineTension: 0.2, // Adjust for a smoother curve
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: false,
          text: "Time (s)",
        },
      },
      y: {
        title: {
          display: false,
          text: "Frequency (Hz)",
        },
        suggestedMin: 0,
        suggestedMax: 1000, // Adjust max frequency if needed
      },
    },
    elements: {
      point: {
        radius: 3,
        backgroundColor: "rgba(75, 192, 192, 1)",
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  return (
    <div style={{ backgroundColor: "rgba(0, 0, 0, 0.3)", padding: "100px" }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default PitchVisualizer;
