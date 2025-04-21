// Quote Verification Component for WindowVisor Dashboard
// This file implements the verification interface for extracted quote data

import React, { useState, useEffect } from 'react';
import { 
  getQuoteDetails, 
  getQuoteItems,
  updateQuoteItem,
  verifyQuote
} from '../backend/quoteManager';

export function QuoteVerification({ quoteId, onVerificationComplete, onCancel }) {
  const [quoteDetails, setQuoteDetails] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadQuoteData();
  }, [quoteId]);
  
  const loadQuoteData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load quote details and items
      const [details, items] = await Promise.all([
        getQuoteDetails(quoteId),
        getQuoteItems(quoteId)
      ]);
      
      setQuoteDetails(details);
      setQuoteItems(items);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load quote data:', error);
      setError('Failed to load quote data. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleItemUpdate = async (itemId, field, value) => {
    try {
      // Update item in UI immediately for responsiveness
      const updatedItems = quoteItems.map(item => {
        if (item.itemId === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      });
      
      setQuoteItems(updatedItems);
      
      // Update in backend
      await updateQuoteItem(itemId, field, value);
    } catch (error) {
      console.error('Failed to update item:', error);
      // Revert changes in UI
      loadQuoteData();
    }
  };
  
  const handleVerifyQuote = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      
      // Submit verification to backend
      const result = await verifyQuote(quoteId);
      
      setIsVerifying(false);
      
      // Notify parent of successful verification
      onVerificationComplete(result);
    } catch (error) {
      console.error('Verification failed:', error);
      setError(error.message || 'Failed to verify quote.');
      setIsVerifying(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="quote-verification">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading quote data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="quote-verification">
        <div className="error-message">
          <i className="icon-error"></i>
          <p>{error}</p>
        </div>
        <div className="form-actions">
          <button className="secondary-button" onClick={onCancel}>
            Back
          </button>
          <button className="primary-button" onClick={loadQuoteData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="quote-verification">
      <div className="section-header">
        <h2>Verify Quote Data</h2>
      </div>
      
      <div className="verification-instructions">
        <p>Please review the extracted quote data below. Edit any incorrect information.</p>
        <p>Items with low confidence scores may need your attention.</p>
      </div>
      
      <div className="quote-header">
        <div className="quote-header-item">
          <label>Competitor:</label>
          <p>{quoteDetails.competitorName}</p>
        </div>
        <div className="quote-header-item">
          <label>Quote Number:</label>
          <p>{quoteDetails.quoteNumber || 'N/A'}</p>
        </div>
        <div className="quote-header-item">
          <label>Quote Date:</label>
          <p>{quoteDetails.quoteDate ? new Date(quoteDetails.quoteDate).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="quote-header-item">
          <label>Total Amount:</label>
          <p>${quoteDetails.totalAmount.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="table-container">
        <table className="quote-items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Description</th>
              <th>Width (in)</th>
              <th>Height (in)</th>
              <th>Unit Price</th>
              <th>Total Price</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {quoteItems.map((item, index) => (
              <tr 
                key={item.itemId} 
                className={item.confidenceScore < 0.7 ? 'low-confidence' : ''}
              >
                <td>{index + 1}</td>
                <td>
                  <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => handleItemUpdate(item.itemId, 'quantity', parseInt(e.target.value, 10))}
                    min="1"
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={item.description} 
                    onChange={(e) => handleItemUpdate(item.itemId, 'description', e.target.value)}
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.widthInches} 
                    onChange={(e) => handleItemUpdate(item.itemId, 'widthInches', parseFloat(e.target.value))}
                    step="0.125"
                    min="0"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.heightInches} 
                    onChange={(e) => handleItemUpdate(item.itemId, 'heightInches', parseFloat(e.target.value))}
                    step="0.125"
                    min="0"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.unitPrice} 
                    onChange={(e) => handleItemUpdate(item.itemId, 'unitPrice', parseFloat(e.target.value))}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.totalPrice} 
                    onChange={(e) => handleItemUpdate(item.itemId, 'totalPrice', parseFloat(e.target.value))}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td>
                  <div className="confidence-indicator">
                    <div 
                      className="confidence-bar" 
                      style={{ 
                        width: `${item.confidenceScore * 100}%`,
                        backgroundColor: item.confidenceScore < 0.7 ? '#ffc107' : '#28a745'
                      }}
                    ></div>
                    <span>{Math.round(item.confidenceScore * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="add-item-container">
        <button 
          className="secondary-button"
          onClick={() => {
            const newItem = {
              itemId: `temp-${Date.now()}`,
              quantity: 1,
              description: '',
              widthInches: 0,
              heightInches: 0,
              unitPrice: 0,
              totalPrice: 0,
              confidenceScore: 1.0
            };
            setQuoteItems([...quoteItems, newItem]);
          }}
        >
          Add Item
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <i className="icon-error"></i>
          <p>{error}</p>
        </div>
      )}
      
      <div className="form-actions">
        <button 
          className="secondary-button" 
          onClick={onCancel}
          disabled={isVerifying}
        >
          Cancel
        </button>
        <button 
          className="primary-button" 
          onClick={handleVerifyQuote}
          disabled={isVerifying}
        >
          {isVerifying ? 'Verifying...' : 'Verify & Continue'}
        </button>
      </div>
    </div>
  );