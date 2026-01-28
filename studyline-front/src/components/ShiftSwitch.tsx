import { useState } from 'react';
import { Sunrise, Sun } from 'lucide-react';

export default function ShiftSwitch({shift, name, onChangeShift, onChange, onEdit, edit}) {
  
  const isAfternoon = shift === 2;
  function toggle() {
    const next = isAfternoon ? 1 : 2; // 1 → 2, 2 → 1
    onChangeShift?.(next);
    if (onChange) {onChange?.({name: name, shift: next})}
    if (edit) {if (onEdit) {onEdit?.({...edit, shift: next})}}
  }

  return (
    <div className="switch-container">
      <div className="switch-wrapper">
        <button
          onClick={toggle}
          className="switch-button"
          aria-label="Toggle time of day"
        >
          {/* Sliding background */}
          <div className={`switch-slider ${isAfternoon ? 'active' : ''}`} />
          
          {/* Icons container */}
          <div className="switch-icons">
            {/* Morning icon */}
            <div className="icon-wrapper">
              <Sunrise
                className={`icon ${!isAfternoon ? 'icon-active' : 'icon-inactive'}`}
                size={20}
                strokeWidth={2}
              />
            </div>
            
            {/* Afternoon icon */}
            <div className="icon-wrapper">
              <Sun
                className={`icon ${isAfternoon ? 'icon-active' : 'icon-inactive'}`}
                size={28}
                strokeWidth={2}
              />
            </div>
          </div>
        </button>
        
      </div>
    </div>
  );
}

