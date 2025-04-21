// Project Detail Component for WindowVisor Dashboard
// This file implements the detailed project view with tabs

import React, { useState, useEffect } from 'react';
import { 
  getProjectQuotes, 
  getProjectComparisons, 
  getProjectVisualizations,
  updateProjectNotes
} from '../backend/projectManager';

export function ProjectDetail({ 
  project, 
  onUploadQuote, 
  onViewComparison, 
  onCreateVisualization, 
  onViewVisualization 
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [quotes, setQuotes] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectNotes, setProjectNotes] = useState(project.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    loadProjectData();
  }, [project.projectId]);
  
  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      
      // Load quotes, comparisons, and visualizations
      const [quotesData, comparisonsData, visualizationsData] = await Promise.all([
        getProjectQuotes(project.projectId),
        getProjectComparisons(project.projectId),
        getProjectVisualizations(project.projectId)
      ]);
      
      setQuotes(quotesData);
      setComparisons(comparisonsData);
      setVisualizations(visualizationsData);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load project data:', error);
      setIsLoading(false);
    }
  };
  
  const handleSaveNotes = async () => {
    try {
      setIsSaving(true);
      await updateProjectNotes(project.projectId, projectNotes);
      setIsSaving(false);
      // Show success message or notification here
    } catch (error) {
      console.error('Failed to save notes:', error);
      setIsSaving(false);
      // Show error message here
    }
  };
  
  return (
    <div className="project-detail">
      <div className="section-header">
        <div className="breadcrumb">
          <span className="breadcrumb-item">Projects</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item current">{project.customerName}</span>
        </div>
        
        <div className="header-actions">
          <button className="secondary-button" onClick={onUploadQuote}>
            Upload Quote
          </button>
          <button className="secondary-button" onClick={onCreateVisualization}>
            Create Visualization
          </button>
        </div>
      </div>
      
      <div className="project-info-card">
        <div className="customer-info">
          <h2>{project.customerName}</h2>
          <p>{project.customerAddress}</p>
          <p>{project.customerEmail} | {project.customerPhone}</p>
        </div>
        
        <div className="project-status">
          <span className={`status-badge ${project.projectStatus}`}>
            {project.projectStatus.charAt(0).toUpperCase() + project.projectStatus.slice(1)}
          </span>
          <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
          <p>Last Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div className="project-tabs">
        <div 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </div>
        <div 
          className={`tab ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotes')}
        >
          Quotes ({quotes.length})
        </div>
        <div 
          className={`tab ${activeTab === 'comparisons' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparisons')}
        >
          Comparisons ({comparisons.length})
        </div>
        <div 
          className={`tab ${activeTab === 'visualizations' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualizations')}
        >
          Visualizations ({visualizations.length})
        </div>
        <div 
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </div>
      </div>
      
      <div className="tab-content">
        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading project data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="overview-grid">
                  <div className="overview-card quotes-card">
                    <h3>Quotes</h3>
                    <div className="card-content">
                      {quotes.length === 0 ? (
                        <div className="empty-state">
                          <p>No quotes uploaded yet.</p>
                          <button className="text-button" onClick={onUploadQuote}>
                            Upload Quote
                          </button>
                        </div>
                      ) : (
                        <div className="quote-list">
                          {quotes.slice(0, 3).map(quote => (
                            <div key={quote.quoteId} className="quote-item">
                              <div className="quote-info">
                                <p className="quote-name">{quote.competitorName}</p>
                                <p className="quote-date">{new Date(quote.quoteDate).toLocaleDateString()}</p>
                              </div>
                              <p className="quote-amount">${quote.totalAmount.toLocaleString()}</p>
                            </div>
                          ))}
                          {quotes.length > 3 && (
                            <button className="text-button" onClick={() => setActiveTab('quotes')}>
                              View All Quotes
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="overview-card comparisons-card">
                    <h3>Comparisons</h3>
                    <div className="card-content">
                      {comparisons.length === 0 ? (
                        <div className="empty-state">
                          <p>No comparisons generated yet.</p>
                          {quotes.length > 0 && (
                            <button className="text-button" onClick={() => onViewComparison(quotes[0].quoteId)}>
                              Generate Comparison
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="comparison-list">
                          {comparisons.slice(0, 3).map(comparison => (
                            <div 
                              key={comparison.comparisonId} 
                              className="comparison-item"
                              onClick={() => onViewComparison(comparison.comparisonId)}
                            >
                              <div className="comparison-info">
                                <p className="comparison-name">{comparison.competitorName}</p>
                                <p className="comparison-date">{new Date(comparison.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="comparison-savings">
                                <p className="savings-amount">${comparison.savingsAmount.toLocaleString()}</p>
                                <p className="savings-percentage">{comparison.savingsPercentage.toFixed(1)}%</p>
                              </div>
                            </div>
                          ))}
                          {comparisons.length > 3 && (
                            <button className="text-button" onClick={() => setActiveTab('comparisons')}>
                              View All Comparisons
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="overview-card visualizations-card">
                    <h3>Visualizations</h3>
                    <div className="card-content">
                      {visualizations.length === 0 ? (
                        <div className="empty-state">
                          <p>No visualizations created yet.</p>
                          <button className="text-button" onClick={onCreateVisualization}>
                            Create Visualization
                          </button>
                        </div>
                      ) : (
                        <div className="visualization-grid">
                          {visualizations.slice(0, 4).map(visualization => (
                            <div 
                              key={visualization.visualizationId} 
                              className="visualization-thumbnail"
                              onClick={() => onViewVisualization(visualization.visualizationId)}
                            >
                              <img 
                                src={visualization.renderedImageUrl || visualization.photoUrl} 
                                alt={visualization.roomLocation || 'Visualization'} 
                              />
                              <p>{visualization.roomLocation || 'Unnamed'}</p>
                            </div>
                          ))}
                          {visualizations.length > 4 && (
                            <button className="text-button" onClick={() => setActiveTab('visualizations')}>
                              View All Visualizations
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="overview-card notes-card">
                    <h3>Notes</h3>
                    <div className="card-content">
                      <p>{project.notes || 'No notes added yet.'}</p>
                      <button className="text-button" onClick={() => setActiveTab('notes')}>
                        {project.notes ? 'Edit Notes' : 'Add Notes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'quotes' && (
              <div className="quotes-tab">
                <div className="tab-header">
                  <h3>Quotes</h3>
                  <button className="secondary-button" onClick={onUploadQuote}>
                    Upload Quote
                  </button>
                </div>
                
                {quotes.length === 0 ? (
                  <div className="empty-state">
                    <p>No quotes uploaded yet.</p>
                    <button className="primary-button" onClick={onUploadQuote}>
                      Upload Quote
                    </button>
                  </div>
                ) : (
                  <div className="quotes-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Competitor</th>
                          <th>Quote Number</th>
                          <th>Date</th>
                          <th>Total Amount</th>
                          <th>Items</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotes.map(quote => (
                          <tr key={quote.quoteId}>
                            <td>{quote.competitorName}</td>
                            <td>{quote.quoteNumber}</td>
                            <td>{new Date(quote.quoteDate).toLocaleDateString()}</td>
                            <td>${quote.totalAmount.toLocaleString()}</td>
                            <td>{quote.itemsCount}</td>
                            <td>
                              <span className={`status-badge ${quote.extractionStatus}`}>
                                {quote.extractionStatus.charAt(0).toUpperCase() + quote.extractionStatus.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="icon-button"
                                  onClick={() => onViewComparison(quote.quoteId)}
                                  title="Generate Comparison"
                                >
                                  <i className="icon-compare"></i>
                                </button>
                                <button 
                                  className="icon-button"
                                  onClick={() => window.open(quote.documentUrl, '_blank')}
                                  title="View Document"
                                >
                                  <i className="icon-document"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'comparisons' && (
              <div className="comparisons-tab">
                <div className="tab-header">
                  <h3>Comparisons</h3>
                </div>
                
                {comparisons.length === 0 ? (
                  <div className="empty-state">
                    <p>No comparisons generated yet.</p>
                    {quotes.length > 0 ? (
                      <button className="primary-button" onClick={() => onViewComparison(quotes[0].quoteId)}>
                        Generate Comparison
                      </button>
                    ) : (
                      <button className="primary-button" onClick={onUploadQuote}>
                        Upload Quote First
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="comparisons-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Competitor</th>
                          <th>Created Date</th>
                          <th>Competitor Total</th>
                          <th>Warnke Total</th>
                          <th>Savings</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisons.map(comparison => (
                          <tr key={comparison.comparisonId}>
                            <td>{comparison.competitorName}</td>
                            <td>{new Date(comparison.createdAt).toLocaleDateString()}</td>
                            <td>${comparison.totalCompetitorPrice.toLocaleString()}</td>
                            <td>${comparison.totalWarnkePrice.toLocaleString()}</td>
                            <td>
                              <div className="savings-cell">
                                <span className="savings-amount">${comparison.savingsAmount.toLocaleString()}</span>
                                <span className="savings-percentage">({comparison.savingsPercentage.toFixed(1)}%)</span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${comparison.status}`}>
                                {comparison.status.charAt(0).toUpperCase() + comparison.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="icon-button"
                                  onClick={() => onViewComparison(comparison.comparisonId)}
                                  title="View Comparison"
                                >
                                  <i className="icon-view"></i>
                                </button>
                                {comparison.reportUrl && (
                                  <button 
                                    className="icon-button"
                                    onClick={() => window.open(comparison.reportUrl, '_blank')}
                                    title="View Report"
                                  >
                                    <i className="icon-pdf"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'visualizations' && (
              <div className="visualizations-tab">
                <div className="tab-header">
                  <h3>Visualizations</h3>
                  <button className="secondary-button" onClick={onCreateVisualization}>
                    Create Visualization
                  </button>
                </div>
                
                {visualizations.length === 0 ? (
                  <div className="empty-state">
                    <p>No visualizations created yet.</p>
                    <button className="primary-button" onClick={onCreateVisualization}>
                      Create Visualization
                    </button>
                  </div>
                ) : (
                  <div className="visualizations-grid">
                    {visualizations.map(visualization => (
                      <div 
                        key={visualization.visualizationId} 
                        className="visualization-card"
                        onClick={() => onViewVisualization(visualization.visualizationId)}
                      >
                        <div className="visualization-image">
                          <img 
                            src={visualization.renderedImageUrl || visualization.photoUrl} 
                            alt={visualization.roomLocation || 'Visualization'} 
                          />
                        </div>
                        <div className="visualization-info">
                          <h4>{visualization.roomLocation || 'Unnamed Visualization'}</h4>
                          <p>Created: {new Date(visualization.createdAt).toLocaleDateString()}</p>
                          {visualization.warnkeProduct && (
                            <p>Product: {visualization.warnkeProduct.brand} {visualization.warnkeProduct.productLine}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="notes-tab">
                <div className="tab-header">
                  <h3>Project Notes</h3>
                </div>
                
                <div className="notes-editor">
                  <textarea 
                    value={projectNotes} 
                    onChange={(e) => setProjectNotes(e.target.value)}
                    placeholder="Add notes about this project..."
                    rows={10}
                  ></textarea>
                  
                  <div className="notes-actions">
                    <button 
                      className="primary-button"
                      onClick={handleSaveNotes}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}