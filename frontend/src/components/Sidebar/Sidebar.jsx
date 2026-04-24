import React from 'react';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ selectedModule, onSelectModule }) => {
  const { t } = useTranslation();

  const modules = [
     { id: 'main', labelKey: 'sidebar.main' }, 
    { id: 'digitalIO', labelKey: 'sidebar.digitalIO' },
    { id: 'analogInput', labelKey: 'sidebar.analogInput' },
    { id: 'imu', labelKey: 'sidebar.imu' },
    { id: 'rs', labelKey: 'sidebar.rs' },
    { id: 'gnss', labelKey: 'sidebar.gnss' },
  ];

  return (
    <nav className="sidebar">
      <ul>
        {modules.map(({ id, labelKey }) => (
          <li key={id}>
            <button
              className={selectedModule === id ? 'active' : ''}
              onClick={() => onSelectModule(id)}
            >
              {t(labelKey)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
