// Top Bar Component for WindowVisor Dashboard
// This file implements the top navigation bar with user profile

import React, { useState } from 'react';
import { Icon } from 'wix-ui-icons';

export function TopBar({ user, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };
  
  return (
    <div className="top-bar">
      <div className="page-title">
        <h1>WindowVisor Dashboard</h1>
      </div>
      
      <div className="user-section">
        <div className="notifications">
          <Icon name="Notification" />
        </div>
        
        <div className="user-profile" onClick={toggleUserMenu}>
          <div className="user-avatar">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="user-info">
            <p className="user-name">{user.name}</p>
            <p className="user-role">{user.role || 'Sales Rep'}</p>
          </div>
          
          <Icon name="ChevronDown" />
          
          {showUserMenu && (
            <div className="user-menu">
              <div className="menu-item">
                <Icon name="Profile" />
                <span>My Profile</span>
              </div>
              
              <div className="menu-item">
                <Icon name="Settings" />
                <span>Account Settings</span>
              </div>
              
              <div className="menu-divider"></div>
              
              <div className="menu-item" onClick={onLogout}>
                <Icon name="Logout" />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}