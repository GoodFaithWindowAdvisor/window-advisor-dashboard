// Visualization Gallery Component for WindowVisor Dashboard
// This file implements the gallery view of all visualizations for a project

import React, { useState, useEffect } from 'react';
import { getProjectVisualizations, deleteVisualization } from '../backend/visualizationManager';

export function VisualizationGallery({ 
  projectId, 
  onView, 
  onEdit, 
  onCreateNew 
}) {
  const [visualizations, setVisualizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    loadVisualizations();
  }, [projectId]);
  
  const loadVisualizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const visualizationsData = await getProjectVisualizations(projectId);
      
      setVisualizations(visualizationsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load visualizations:', error);
      setError(error.message || 'Failed to load visualizations.');
      setIsLoading(false);
    }
  };
  
  const handleDeleteConfirm = (visualizationId) => {
    setDeleteConfirmId(visualizationId);
  };
  
  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };
  
  const handleDelete = async (visualizationId) => {
    try {
      setIsDeleting(true);
      
      await deleteVisualization(visualizationId);
      
      // Remove the deleted visualization from the state
      const updatedVisualizations = visualizations.filter(
        v => v.visualizationId !== visualizationId
      );
      
      setVisualizations(updatedVisualizations);
      setDeleteConfirmId(null);
      setIsDeleting(false);
    } catch (error) {
      console.error('Failed to delete visualization:', error);
      setError(error.message || 'Failed to delete visualization.');
      setIsDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="visualization-gallery">
        <div className="section-header">
          <h2>Visualization Gallery</h2>
        </div>
        
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading visualizations...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="visualization-gallery">
        <div className="section-header">
          <h2>Visualization Gallery</h2>
        </div>
        
        <div className="error-message">
          <i className="icon-error"></i>
          <p>{error}</p>
        </div>
        
        <div className="form-actions">
          <button className="primary-button" onClick={loadVisualizations}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="visualization-gallery">
      <div className="section-header">
        <h2>Visualization Gallery</h2>
        <button className="primary-button" onClick={onCreateNew}>
          Create New Visualization
        </button>
      </div>
      
      {visualizations.length === 0 ? (
        <div className="empty-state">
          <p>No visualizations created yet.</p>
          <button className="primary-button" onClick={onCreateNew}>
            Create Your First Visualization
          </button>
        </div>
      ) : (
        <div className="gallery-grid">
          {visualizations.map(visualization => (
            <div key={visualization.visualizationId} className="gallery-item">
              <div className="thumbnail">
                <img 
                  src={visualization.renderedImageUrl || visualization.photoUrl} 
                  alt={visualization.roomLocation || 'Visualization'} 
                />
              </div>
              
              <div className="item-details">
                <h3>{visualization.roomLocation || 'Unnamed Visualization'}</h3>
                <p>Created: {new Date(visualization.createdAt).toLocaleDateString()}</p>
                
                {visualization.productCount && (
                  <p>{visualization.productCount} windows placed</p>
                )}
              </div>
              
              <div className="item-actions">
                <button 
                  className="secondary-button"
                  onClick={() => onView(visualization.visualizationId)}
                >
                  View
                </button>
                
                <button 
                  className="secondary-button"
                  onClick={() => onEdit(visualization.visualizationId)}
                >
                  Edit
                </button>
                
                {deleteConfirmId === visualization.visualizationId ? (
                  <div className="delete-confirm">
                    <p>Are you sure?</p>
                    <div className="confirm-actions">
                      <button 
                        className="danger-button"
                        onClick={() => handleDelete(visualization.visualizationId)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button 
                        className="secondary-button"
                        onClick={handleCancelDelete}
                        disabled={isDeleting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="danger-button"
                    onClick={() => handleDeleteConfirm(visualization.visualizationId)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}