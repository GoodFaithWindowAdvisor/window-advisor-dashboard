// Projects Overview Component for WindowVisor Dashboard
// This file implements the projects overview grid and new project creation

import React, { useState } from 'react';
import { createProject } from '../backend/projectManager';

export function ProjectsOverview({ projects, onProjectSelect, onCreateProject }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    projectStatus: 'quote',
    notes: ''
  });
  
  const handleInputChange = (field, value) => {
    setNewProject({
      ...newProject,
      [field]: value
    });
  };
  
  const handleCreateProject = async () => {
    try {
      setIsCreating(true);
      const project = await createProject(newProject);
      setIsCreating(false);
      
      // Reset form
      setNewProject({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        projectStatus: 'quote',
        notes: ''
      });
      
      // Notify parent
      onCreateProject(project);
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsCreating(false);
    }
  };
  
  return (
    <div className="projects-overview">
      <div className="section-header">
        <h2>Projects Overview</h2>
        <button className="primary-button" onClick={() => setIsCreating(true)}>
          Create New Project
        </button>
      </div>
      
      {isCreating && (
        <div className="create-project-form">
          <h3>New Project</h3>
          
          <div className="form-group">
            <label>Customer Name:</label>
            <input 
              type="text" 
              value={newProject.customerName} 
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              value={newProject.customerEmail} 
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              placeholder="Enter customer email"
            />
          </div>
          
          <div className="form-group">
            <label>Phone:</label>
            <input 
              type="tel" 
              value={newProject.customerPhone} 
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              placeholder="Enter customer phone"
            />
          </div>
          
          <div className="form-group">
            <label>Address:</label>
            <input 
              type="text" 
              value={newProject.customerAddress} 
              onChange={(e) => handleInputChange('customerAddress', e.target.value)}
              placeholder="Enter customer address"
            />
          </div>
          
          <div className="form-group">
            <label>Notes:</label>
            <textarea 
              value={newProject.notes} 
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter project notes"
            ></textarea>
          </div>
          
          <div className="form-actions">
            <button className="secondary-button" onClick={() => setIsCreating(false)}>
              Cancel
            </button>
            <button 
              className="primary-button" 
              onClick={handleCreateProject} 
              disabled={!newProject.customerName || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      )}
      
      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects found. Create your first project to get started.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <div 
                key={project.projectId} 
                className="project-card"
                onClick={() => onProjectSelect(project)}
              >
                <div className="project-header">
                  <h3>{project.customerName}</h3>
                  <span className={`status-badge ${project.projectStatus}`}>
                    {project.projectStatus.charAt(0).toUpperCase() + project.projectStatus.slice(1)}
                  </span>
                </div>
                
                <div className="project-details">
                  <p><strong>Address:</strong> {project.customerAddress}</p>
                  <p><strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
                  
                  <div className="project-stats">
                    <div className="stat">
                      <span className="stat-value">{project.quotesCount || 0}</span>
                      <span className="stat-label">Quotes</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{project.comparisonsCount || 0}</span>
                      <span className="stat-label">Comparisons</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{project.visualizationsCount || 0}</span>
                      <span className="stat-label">Visualizations</span>
                    </div>
                  </div>
                </div>
                
                <div className="project-footer">
                  <button className="text-button">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}