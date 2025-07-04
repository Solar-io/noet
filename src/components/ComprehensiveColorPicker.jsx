import React, { useState } from "react";
import { Plus, Palette } from "lucide-react";

const ComprehensiveColorPicker = ({ 
  color = "#000000", 
  onChange, 
  onChangeComplete,
  title = "Color Picker"
}) => {
  const [selectedColor, setSelectedColor] = useState(color);

  // Color palette organized like the screenshot
  const grayColors = [
    "#000000", "#333333", "#555555", "#777777", 
    "#999999", "#bbbbbb", "#dddddd", "#eeeeee", 
    "#f5f5f5", "#ffffff"
  ];

  const basicColors = [
    "#8b0000", "#ff0000", "#ffa500", "#ffff00", 
    "#00ff00", "#00ffff", "#4169e1", "#0000ff", 
    "#8a2be2", "#ff1493"
  ];

  const lightShades = [
    "#ffd7d7", "#ffe4e1", "#ffefd5", "#fffacd",
    "#f0fff0", "#e0ffff", "#e6f3ff", "#f0f8ff",
    "#f5f0ff", "#ffe0ff"
  ];

  const mediumShades = [
    "#ffb3b3", "#ffcccb", "#ffdab9", "#fff8dc",
    "#d4f4dd", "#b0e0e6", "#b3d9ff", "#d6e5fa",
    "#e6d7ff", "#ffb3ff"
  ];

  const darkShades = [
    "#ff8080", "#fa8072", "#daa520", "#ffd700",
    "#90ee90", "#87ceeb", "#6495ed", "#87cefa",
    "#dda0dd", "#ff69b4"
  ];

  const darkerShades = [
    "#ff6347", "#cd5c5c", "#b8860b", "#ffa500",
    "#32cd32", "#4682b4", "#4169e1", "#6495ed",
    "#9370db", "#da70d6"
  ];

  const darkestShades = [
    "#dc143c", "#a0522d", "#ff8c00", "#ff6347",
    "#228b22", "#1e90ff", "#0000cd", "#4169e1",
    "#6a5acd", "#c71585"
  ];

  const veryDarkShades = [
    "#8b0000", "#8b4513", "#ff4500", "#ff0000",
    "#006400", "#0000cd", "#00008b", "#191970",
    "#4b0082", "#8b008b"
  ];

  // Custom colors (could be from user's recent selections)
  const customColors = [
    "#a0a0a0", "#606060", "#800080", "#008000",
    "#333333", "#ff4444", "#4488ff", "#44aa44",
    "#aa6600", "#000000"
  ];

  const handleColorClick = (newColor) => {
    setSelectedColor(newColor);
    onChange && onChange({ hex: newColor });
    onChangeComplete && onChangeComplete({ hex: newColor });
  };

  const ColorRow = ({ colors }) => (
    <div className="flex gap-0.5 mb-0.5">
      {colors.map((colorValue, index) => (
        <button
          key={index}
          className={`w-5 h-5 rounded-sm border hover:scale-105 transition-transform ${
            selectedColor === colorValue 
              ? "border-gray-900 shadow-md ring-2 ring-blue-300" 
              : "border-gray-200 hover:border-gray-400"
          }`}
          style={{ backgroundColor: colorValue }}
          onClick={() => handleColorClick(colorValue)}
          title={colorValue}
        />
      ))}
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-lg p-2 w-60">
      {/* Header with "None" option */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Palette size={14} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-700">{title}</span>
        </div>
        <button
          className={`px-2 py-0.5 text-xs border rounded ${
            selectedColor === "transparent" || !selectedColor
              ? "bg-gray-100 border-gray-400 text-gray-700"
              : "bg-white border-gray-300 hover:bg-gray-50 text-gray-600"
          }`}
          onClick={() => handleColorClick("transparent")}
        >
          None
        </button>
      </div>

      {/* Color Grid */}
      <div className="space-y-0.5 mb-2">
        <ColorRow colors={grayColors} />
        <ColorRow colors={basicColors} />
        <ColorRow colors={lightShades} />
        <ColorRow colors={mediumShades} />
        <ColorRow colors={darkShades} />
        <ColorRow colors={darkerShades} />
        <ColorRow colors={darkestShades} />
        <ColorRow colors={veryDarkShades} />
      </div>

      {/* Custom Section */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custom</span>
        </div>
        <div className="flex gap-0.5">
          {customColors.map((colorValue, index) => (
            <button
              key={index}
              className={`w-5 h-5 rounded-sm border hover:scale-105 transition-transform ${
                selectedColor === colorValue 
                  ? "border-gray-900 shadow-md ring-2 ring-blue-300" 
                  : "border-gray-200 hover:border-gray-400"
              }`}
              style={{ backgroundColor: colorValue }}
              onClick={() => handleColorClick(colorValue)}
              title={colorValue}
            />
          ))}
          {/* Add Custom Color Button */}
          <button
            className="w-5 h-5 rounded-sm border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center hover:scale-105 transition-transform"
            title="Add custom color"
            onClick={() => {
              // Could open a more detailed color picker or allow hex input
              const customColor = prompt("Enter hex color (e.g., #ff0000):");
              if (customColor && /^#[0-9A-F]{6}$/i.test(customColor)) {
                handleColorClick(customColor);
              }
            }}
          >
            <Plus size={10} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Color Preview */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Selected:</span>
          <div 
            className="w-3 h-3 rounded border border-gray-300"
            style={{ backgroundColor: selectedColor === "transparent" ? "#ffffff" : selectedColor }}
          />
          <span className="text-xs text-gray-700 font-mono">
            {selectedColor === "transparent" ? "None" : selectedColor}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveColorPicker;
