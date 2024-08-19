// PitchChart.js
import React from "react";
import { Line } from "react-chartjs-2";

const PitchChart = ({ chartData }) => {
  return (
    <div style={{ marginTop: "20px", width: "100%", height: "300px" }}>
      <Line
        data={chartData}
        options={{
          responsive: true,
          scales: {
            x: {
              type: "linear",
              position: "bottom",
              title: {
                display: true,
                text: "Time (s)",
              },
            },
            y: {
              title: {
                display: true,
                text: "Pitch (Hz)",
              },
            },
          },
        }}
      />
    </div>
  );
};

export default PitchChart;
