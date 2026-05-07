import React, { useState } from "react";
import { FilterState } from "../hooks/useSmartFilters";

interface SmartFiltersProps {
  filters: FilterState;
  onChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  resultCount: number;
  hasActive: boolean;
  activeCount: number;
}

const SIZE_PRESETS = [
  { value: "", label: "Any size" },
  { value: "0-1048576", label: "Under 1 MB" },
  { value: "1048576-10485760", label: "1 MB – 10 MB" },
  { value: "10485760-104857600", label: "10 MB – 100 MB" },
  { value: "104857600-", label: "Over 100 MB" },
];

function formatChipLabel(key: string, value: string): string {
  switch (key) {
    case "modifiedAfter": {
      try {
        const d = new Date(value);
        return `After: ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
      } catch { return `After: ${value}`; }
    }
    case "modifiedBefore": {
      try {
        const d = new Date(value);
        return `Before: ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
      } catch { return `Before: ${value}`; }
    }
    case "sizeMin":
    case "sizeMax": {
      // Find matching preset
      const sizeVal = key === "sizeMin" ? `${value}-` : `-${value}`;
      const preset = SIZE_PRESETS.find(p => {
        if (!p.value) return false;
        const [min, max] = p.value.split("-");
        if (key === "sizeMin" && min === value) return true;
        if (key === "sizeMax" && max === value) return true;
        return false;
      });
      if (preset) return `Size: ${preset.label}`;
      const bytes = parseInt(value);
      if (bytes < 1024 * 1024) return `Size ${key === "sizeMin" ? "≥" : "≤"} ${(bytes / 1024).toFixed(0)} KB`;
      return `Size ${key === "sizeMin" ? "≥" : "≤"} ${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    }
    case "filetype": return `Type: ${value.toUpperCase()}`;
    case "service": return `Source: ${value.replace(/_/g, " ")}`;
    default: return value;
  }
}

function getSizePresetValue(sizeMin: string, sizeMax: string): string {
  for (const preset of SIZE_PRESETS) {
    if (!preset.value) {
      if (!sizeMin && !sizeMax) return "";
      continue;
    }
    const [min, max] = preset.value.split("-");
    if ((min || "") === sizeMin && (max || "") === sizeMax) return preset.value;
  }
  return "";
}

// Styles
const inputStyle: React.CSSProperties = {
  height: 32, background: "#13141C", border: "1px solid #22243A",
  borderRadius: 6, color: "#EAEAF0", fontSize: 13, padding: "0 8px",
  outline: "none", transition: "border-color 200ms ease",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: "#4A4C5E", fontWeight: 500,
  textTransform: "uppercase", letterSpacing: "0.05em",
  whiteSpace: "nowrap",
};

const SmartFilters: React.FC<SmartFiltersProps> = ({
  filters, onChange, onReset, hasActive, activeCount,
}) => {
  const [expanded, setExpanded] = useState(false);

  const activeFilters = Object.entries(filters).filter(([, v]) => v !== "");

  const handleSizeChange = (val: string) => {
    if (!val) {
      onChange("sizeMin", "");
      onChange("sizeMax", "");
      return;
    }
    const [min, max] = val.split("-");
    onChange("sizeMin", min || "");
    onChange("sizeMax", max || "");
  };

  const removeFilter = (key: string) => {
    if (key === "sizeMin" || key === "sizeMax") {
      onChange("sizeMin", "");
      onChange("sizeMax", "");
    } else {
      onChange(key as keyof FilterState, "");
    }
  };

  return (
    <div style={{ borderBottom: "1px solid #1E2030" }}>
      {/* Toggle row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 24px",
      }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "#4A4C5E", fontSize: 12, fontWeight: 600,
            padding: "4px 8px", borderRadius: 6,
            transition: "all 200ms ease",
            position: "relative",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#EAEAF0")}
          onMouseLeave={e => (e.currentTarget.style.color = "#4A4C5E")}
        >
          <span className="material-symbols-outlined" style={{
            fontSize: 16, transition: "transform 200ms ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}>
            expand_more
          </span>
          Filters
          {hasActive && (
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              background: "#6C63FF", color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginLeft: 2,
            }}>
              {activeCount}
            </span>
          )}
        </button>

        {hasActive && (
          <button
            onClick={onReset}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#4A4C5E", fontSize: 12, fontWeight: 500,
              padding: "4px 8px", transition: "color 200ms ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#6C63FF")}
            onMouseLeave={e => (e.currentTarget.style.color = "#4A4C5E")}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expandable controls */}
      <div style={{
        maxHeight: expanded ? 80 : 0,
        overflow: "hidden",
        transition: "max-height 250ms ease",
        padding: expanded ? "0 24px 12px" : "0 24px",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          flexWrap: "wrap",
        }}>
          {/* Date range */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={labelStyle}>Modified</span>
            <input
              type="date"
              value={filters.modifiedAfter}
              onChange={e => onChange("modifiedAfter", e.target.value)}
              style={{ ...inputStyle, width: 140 }}
              placeholder="From"
              onFocus={e => (e.currentTarget.style.borderColor = "#6C63FF")}
              onBlur={e => (e.currentTarget.style.borderColor = "#22243A")}
            />
            <span style={{ color: "#4A4C5E", fontSize: 12 }}>to</span>
            <input
              type="date"
              value={filters.modifiedBefore}
              onChange={e => onChange("modifiedBefore", e.target.value)}
              style={{ ...inputStyle, width: 140 }}
              placeholder="To"
              onFocus={e => (e.currentTarget.style.borderColor = "#6C63FF")}
              onBlur={e => (e.currentTarget.style.borderColor = "#22243A")}
            />
          </div>

          {/* Size dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={labelStyle}>Size</span>
            <select
              value={getSizePresetValue(filters.sizeMin, filters.sizeMax)}
              onChange={e => handleSizeChange(e.target.value)}
              style={{
                ...inputStyle,
                width: 150,
                appearance: "none",
                paddingRight: 28,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%234A4C5E' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                cursor: "pointer",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#6C63FF")}
              onBlur={e => (e.currentTarget.style.borderColor = "#22243A")}
            >
              {SIZE_PRESETS.map(p => (
                <option key={p.value} value={p.value} style={{ background: "#13141C", color: "#EAEAF0" }}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6,
          padding: "0 24px 10px",
        }}>
          {activeFilters
            .filter(([key]) => {
              // Deduplicate sizeMin/sizeMax: show only one chip when both are set
              if (key === "sizeMax" && filters.sizeMin) return false;
              return true;
            })
            .map(([key, value]) => (
            <span
              key={key}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: 4,
                background: "rgba(108,99,255,0.12)",
                border: "1px solid rgba(108,99,255,0.3)",
                color: "#6C63FF", fontSize: 11, fontWeight: 500,
              }}
            >
              {formatChipLabel(key, value)}
              <button
                onClick={() => removeFilter(key)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#6C63FF", padding: 0, lineHeight: 1,
                  display: "flex", alignItems: "center",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartFilters;
