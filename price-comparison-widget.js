// Price Comparison Widget for WindowVisor Dashboard
// This file implements the comparison between competitor and Warnke Windows products

import React, { useState, useEffect } from 'react';
import { 
  getQuoteDetails,
  generateComparison,
  getComparisonDetails, 
  getComparisonItems
} from '../backend/comparisonManager';

export function PriceComparisonWidget({ 
  quoteId, 
  projectId, 
  comparisonId,
  onComparisonGenerated,
  onVisualize, 
  onBack 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [comparisonItems, setComparisonItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadData();
  }, [quoteId, comparisonId]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load quote details
      const quote = await getQuoteDetails(quoteId);
      setQuoteDetails(quote);
      
      // If we have a comparison ID, load comparison details
      if (comparisonId) {
        const [comparisonDetails, items] = await Promise.all([
          getComparisonDetails(comparisonId),
          getComparisonItems(comparisonId)
        ]);
        
        setComparison(comparisonDetails);
        setComparisonItems(items);
      } else {
        // If no comparison ID, we need to generate one
        setIsGenerating(true);
        
        const generatedComparison = await generateComparison(quoteId, projectId);
        
        setComparison(generatedComparison.comparison);
        setComparisonItems(generatedComparison.items);
        
        // Notify parent of the generated comparison
        onComparisonGenerated(generatedComparison.comparison);
        
        setIsGenerating(false);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load comparison data:', error);
      setError(error.message || 'Failed to load comparison data.');
      setIsLoading(false);
      setIsGenerating(false);
    }
  };
  
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };
  
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };
  
  const getFilteredAndSortedItems = () => {
    let filtered = [...comparisonItems];
    
    // Apply filtering
    if (filter !== 'all') {
      filtered = filtered.filter(item => {
        if (filter === 'savings' && item.savingsAmount > 0) return true;
        if (filter === 'higher' && item.savingsAmount < 0) return true;
        if (filter === 'equivalent' && Math.abs(item.savingsAmount) < 10) return true;
        return false;
      });
    }
    
    // Apply sorting
    if (sortBy === 'savings-high') {
      filtered.sort((a, b) => b.savingsAmount - a.savingsAmount);
    } else if (sortBy === 'savings-low') {
      filtered.sort((a, b) => a.savingsAmount - b.savingsAmount);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.warnkePrice - a.warnkePrice);
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.warnkePrice - b.warnkePrice);
    }
    
    return filtered;
  };
  
  const renderComparisonContent = () => {
    const filteredItems = getFilteredAndSortedItems();
    
    return (
      <>
        <div className="comparison-summary">
          <div className="summary-item">
            <h3>Competitor Total</h3>
            <p className="price">${comparison.totalCompetitorPrice.toLocaleString()}</p>
          </div>
          
          <div className="summary-item">
            <h3>Warnke Windows Total</h3>
            <p className="price">${comparison.totalWarnkePrice.toLocaleString()}</p>
          </div>
          
          <div className="summary-item savings">
            <h3>Your Savings</h3>
            <p className="price">${comparison.savingsAmount.toLocaleString()}</p>
            <p className="percentage">{comparison.savingsPercentage.toFixed(1)}%</p>
          </div>
        </div>
        
        <div className="comparison-filters">
          <div className="filter-group">
            <label>Filter:</label>
            <select value={filter} onChange={handleFilterChange}>
              <option value="all">All Items</option>
              <option value="savings">Savings Only</option>
              <option value="higher">Higher Price Only</option>
              <option value="equivalent">Equivalent Price</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By:</label>
            <select value={sortBy} onChange={handleSortChange}>
              <option value="default">Default Order</option>
              <option value="savings-high">Highest Savings First</option>
              <option value="savings-low">Lowest Savings First</option>
              <option value="price-high">Highest Price First</option>
              <option value="price-low">Lowest Price First</option>
            </select>
          </div>
        </div>
        
        <div className="comparison-table-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Competitor Product</th>
                <th>Competitor Price</th>
                <th>Warnke Windows Product</th>
                <th>Warnke Windows Price</th>
                <th>Your Savings</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr 
                  key={item.comparisonItemId} 
                  className={item.savingsAmount > 0 ? 'savings-row' : ''}
                >
                  <td>{index + 1}</td>
                  <td>{item.quantity}</td>
                  <td className="product-cell">
                    <div className="product-name">{item.competitorProductDescription}</div>
                    <div className="product-details">
                      <span>{item.width}" × {item.height}"</span>
                      {item.competitorOptions && (
                        <span>{item.competitorOptions}</span>
                      )}
                    </div>
                  </td>
                  <td className="price-cell">
                    ${item.competitorPrice.toLocaleString()}
                    <div className="unit-price">
                      ${(item.competitorPrice / item.quantity).toLocaleString()} each
                    </div>
                  </td>
                  <td className="product-cell">
                    <div className="product-name">{item.warnkeProductName}</div>
                    <div className="product-options">
                      {item.warnkeProductDescription}
                    </div>
                    <div className="product-details">
                      <span>{item.width}" × {item.height}"</span>
                      {item.warnkeOptions && (
                        <span>{item.warnkeOptions}</span>
                      )}
                    </div>
                  </td>
                  <td className="price-cell">
                    ${item.warnkePrice.toLocaleString()}
                    <div className="unit-price">
                      ${(item.warnkePrice / item.quantity).toLocaleString()} each
                    </div>
                  </td>
                  <td className={`savings-cell ${item.savingsAmount >= 0 ? 'positive' : 'negative'}`}>
                    ${Math.abs(item.savingsAmount).toLocaleString()}
                    <div className="savings-percentage">
                      {item.savingsAmount >= 0 ? 'Save' : 'Add'} {item.savingsPercentage.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="3">Total</td>
                <td className="price-cell">${comparison.totalCompetitorPrice.toLocaleString()}</td>
                <td></td>
                <td className="price-cell">${comparison.totalWarnkePrice.toLocaleString()}</td>
                <td className={`savings-cell ${comparison.savingsAmount >= 0 ? 'positive' : 'negative'}`}>
                  ${Math.abs(comparison.savingsAmount).toLocaleString()}
                  <div className="savings-percentage">
                    {comparison.savingsAmount >= 0 ? 'Save' : 'Add'} {comparison.savingsPercentage.toFixed(1)}%
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="disclaimer">
          <p>* All prices include standard installation. Actual savings may vary based on site conditions and final measurements.</p>
        </div>
        
        <div className="comparison-actions">
          <button 
            className="secondary-button" 
            onClick={onBack}
          >
            Back to Project
          </button>
          <button 
            className="secondary-button" 
            onClick={() => window.print()}
          >
            Print Comparison
          </button>
          <button 
            className="primary-button" 
            onClick={() => onVisualize(comparison.comparisonId)}
          >
            Visualize Options
          </button>
        </div>
      </>
    );
  };
  
  if (isLoading || isGenerating) {
    return (
      <div className="comparison-widget">
        <div className="section-header">
          <h2>Price Comparison</h2>
        </div>
        
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>{isGenerating ? 'Generating comparison...' : 'Loading comparison data...'}</p>
          {isGenerating && (
            <p className="generating-info">We're matching competitor products with equivalent Warnke Windows options.</p>
          )}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="comparison-widget">
        <div className="section-header">
          <h2>Price Comparison</h2>
        </div>
        
        <div className="error-message">
          <i className="icon-error"></i>
          <p>{error}</p>
        </div>
        
        <div className="form-actions">
          <button className="secondary-button" onClick={onBack}>
            Back
          </button>
          <button className="primary-button" onClick={loadData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="comparison-widget">
      <div className="section-header">
        <h2>
          Price Comparison: {quoteDetails.competitorName} vs Warnke Windows
        </h2>
      </div>
      
      {comparison && renderComparisonContent()}
    </div>
  );
}