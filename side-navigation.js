// Side Navigation Component for WindowVisor Dashboard
// This file implements the left sidebar navigation

import React from 'react';
import { Icon } from 'wix-ui-icons';

export function SideNavigation({ activeSection, onNavigate }) {
  const navItems = [
    { id: 'overview', label: 'Projects Overview', icon: 'Home' },
    { id: 'settings', label: 'Settings', icon: 'Settings' },
    { id: 'help', label: 'Help & Support', icon: 'Help' }
  ];
  
  return (
    <div className="side-navigation">
      <div className="logo-container">
        <img src="/assets/warnke-logo.png" alt="Warnke Windows" className="logo" />
      </div>
      
      <nav className="nav-items">
        {navItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      
      <div className="nav-footer">
        <div className="company-info">
          <p>Warnke Windows</p>
          <p className="small">WindowVisor Dashboard</p>
        </div>
      </div>
    </div>
  );
}