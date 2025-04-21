// Main Dashboard Component for Warnke Windows WindowVisor Dashboard
// This file implements the main dashboard UI with navigation and content areas

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from 'wix-members';
import { getProjects } from '../backend/projectManager';

// Import components
import { SideNavigation } from './SideNavigation';
import { TopBar } from './TopBar';
import { ProjectsOverview } from './ProjectsOverview';
import { ProjectDetail } from './ProjectDetail';
import { QuoteUploader } from './QuoteUploader';
import { QuoteVerification } from './QuoteVerification';
import { PriceComparisonWidget } from './PriceComparisonWidget';
import { WindowVisualizer } from './WindowVisualizer';
import { VisualizationGallery } from './VisualizationGallery';
import { Settings } from './Settings';
import { Help } from './Help';

export function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [selectedVisualization, setSelectedVisualization] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load user data
    loadUserData();
    
    // Parse URL for deep linking
    parseUrl();
  }, [location]);
  
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      // Load projects
      if (user) {
        const userProjects = await getProjects(user.id);
        setProjects(userProjects);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setIsLoading(false);
    }
  };
  
  const parseUrl = () => {
    // Extract section and IDs from URL
    const params = new URLSearchParams(location.search);
    const section = params.get('section') || 'overview';
    const projectId = params.get('projectId');
    const quoteId = params.get('quoteId');
    const comparisonId = params.get('comparisonId');
    const visualizationId = params.get('visualizationId');
    
    // Set active section
    setActiveSection(section);
    
    // Set selected items if IDs are provided
    if (projectId) {
      const project = projects.find(p => p.projectId === projectId);
      if (project) {
        setSelectedProject(project);
      }
    }
    
    if (quoteId) {
      setSelectedQuote(quoteId);
    }
    
    if (comparisonId) {
      setSelectedComparison(comparisonId);
    }
    
    if (visualizationId) {
      setSelectedVisualization(visualizationId);
    }
  };
  
  const handleNavigate = (section, params = {}) => {
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('section', section);
    
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        queryParams.append(key, value);
      }
    }
    
    // Navigate to new URL
    navigate(`/dashboard?${queryParams.toString()}`);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const handleCreateProject = (project) => {
    setProjects([...projects, project]);
    handleNavigate('project', { projectId: project.projectId });
  };
  
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    handleNavigate('project', { projectId: project.projectId });
  };
  
  const handleQuoteUpload = (quoteId) => {
    setSelectedQuote(quoteId);
    handleNavigate('verify-quote', { projectId: selectedProject.projectId, quoteId });
  };
  
  const handleQuoteVerified = (quoteId) => {
    setSelectedQuote(quoteId);
    handleNavigate('comparison', { projectId: selectedProject.projectId, quoteId });
  };
  
  const handleComparisonGenerated = (comparisonId) => {
    setSelectedComparison(comparisonId);
    handleNavigate('comparison', { projectId: selectedProject.projectId, quoteId: selectedQuote, comparisonId });
  };
  
  const handleVisualizationCreated = (visualizationId) => {
    setSelectedVisualization(visualizationId);
    handleNavigate('visualize', { projectId: selectedProject.projectId, visualizationId });
  };
  
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading WindowVisor Dashboard...</p>
      </div>
    );
  }
  
  if (!currentUser) {
    // Redirect to login
    navigate('/login');
    return null;
  }
  
  return (
    <div className="dashboard-container">
      <TopBar 
        user={currentUser} 
        onLogout={handleLogout} 
      />
      
      <div className="dashboard-content">
        <SideNavigation 
          activeSection={activeSection}
          onNavigate={handleNavigate}
        />
        
        <div className="main-content">
          {activeSection === 'overview' && (
            <ProjectsOverview 
              projects={projects}
              onProjectSelect={handleProjectSelect}
              onCreateProject={handleCreateProject}
            />
          )}
          
          {activeSection === 'project' && selectedProject && (
            <ProjectDetail 
              project={selectedProject}
              onUploadQuote={() => handleNavigate('upload-quote', { projectId: selectedProject.projectId })}
              onViewComparison={(comparisonId) => handleNavigate('comparison', { projectId: selectedProject.projectId, comparisonId })}
              onCreateVisualization={() => handleNavigate('visualize-new', { projectId: selectedProject.projectId })}
              onViewVisualization={(visualizationId) => handleNavigate('visualize', { projectId: selectedProject.projectId, visualizationId })}
            />
          )}
          
          {activeSection === 'upload-quote' && selectedProject && (
            <QuoteUploader 
              projectId={selectedProject.projectId}
              onUploadComplete={handleQuoteUpload}
              onCancel={() => handleNavigate('project', { projectId: selectedProject.projectId })}
            />
          )}
          
          {activeSection === 'verify-quote' && selectedQuote && (
            <QuoteVerification 
              quoteId={selectedQuote}
              onVerificationComplete={handleQuoteVerified}
              onCancel={() => handleNavigate('project', { projectId: selectedProject.projectId })}
            />
          )}
          
          {activeSection === 'comparison' && selectedQuote && (
            <PriceComparisonWidget 
              quoteId={selectedQuote}
              projectId={selectedProject.projectId}
              comparisonId={selectedComparison}
              onComparisonGenerated={handleComparisonGenerated}
              onVisualize={handleVisualizationCreated}
              onBack={() => handleNavigate('project', { projectId: selectedProject.projectId })}
            />
          )}
          
          {activeSection === 'visualize-new' && selectedProject && (
            <div className="visualization-container">
              <h2>Create New Visualization</h2>
              <p>Upload a photo of your home to visualize new window options.</p>
              
              <div className="photo-upload-container">
                <QuoteUploader 
                  projectId={selectedProject.projectId}
                  onUploadComplete={handleVisualizationCreated}
                  onCancel={() => handleNavigate('project', { projectId: selectedProject.projectId })}
                />
              </div>
            </div>
          )}
          
          {activeSection === 'visualize' && selectedVisualization && (
            <WindowVisualizer 
              visualizationId={selectedVisualization}
              onSaveComplete={() => handleNavigate('project', { projectId: selectedProject.projectId })}
              onCreateNew={() => handleNavigate('visualize-new', { projectId: selectedProject.projectId })}
              onBack={() => handleNavigate('project', { projectId: selectedProject.projectId })}
            />
          )}
          
          {activeSection === 'visualizations' && selectedProject && (
            <VisualizationGallery 
              projectId={selectedProject.projectId}
              onView={(visualizationId) => handleNavigate('visualize', { projectId: selectedProject.projectId, visualizationId })}
              onEdit={(visualizationId) => handleNavigate('visualize', { projectId: selectedProject.projectId, visualizationId })}
              onCreateNew={() => handleNavigate('visualize-new', { projectId: selectedProject.projectId })}
            />
          )}
          
          {activeSection === 'settings' && (
            <Settings 
              user={currentUser}
            />
          )}
          
          {activeSection === 'help' && (
            <Help />
          )}
        </div>
      </div>
    </div>
  );
}