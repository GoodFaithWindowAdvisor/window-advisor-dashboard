// Settings Component for WindowVisor Dashboard
// This file implements the user settings interface

import React, { useState, useEffect } from 'react';
import { updateUserProfile, updateUserSettings } from '../backend/userManager';
import { initiateOAuth, logout } from '../window-calculator';

export function Settings({ user }) {
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'Sales Rep'
  });
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      app: true
    },
    defaultCompetitor: '',
    autoProcess: true,
    darkMode: false
  });
  
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [authStatus, setAuthStatus] = useState('not-authenticated');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Competitors list for default competitor dropdown
  const competitors = [
    { id: '', name: 'Select Default' },
    { id: 'andersen', name: 'Andersen' },
    { id: 'marvin', name: 'Marvin' },
    { id: 'pella', name: 'Pella' },
    { id: 'provia', name: 'ProVia' },
    { id: 'windsor', name: 'Windsor' },
    { id: 'thermotech', name: 'Thermo-Tech' },
    { id: 'other', name: 'Other' }
  ];
  
  useEffect(() => {
    // Load user settings from backend
    // This would normally be done with a backend call
    // For now, we'll use the user object
    
    if (user.settings) {
      setSettings(user.settings);
    }
    
    // Check authentication status
    if (user.authStatus) {
      setAuthStatus(user.authStatus);
    }
  }, [user]);
  
  const handleProfileChange = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value
    });
  };
  
  const handleSettingsChange = (category, field, value) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value
      }
    });
  };
  
  const handleSimpleSettingChange = (field, value) => {
    setSettings({
      ...settings,
      [field]: value
    });
  };
  
  const handlePasswordChange = (field, value) => {
    setChangePassword({
      ...changePassword,
      [field]: value
    });
  };
  
  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccessMessage(null);
      
      // Update profile in backend
      await updateUserProfile(user.id, profileData);
      
      setSuccessMessage('Profile updated successfully!');
      setIsUpdating(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error.message || 'Failed to update profile.');
      setIsUpdating(false);
    }
  };
  
  const handleUpdateSettings = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccessMessage(null);
      
      // Update settings in backend
      await updateUserSettings(user.id, settings);
      
      setSuccessMessage('Settings updated successfully!');
      setIsUpdating(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError(error.message || 'Failed to update settings.');
      setIsUpdating(false);
    }
  };
  
  const handleChangePassword = async () => {
    // Validate passwords
    if (changePassword.newPassword !== changePassword.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    if (changePassword.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      setError(null);
      setSuccessMessage(null);
      
      // Change password in backend
      // This would normally be done with a backend call
      // For now, we'll just simulate success
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Password changed successfully!');
      setIsChangingPassword(false);
      
      // Reset password fields
      setChangePassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to change password:', error);
      setError(error.message || 'Failed to change password.');
      setIsChangingPassword(false);
    }
  };
  
  const handleGoogleAuth = async () => {
    try {
      // Initiate OAuth flow
      await initiateOAuth();
      
      // Update auth status
      setAuthStatus('authenticating');
      
    } catch (error) {
      console.error('Failed to authenticate with Google:', error);
      setError(error.message || 'Failed to authenticate with Google.');
    }
  };
  
  const handleLogout = async () => {
    try {
      // Logout from Google
      await logout();
      
      // Update auth status
      setAuthStatus('not-authenticated');
      
    } catch (error) {
      console.error('Failed to logout:', error);
      setError(error.message || 'Failed to logout.');
    }
  };
  
  return (
    <div className="settings-page">
      <div className="section-header">
        <h2>Account Settings</h2>
      </div>
      
      {error && (
        <div className="error-message">
          <i className="icon-error"></i>
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          <i className="icon-success"></i>
          <p>{successMessage}</p>
        </div>
      )}
      
      <div className="settings-grid">
        <div className="settings-card profile-card">
          <h3>Profile Information</h3>
          
          <div className="form-group">
            <label>Full Name:</label>
            <input 
              type="text" 
              value={profileData.name} 
              onChange={(e) => handleProfileChange('name', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              value={profileData.email} 
              onChange={(e) => handleProfileChange('email', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Phone:</label>
            <input 
              type="tel" 
              value={profileData.phone} 
              onChange={(e) => handleProfileChange('phone', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Role:</label>
            <input 
              type="text" 
              value={profileData.role} 
              onChange={(e) => handleProfileChange('role', e.target.value)}
              disabled={true}
            />
            <small>Contact administrator to change role</small>
          </div>
          
          <div className="form-actions">
            <button 
              className="primary-button" 
              onClick={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>
        
        <div className="settings-card password-card">
          <h3>Change Password</h3>
          
          <div className="form-group">
            <label>Current Password:</label>
            <input 
              type="password" 
              value={changePassword.currentPassword} 
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>New Password:</label>
            <input 
              type="password" 
              value={changePassword.newPassword} 
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Confirm New Password:</label>
            <input 
              type="password" 
              value={changePassword.confirmPassword} 
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            />
          </div>
          
          <div className="form-actions">
            <button 
              className="primary-button" 
              onClick={handleChangePassword}
              disabled={isChangingPassword || !changePassword.currentPassword || !changePassword.newPassword || !changePassword.confirmPassword}
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
        
        <div className="settings-card notifications-card">
          <h3>Notification Settings</h3>
          
          <div className="checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={settings.notifications.email} 
                onChange={(e) => handleSettingsChange('notifications', 'email', e.target.checked)}
              />
              Email Notifications
            </label>
            <p className="setting-description">Receive email notifications for new quotes, comparisons, and project updates.</p>
          </div>
          
          <div className="checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={settings.notifications.app} 
                onChange={(e) => handleSettingsChange('notifications', 'app', e.target.checked)}
              />
              In-App Notifications
            </label>
            <p className="setting-description">Receive notifications within the dashboard.</p>
          </div>
          
          <div className="form-group">
            <label>Default Competitor:</label>
            <select 
              value={settings.defaultCompetitor} 
              onChange={(e) => handleSimpleSettingChange('defaultCompetitor', e.target.value)}
            >
              {competitors.map(competitor => (
                <option key={competitor.id} value={competitor.id}>
                  {competitor.name}
                </option>
              ))}
            </select>
            <p className="setting-description">Pre-select this competitor when uploading quotes.</p>
          </div>
          
          <div className="checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={settings.autoProcess} 
                onChange={(e) => handleSimpleSettingChange('autoProcess', e.target.checked)}
              />
              Auto-Process Quotes
            </label>
            <p className="setting-description">Automatically process quotes after upload.</p>
          </div>
          
          <div className="checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={settings.darkMode} 
                onChange={(e) => handleSimpleSettingChange('darkMode', e.target.checked)}
              />
              Dark Mode
            </label>
            <p className="setting-description">Use dark theme for the dashboard.</p>
          </div>
          
          <div className="form-actions">
            <button 
              className="primary-button" 
              onClick={handleUpdateSettings}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Settings'}
            </button>
          </div>
        </div>
        
        <div className="settings-card integrations-card">
          <h3>Google Integration</h3>
          
          <div className="integration-status">
            <p><strong>Status:</strong> {
              authStatus === 'authenticated' ? 'Connected' :
              authStatus === 'authenticating' ? 'Connecting...' :
              authStatus === 'auth-failed' ? 'Authentication Failed' :
              'Not Connected'
            }</p>
            
            {authStatus === 'authenticated' && (
              <p className="integration-info">Connected to Google Sheets for pricing calculations.</p>
            )}
            
            {authStatus === 'auth-failed' && (
              <p className="integration-error">Authentication failed. Please try again.</p>
            )}
          </div>
          
          <div className="form-actions">
            {authStatus === 'authenticated' ? (
              <button 
                className="secondary-button" 
                onClick={handleLogout}
              >
                Disconnect from Google
              </button>
            ) : (
              <button 
                className="primary-button" 
                onClick={handleGoogleAuth}
                disabled={authStatus === 'authenticating'}
              >
                {authStatus === 'authenticating' ? 'Connecting...' : 'Connect to Google'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}