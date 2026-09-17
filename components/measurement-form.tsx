"use client";

import { useState } from "react";
import { addMeasurement } from "@/app/dashboard/actions";
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS, type MeasurementType } from "@/lib/types";

const TYPES: MeasurementType[] = [
  "blood_pressure",
  "glucose",
  "weight",
  "heart_rate",
  "temperature",
  "spo2",
  "custom",
];

function nowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function MeasurementForm() {
  const [type, setType] = useState<MeasurementType>("blood_pressure");

  return (
    <form action={addMeasurement} className="space-y-3">
      <input type="hidden" name="unit" value={MEASUREMENT_UNITS[type]} />
      <div>
        <label className="lb-label" htmlFor="type">
          Type
        </label>
        <select
          className="lb-select"
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as MeasurementType)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {MEASUREMENT_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {type === "custom" && (
        <div>
          <label className="lb-label" htmlFor="label">
            Label
          </label>
          <input className="lb-input" id="label" name="label" placeholder="e.g. Peak flow" required />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="lb-label" htmlFor="value">
            {type === "blood_pressure" ? "Systolic" : "Value"}
          </label>
          <input
            className="lb-input"
            type="number"
            step="any"
            id="value"
            name="value"
            required
          />
        </div>
        {type === "blood_pressure" ? (
          <div>
            <label className="lb-label" htmlFor="value_secondary">
              Diastolic
            </label>
            <input
              className="lb-input"
              type="number"
              step="any"
              id="value_secondary"
              name="value_secondary"
              required
            />
          </div>
        ) : (
          <div>
            <label className="lb-label" htmlFor="unit_display">
              Unit
            </label>
            <input
              className="lb-input"
              id="unit_display"
              value={MEASUREMENT_UNITS[type]}
              disabled
            />
          </div>
        )}
      </div>

      <div>
        <label className="lb-label" htmlFor="taken_at">
          When
        </label>
        <input
          className="lb-input"
          type="datetime-local"
          id="taken_at"
          name="taken_at"
          defaultValue={nowLocal()}
          required
        />
      </div>

      <button type="submit" className="lb-btn lb-btn-primary w-full">
        Save reading
      </button>
    </form>
  );
}
