import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import DigitalIO from '../DigitalIO/DigitalIO';
import AnalogInput from '../AnalogInput/AnalogInput';
import IMU from '../IMU/IMU';
import RS from '../RS/RS';
import GNSS from '../GNSS/GNSS';
import MainDashboard from '../MainDashboard/MainDashboard';
import './Dashboard.css'; // Dodajemy stylizację dla layoutu

const Dashboard = () => {
  const [selectedModule, setSelectedModule] = useState('main');

  const renderModule = () => {
    switch (selectedModule) {
      case 'digitalIO':
        return <DigitalIO />;
      case 'analogInput':
        return <AnalogInput />;
      case 'imu':
        return <IMU />;
      case 'rs':
        return <RS />;
      case 'gnss':
        return <GNSS />;
      case 'main':
        return <MainDashboard />;
      default:
        return <div>Wybierz moduł</div>;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar selectedModule={selectedModule} onSelectModule={setSelectedModule} />
      <main className="dashboard-main-content">
        {renderModule()}
      </main>
    </div>
  );
};

export default Dashboard;