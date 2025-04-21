// Quote Uploader Component for WindowVisor Dashboard
// This file implements the quote document upload and processing

import React, { useState } from 'react';
import { uploadQuote, processQuote } from '../backend/quoteManager';

export function QuoteUploader({ projectId, onUploadComplete, onCancel }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [competitorName, setCompetitorName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedQuoteId, setUploadedQuoteId] = useState(null);
  const [error, setError] = useState(null);
  
  const competitors = [
    { id: 'andersen', name: 'Andersen' },
    { id: 'marvin', name: 'Marvin' },
    { id: 'pella', name: 'Pella' },
    { id: 'provia', name: 'ProVia' },
    { id: 'windsor', name: 'Windsor' },
    { id: 'thermotech', name: 'Thermo-Tech' },
    { id: 'other', name: 'Other' }
  ];
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };
  
  const handleCompetitorChange = (event) => {
    setCompetitorName(event.target.value);
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    
    if (!competitorName) {
      setError('Please select a competitor.');
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      // Upload the file
      const uploadResult = await uploadQuote(
        projectId, 
        selectedFile, 
        competitorName,
        (progress) => setUploadProgress(progress)
      );
      
      setUploadedQuoteId(uploadResult.quoteId);
      setIsUploading(false);
      setIsProcessing(true);
      
      // Process the uploaded quote
      const processResult = await processQuote(uploadResult.quoteId);
      
      setIsProcessing(false);
      
      // Notify parent of successful upload
      onUploadComplete(processResult);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.message || 'Failed to upload and process quote.');
      setIsUploading(false);
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="document-uploader">
      <div className="section-header">
        <h2>Upload Competitor Quote</h2>
      </div>
      
      <div className="upload-instructions">
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Upload a competitor quote in PDF, JPG, or PNG format.</li>
          <li>Maximum file size: 10MB</li>
          <li>Supported competitors: Andersen, Marvin, Pella, ProVia, Windsor, Thermo-Tech</li>
          <li>The system will automatically extract product and pricing information.</li>
        </ul>
      </div>
      
      <div className="form-group">
        <label>Select Competitor:</label>
        <select 
          value={competitorName} 
          onChange={handleCompetitorChange}
          disabled={isUploading || isProcessing}
        >
          <option value="">Select a competitor</option>
          {competitors.map(competitor => (
            <option key={competitor.id} value={competitor.id}>
              {competitor.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>Quote Document:</label>
        <input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png" 
          onChange={handleFileChange}
          disabled={isUploading || isProcessing}
        />
        
        {selectedFile && (
          <div className="file-info">
            <span>{selectedFile.name}</span>
            <span>{Math.round(selectedFile.size / 1024)} KB</span>
          </div>
        )}
      </div>
      
      {isUploading && (
        <>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${uploadProgress}%` }}></div>
            <span>{uploadProgress}%</span>
          </div>
          <p className="processing-status">Uploading document...</p>
        </>
      )}
      
      {isProcessing && (
        <div className="processing-status">
          <div className="spinner"></div>
          <div>
            <p><strong>Processing quote...</strong></p>
            <p>Extracting product information and pricing.</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <i className="icon-error"></i>
          <p>{error}</p>
        </div>
      )}
      
      {uploadedQuoteId && !isProcessing && !error && (
        <div className="success-message">
          <i className="icon-success"></i>
          <p>Quote uploaded and processed successfully!</p>
        </div>
      )}
      
      <div className="form-actions">
        <button 
          className="secondary-button" 
          onClick={onCancel}
          disabled={isUploading || isProcessing}
        >
          Cancel
        </button>
        <button 
          className="primary-button" 
          onClick={handleUpload}
          disabled={!selectedFile || !competitorName || isUploading || isProcessing}
        >
          {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : 'Upload Quote'}
        </button>
      </div>
    </div>
  );
}