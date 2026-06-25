import type { FrequencyResponse } from "../../types/filter";
import { downloadCSV }          from "../../utils/download";

interface Props {
  freqResponse: FrequencyResponse;
  freqUnit:     string;
}

export function FrequencyDataTable({ freqResponse, freqUnit }: Props) {
  const fLabel = freqUnit === "hz" ? "Hz" : "rad/s";

  const handleDownload = () => {
    const rows = [
      [`Frequency (${fLabel})`, "Magnitude (dB)", "Phase (deg)", "Group Delay (s)"],
      ...freqResponse.frequency.map((f, i) => [
        f.toFixed(6),
        freqResponse.magnitude_db[i].toFixed(6),
        freqResponse.phase_deg[i].toFixed(6),
        freqResponse.group_delay[i].toFixed(9),
      ]),
    ];
    downloadCSV(rows, "filter_frequency_response");
  };

  return (
    <div className="data-table-root">
      <div className="table-actions">
        <button className="icon-btn" onClick={handleDownload}>
          💾 Download CSV
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Frequency ({fLabel})</th>
              <th>Magnitude (dB)</th>
              <th>Phase (deg)</th>
              <th>Group Delay (s)</th>
            </tr>
          </thead>
          <tbody>
            {freqResponse.frequency.map((f, i) => (
              <tr key={i}>
                <td>{f.toFixed(4)}</td>
                <td>{freqResponse.magnitude_db[i].toFixed(3)}</td>
                <td>{freqResponse.phase_deg[i].toFixed(2)}°</td>
                <td>{freqResponse.group_delay[i].toFixed(6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
