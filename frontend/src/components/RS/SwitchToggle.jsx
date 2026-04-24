import React from 'react';
import './SwitchToggle.css'; // Ensure you have the CSS for styling
const SwitchToggle = ({ id, checked, onChange, label }) => {
  return (
    <div className="switch-toggle">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="switch-toggle-checkbox"
      />
      <label className="switch-toggle-label" htmlFor={id}>
        <span className="switch-toggle-button" />
      </label>
      {label && <span style={{ marginLeft: 8 }}>{label}</span>}
    </div>
  );
};

export default SwitchToggle;
