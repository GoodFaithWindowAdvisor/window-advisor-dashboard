// Help and Support Component for WindowVisor Dashboard
// This file implements the help and support interface

import React, { useState } from 'react';
import { submitSupportRequest } from '../backend/supportManager';

export function Help() {
  const [activeSection, setActiveSection] = useState('faq');
  const [supportRequest, setSupportRequest] = useState({
    subject: '',
    category: 'general',
    description: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const handleInputChange = (field, value) => {
    setSupportRequest({
      ...supportRequest,
      [field]: value
    });
  };
  
  const handleSubmitRequest = async () => {
    // Validate form
    if (!supportRequest.subject || !supportRequest.description) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      // Submit support request
      await submitSupportRequest(supportRequest);
      
      setSuccessMessage('Support request submitted successfully! Our team will get back to you soon.');
      setIsSubmitting(false);
      
      // Reset form
      setSupportRequest({
        subject: '',
        category: 'general',
        description: '',
        priority: 'normal'
      });
      
    } catch (error) {
      console.error('Failed to submit support request:', error);
      setError(error.message || 'Failed to submit support request.');
      setIsSubmitting(false);
    }
  };
  
  const renderFAQ = () => (
    <div className="faq-section">
      <h3>Frequently Asked Questions</h3>
      
      <div className="faq-item">
        <h4>How do I upload a competitor quote?</h4>
        <p>
          To upload a competitor quote, navigate to a project and click the "Upload Quote" button. 
          You can upload PDF, JPG, or PNG files. The system will automatically extract information 
          from the quote, which you can then verify for accuracy.
        </p>
      </div>
      
      <div className="faq-item">
        <h4>How accurate is the quote extraction?</h4>
        <p>
          The quote extraction uses advanced OCR technology to identify product details and pricing. 
          Accuracy varies based on the quality and format of the uploaded document. The verification 
          step allows you to correct any errors before generating a comparison.
        </p>
      </div>
      
      <div className="faq-item">
        <h4>How are competitor products matched with Warnke Windows products?</h4>
        <p>
          Our comparison engine uses a database of product mappings to find equivalent Warnke Windows 
          products based on specifications, features, and performance ratings. The system considers 
          window type, dimensions, glass options, frame material, and other key factors.
        </p>
      </div>
      
      <div className="faq-item">
        <h4>Can I edit a visualization after saving it?</h4>
        <p>
          Yes, you can edit any visualization by opening it from the project details page or the 
          visualization gallery. You can modify window placements, change product options, and 
          update room information.
        </p>
      </div>
      
      <div className="faq-item">
        <h4>How do I share a comparison with a customer?</h4>
        <p>
          From the comparison view, you can click the "Print Comparison" button to generate a 
          printable version. You can also save the comparison as a PDF or display it directly 
          on your screen during a customer meeting.
        </p>
      </div>
      
      <div className="faq-item">
        <h4>Can I track the status of my projects?</h4>
        <p>
          Yes, each project has a status that you can update as it progresses through the sales 
          cycle. You can use the project notes feature to add details about customer interactions 
          and next steps.
        </p>
      </div>
    </div>
  );
  
  const renderTutorials = () => (
    <div className="tutorials-section">
      <h3>Video Tutorials</h3>
      
      <div className="tutorial-grid">
        <div className="tutorial-card">
          <div className="tutorial-thumbnail">
            <img src="/assets/tutorials/quote-upload.jpg" alt="Quote Upload Tutorial" />
            <div className="tutorial-play-button">
              <i className="icon-play"></i>
            </div>
          </div>
          <div className="tutorial-details">
            <h4>Uploading & Processing Quotes</h4>
            <p>Learn how to upload competitor quotes and process them for comparison.</p>
            <p className="tutorial-duration">5:24</p>
          </div>
        </div>
        
        <div className="tutorial-card">
          <div className="tutorial-thumbnail">
            <img src="/assets/tutorials/visualization.jpg" alt="Visualization Tutorial" />
            <div className="tutorial-play-button">
              <i className="icon-play"></i>
            </div>
          </div>
          <div className="tutorial-details">
            <h4>Creating Window Visualizations</h4>
            <p>Learn how to create realistic window visualizations with customer photos.</p>
            <p className="tutorial-duration">7:12</p>
          </div>
        </div>
        
        <div className="tutorial-card">
          <div className="tutorial-thumbnail">
            <img src="/assets/tutorials/comparison.jpg" alt="Comparison Tutorial" />
            <div className="tutorial-play-button">
              <i className="icon-play"></i>
            </div>
          </div>
          <div className="tutorial-details">
            <h4>Presenting Price Comparisons</h4>
            <p>Learn how to effectively present price comparisons to customers.</p>
            <p className="tutorial-duration">4:38</p>
          </div>
        </div>
        
        <div className="tutorial-card">
          <div className="tutorial-thumbnail">
            <img src="/assets/tutorials/project-management.jpg" alt="Project Management Tutorial" />
            <div className="tutorial-play-button">
              <i className="icon-play"></i>
            </div>
          </div>
          <div className="tutorial-details">
            <h4>Project Management Basics</h4>
            <p>Learn how to manage projects and track customer interactions.</p>
            <p className="tutorial-duration">6:05</p>
          </div>
        </div>
      </div>
      
      <div className="more-tutorials">
        <a href="#" className="text-button">View All Tutorials</a>
      </div>
    </div>
  );
  
  const renderSupport = () => (
    <div className="support-section">
      <h3>Contact Support</h3>
      
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
      
      <div className="support-form">
        <div className="form-group">
          <label>Subject: <span className="required">*</span></label>
          <input 
            type="text" 
            value={supportRequest.subject} 
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Brief description of your issue"
          />
        </div>
        
        <div className="form-group">
          <label>Category:</label>
          <select 
            value={supportRequest.category} 
            onChange={(e) => handleInputChange('category', e.target.value)}
          >
            <option value="general">General Question</option>
            <option value="quote">Quote Processing</option>
            <option value="comparison">Price Comparison</option>
            <option value="visualization">Visualization Tool</option>
            <option value="account">Account & Settings</option>
            <option value="technical">Technical Issue</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Description: <span className="required">*</span></label>
          <textarea 
            value={supportRequest.description} 
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Please provide details about your issue or question"
            rows={6}
          ></textarea>
        </div>
        
        <div className="form-group">
          <label>Priority:</label>
          <select 
            value={supportRequest.priority} 
            onChange={(e) => handleInputChange('priority', e.target.value)}
          >
            <option value="low">Low - General question</option>
            <option value="normal">Normal - Need assistance</option>
            <option value="high">High - Affecting my work</option>
            <option value="urgent">Urgent - Critical issue</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button 
            className="primary-button" 
            onClick={handleSubmitRequest}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
      
      <div className="support-contact">
        <h4>Need immediate assistance?</h4>
        <p>Contact our support team directly:</p>
        <p><strong>Phone:</strong> (555) 123-4567</p>
        <p><strong>Email:</strong> support@warnkewindows.com</p>
        <p><strong>Hours:</strong> Monday-Friday, 8:00 AM - 5:00 PM CT</p>
      </div>
    </div>
  );
  
  const renderResources = () => (
    <div className="resources-section">
      <h3>Resources & Downloads</h3>
      
      <div className="resource-category">
        <h4>User Guides</h4>
        
        <div className="resource-list">
          <div className="resource-item">
            <i className="icon-pdf"></i>
            <div className="resource-details">
              <p className="resource-title">WindowVisor Dashboard User Guide</p>
              <p className="resource-description">Complete user guide for the WindowVisor Dashboard.</p>
            </div>
            <button className="secondary-button">Download</button>
          </div>
          
          <div className="resource-item">
            <i className="icon-pdf"></i>
            <div className="resource-details">
              <p className="resource-title">Quote Processing Guide</p>
              <p className="resource-description">Detailed guide for processing competitor quotes.</p>
            </div>
            <button className="secondary-button">Download</button>
          </div>
          
          <div className="resource-item">
            <i className="icon-pdf"></i>
            <div className="resource-details">
              <p className="resource-title">Visualization Tool Guide</p>
              <p className="resource-description">Instructions for using the window visualization tool.</p>
            </div>
            <button className="secondary-button">Download</button>
          </div>
        </div>
      </div>
      
      <div className="resource-category">
        <h4>Product Information</h4>
        
        <div className="resource-list">
          <div className="resource-item">
            <i className="icon-pdf"></i>
            <div className="resource-details">
              <p className="resource-title">Warnke Windows Product Catalog</p>
              <p className="resource-description">Complete catalog of Warnke Windows products.</p>
            </div>
            <button className="secondary-button">Download</button>
          </div>
          
          <div className="resource-item">
            <i className="icon-pdf"></i>
            <div className="resource-details">
              <p className="resource-title">Specification Sheets</p>
              <p className="resource-description">Technical specifications for all window products.</p>
            </div>
            <button className="secondary-button">Download</button>
          </div>
          
          <div className="resource-item">
            <i className="icon-pdf"></i>
            <div className="resource-details">
              <p className="resource-title">Installation Guidelines</p>
              <p className="resource-description">Installation instructions and best practices.</p>
            </div>
            <button className="secondary-button">Download</button>
          </div>
        </div>
      </div>
      
      <div className="resource-category">
        <h4>Sales Tools</h4>
        
        <div className="resource-list">
          <div className="resource-item">
            <i className="icon-ppt"></i>
            <div className="resource-details">
              <p className="resource-title">Warnke Windows Presentation Template</p>
              <p className="resource-description">PowerPoint template for customer presentations.</p>
            </div>
            <button className="secondary-button">Download</button>
          </div>
          
          <div className="resource-item">
            <i className="icon-doc"></i>
            <div className="resource-details">
              <p className="resource-title">Proposal Template</p>
              <p className="resource-description">Word template for customer proposals.</p>
            </div>
            <button className="secondary-button">Download</button>
          </div>
          
          <div className="resource-item">
            <i className="icon-zip"></i>
            <div className="resource-details">
              <p className="resource-title">Product Images</p>
              <p className="resource-description">High-resolution images of all products.</p>
            </div>
            <button className="secondary-button">Download</button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="help-page">
      <div className="section-header">
        <h2>Help & Support</h2>
      </div>
      
      <div className="help-navigation">
        <div 
          className={`nav-item ${activeSection === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveSection('faq')}
        >
          <i className="icon-faq"></i>
          <span>FAQ</span>
        </div>
        
        <div 
          className={`nav-item ${activeSection === 'tutorials' ? 'active' : ''}`}
          onClick={() => setActiveSection('tutorials')}
        >
          <i className="icon-video"></i>
          <span>Video Tutorials</span>
        </div>
        
        <div 
          className={`nav-item ${activeSection === 'support' ? 'active' : ''}`}
          onClick={() => setActiveSection('support')}
        >
          <i className="icon-support"></i>
          <span>Contact Support</span>
        </div>
        
        <div 
          className={`nav-item ${activeSection === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveSection('resources')}
        >
          <i className="icon-download"></i>
          <span>Resources</span>
        </div>
      </div>
      
      <div className="help-content">
        {activeSection === 'faq' && renderFAQ()}
        {activeSection === 'tutorials' && renderTutorials()}
        {activeSection === 'support' && renderSupport()}
        {activeSection === 'resources' && renderResources()}
      </div>
    </div>
  );
}