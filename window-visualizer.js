// Window Visualizer Component for WindowVisor Dashboard
// This file implements the visualization tool for window options

import React, { useState, useEffect, useRef } from 'react';
import { 
  getVisualizationDetails, 
  getWarnkeProducts,
  saveVisualization
} from '../backend/visualizationManager';

export function WindowVisualizer({ 
  visualizationId, 
  onSaveComplete, 
  onCreateNew, 
  onBack 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [visualization, setVisualization] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('normal'); // normal, split, before
  const [roomLocation, setRoomLocation] = useState('');
  
  // Selected product options
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [frameMaterial, setFrameMaterial] = useState('vinyl');
  const [frameColor, setFrameColor] = useState('white');
  const [glassType, setGlassType] = useState('double-pane');
  const [gridPattern, setGridPattern] = useState('none');
  
  // Canvas references
  const canvasRef = useRef(null);
  const photoRef = useRef(null);
  
  // Window placement state
  const [isPlacingWindow, setIsPlacingWindow] = useState(false);
  const [placedWindows, setPlacedWindows] = useState([]);
  const [activeWindowIndex, setActiveWindowIndex] = useState(-1);
  
  useEffect(() => {
    loadData();
  }, [visualizationId]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load visualization details and products
      const [visualizationData, productsData] = await Promise.all([
        getVisualizationDetails(visualizationId),
        getWarnkeProducts()
      ]);
      
      setVisualization(visualizationData);
      setProducts(productsData);
      
      // Set initial values from visualization data
      if (visualizationData.roomLocation) {
        setRoomLocation(visualizationData.roomLocation);
      }
      
      if (visualizationData.placedWindows && visualizationData.placedWindows.length > 0) {
        setPlacedWindows(visualizationData.placedWindows);
        
        // Set product and options from first window
        const firstWindow = visualizationData.placedWindows[0];
        if (firstWindow.productId) {
          const product = productsData.find(p => p.productId === firstWindow.productId);
          if (product) {
            setSelectedProduct(product);
          }
        }
        
        if (firstWindow.options) {
          setFrameMaterial(firstWindow.options.frameMaterial || 'vinyl');
          setFrameColor(firstWindow.options.frameColor || 'white');
          setGlassType(firstWindow.options.glassType || 'double-pane');
          setGridPattern(firstWindow.options.gridPattern || 'none');
        }
      } else if (productsData.length > 0) {
        // Set default product
        setSelectedProduct(productsData[0]);
      }
      
      setIsLoading(false);
      
      // Initialize canvas after loading
      setTimeout(initCanvas, 100);
      
    } catch (error) {
      console.error('Failed to load visualization data:', error);
      setError(error.message || 'Failed to load visualization data.');
      setIsLoading(false);
    }
  };
  
  const initCanvas = () => {
    if (!canvasRef.current || !photoRef.current || !visualization) return;
    
    const canvas = canvasRef.current;
    const photo = photoRef.current;
    
    // Adjust canvas size to match photo
    canvas.width = photo.width;
    canvas.height = photo.height;
    
    // Draw existing windows
    drawWindows();
  };
  
  const drawWindows = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each window
    placedWindows.forEach((window, index) => {
      const { x, y, width, height } = window;
      
      // Draw window frame
      ctx.fillStyle = index === activeWindowIndex ? 'rgba(201, 177, 106, 0.4)' : 'rgba(26, 60, 100, 0.4)';
      ctx.fillRect(x, y, width, height);
      
      // Draw window border
      ctx.strokeStyle = index === activeWindowIndex ? '#c9b16a' : '#1a3c64';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // If grid pattern is selected, draw grid lines
      if (window.options && window.options.gridPattern !== 'none') {
        drawGridPattern(ctx, window);
      }
      
      // Draw resize handles if active
      if (index === activeWindowIndex) {
        drawResizeHandles(ctx, window);
      }
    });
  };
  
  const drawGridPattern = (ctx, window) => {
    const { x, y, width, height, options } = window;
    const pattern = options.gridPattern || 'none';
    
    if (pattern === 'none') return;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    if (pattern === 'colonial') {
      // Colonial pattern (evenly spaced grid)
      const cellsX = 3;
      const cellsY = 3;
      
      // Draw vertical lines
      for (let i = 1; i < cellsX; i++) {
        const lineX = x + (width / cellsX) * i;
        ctx.beginPath();
        ctx.moveTo(lineX, y);
        ctx.lineTo(lineX, y + height);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let i = 1; i < cellsY; i++) {
        const lineY = y + (height / cellsY) * i;
        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x + width, lineY);
        ctx.stroke();
      }
    } else if (pattern === 'prairie') {
      // Prairie pattern (border with inset squares)
      const inset = width * 0.15;
      
      // Draw outer border
      ctx.strokeRect(x + inset, y + inset, width - inset * 2, height - inset * 2);
      
      // Draw corner squares
      const cornerSize = Math.min(width, height) * 0.1;
      
      // Top left
      ctx.strokeRect(x + inset, y + inset, cornerSize, cornerSize);
      
      // Top right
      ctx.strokeRect(x + width - inset - cornerSize, y + inset, cornerSize, cornerSize);
      
      // Bottom left
      ctx.strokeRect(x + inset, y + height - inset - cornerSize, cornerSize, cornerSize);
      
      // Bottom right
      ctx.strokeRect(
        x + width - inset - cornerSize, 
        y + height - inset - cornerSize, 
        cornerSize, 
        cornerSize
      );
    } else if (pattern === 'diamond') {
      // Diamond pattern
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const size = Math.min(width, height) * 0.3;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size);
      ctx.lineTo(centerX + size, centerY);
      ctx.lineTo(centerX, centerY + size);
      ctx.lineTo(centerX - size, centerY);
      ctx.closePath();
      ctx.stroke();
    }
  };
  
  const drawResizeHandles = (ctx, window) => {
    const { x, y, width, height } = window;
    const handleSize = 8;
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1a3c64';
    ctx.lineWidth = 1;
    
    // Draw corner handles
    [
      { x: x - handleSize / 2, y: y - handleSize / 2 },
      { x: x + width - handleSize / 2, y: y - handleSize / 2 },
      { x: x - handleSize / 2, y: y + height - handleSize / 2 },
      { x: x + width - handleSize / 2, y: y + height - handleSize / 2 }
    ].forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };
  
  const handleCanvasClick = (event) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (isPlacingWindow) {
      // Place a new window
      const newWindow = {
        x: x - 100,
        y: y - 75,
        width: 200,
        height: 150,
        productId: selectedProduct ? selectedProduct.productId : null,
        options: {
          frameMaterial,
          frameColor,
          glassType,
          gridPattern
        }
      };
      
      setPlacedWindows([...placedWindows, newWindow]);
      setActiveWindowIndex(placedWindows.length);
      setIsPlacingWindow(false);
      
      // Redraw windows
      setTimeout(drawWindows, 50);
    } else {
      // Check if clicked on a window
      let clickedIndex = -1;
      
      for (let i = placedWindows.length - 1; i >= 0; i--) {
        const window = placedWindows[i];
        if (
          x >= window.x && 
          x <= window.x + window.width && 
          y >= window.y && 
          y <= window.y + window.height
        ) {
          clickedIndex = i;
          break;
        }
      }
      
      setActiveWindowIndex(clickedIndex);
      drawWindows();
    }
  };
  
  const handleProductChange = (event) => {
    const productId = event.target.value;
    const product = products.find(p => p.productId === productId);
    setSelectedProduct(product);
    
    // Update active window if there is one
    if (activeWindowIndex >= 0) {
      const updatedWindows = [...placedWindows];
      updatedWindows[activeWindowIndex] = {
        ...updatedWindows[activeWindowIndex],
        productId
      };
      setPlacedWindows(updatedWindows);
      drawWindows();
    }
  };
  
  const handleOptionChange = (option, value) => {
    // Update state based on which option changed
    switch (option) {
      case 'frameMaterial':
        setFrameMaterial(value);
        break;
      case 'frameColor':
        setFrameColor(value);
        break;
      case 'glassType':
        setGlassType(value);
        break;
      case 'gridPattern':
        setGridPattern(value);
        break;
      default:
        break;
    }
    
    // Update active window if there is one
    if (activeWindowIndex >= 0) {
      const updatedWindows = [...placedWindows];
      updatedWindows[activeWindowIndex] = {
        ...updatedWindows[activeWindowIndex],
        options: {
          ...updatedWindows[activeWindowIndex].options,
          [option]: value
        }
      };
      setPlacedWindows(updatedWindows);
      drawWindows();
    }
  };
  
  const handleRemoveWindow = () => {
    if (activeWindowIndex < 0) return;
    
    const updatedWindows = placedWindows.filter((_, index) => index !== activeWindowIndex);
    setPlacedWindows(updatedWindows);
    setActiveWindowIndex(-1);
    
    setTimeout(drawWindows, 50);
  };
  
  const handleSaveVisualization = async () => {
    if (placedWindows.length === 0) {
      setError('Please add at least one window to the visualization.');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Create canvas with photo and windows
      const canvas = canvasRef.current;
      const photo = photoRef.current;
      
      const renderCanvas = document.createElement('canvas');
      renderCanvas.width = photo.width;
      renderCanvas.height = photo.height;
      
      const ctx = renderCanvas.getContext('2d');
      ctx.drawImage(photo, 0, 0, photo.width, photo.height);
      
      // Draw windows on rendering canvas
      placedWindows.forEach(window => {
        const { x, y, width, height, options } = window;
        
        // Draw window based on selected options
        ctx.fillStyle = options.frameColor === 'white' ? 'rgba(255, 255, 255, 0.85)' : 
                        options.frameColor === 'black' ? 'rgba(30, 30, 30, 0.85)' :
                        options.frameColor === 'bronze' ? 'rgba(139, 69, 19, 0.85)' :
                        'rgba(255, 255, 255, 0.85)';
        
        // Draw frame
        const frameWidth = 10;
        ctx.fillRect(x, y, width, height);
        ctx.clearRect(x + frameWidth, y + frameWidth, width - frameWidth * 2, height - frameWidth * 2);
        
        // Draw glass
        ctx.fillStyle = options.glassType === 'single-pane' ? 'rgba(200, 200, 255, 0.3)' :
                        options.glassType === 'double-pane' ? 'rgba(180, 180, 230, 0.4)' :
                        options.glassType === 'triple-pane' ? 'rgba(160, 160, 210, 0.5)' :
                        'rgba(180, 180, 230, 0.4)';
        
        ctx.fillRect(x + frameWidth, y + frameWidth, width - frameWidth * 2, height - frameWidth * 2);
        
        // Draw grid pattern if selected
        if (options.gridPattern !== 'none') {
          ctx.strokeStyle = options.frameColor === 'white' ? '#ffffff' : 
                           options.frameColor === 'black' ? '#333333' :
                           options.frameColor === 'bronze' ? '#8b4513' :
                           '#ffffff';
          ctx.lineWidth = 2;
          
          if (options.gridPattern === 'colonial') {
            // Colonial pattern (evenly spaced grid)
            const cellsX = 3;
            const cellsY = 3;
            
            // Draw vertical lines
            for (let i = 1; i < cellsX; i++) {
              const lineX = x + frameWidth + ((width - frameWidth * 2) / cellsX) * i;
              ctx.beginPath();
              ctx.moveTo(lineX, y + frameWidth);
              ctx.lineTo(lineX, y + height - frameWidth);
              ctx.stroke();
            }
            
            // Draw horizontal lines
            for (let i = 1; i < cellsY; i++) {
              const lineY = y + frameWidth + ((height - frameWidth * 2) / cellsY) * i;
              ctx.beginPath();
              ctx.moveTo(x + frameWidth, lineY);
              ctx.lineTo(x + width - frameWidth, lineY);
              ctx.stroke();
            }
          } else if (options.gridPattern === 'prairie') {
            // Prairie pattern logic
            const inset = Math.min(width, height) * 0.1;
            
            // Draw outer border
            ctx.strokeRect(
              x + frameWidth + inset, 
              y + frameWidth + inset, 
              width - frameWidth * 2 - inset * 2, 
              height - frameWidth * 2 - inset * 2
            );
            
            // Draw corner squares
            const cornerSize = Math.min(width, height) * 0.05;
            
            // Top left
            ctx.strokeRect(
              x + frameWidth + inset, 
              y + frameWidth + inset, 
              cornerSize, 
              cornerSize
            );
            
            // Top right
            ctx.strokeRect(
              x + width - frameWidth - inset - cornerSize, 
              y + frameWidth + inset, 
              cornerSize, 
              cornerSize
            );
            
            // Bottom left
            ctx.strokeRect(
              x + frameWidth + inset, 
              y + height - frameWidth - inset - cornerSize, 
              cornerSize, 
              cornerSize
            );
            
            // Bottom right
            ctx.strokeRect(
              x + width - frameWidth - inset - cornerSize, 
              y + height - frameWidth - inset - cornerSize, 
              cornerSize, 
              cornerSize
            );
          } else if (options.gridPattern === 'diamond') {
            // Diamond pattern
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const size = Math.min(width - frameWidth * 2, height - frameWidth * 2) * 0.3;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - size);
            ctx.lineTo(centerX + size, centerY);
            ctx.lineTo(centerX, centerY + size);
            ctx.lineTo(centerX - size, centerY);
            ctx.closePath();
            ctx.stroke();
          }
        }
      });
      
      // Convert canvas to data URL
      const renderedImageUrl = renderCanvas.toDataURL('image/png');
      
      // Save visualization to backend
      const saveResult = await saveVisualization({
        visualizationId,
        roomLocation,
        placedWindows,
        renderedImageUrl
      });
      
      setIsSaving(false);
      
      // Notify parent of successful save
      onSaveComplete(saveResult);
      
    } catch (error) {
      console.error('Failed to save visualization:', error);
      setError(error.message || 'Failed to save visualization.');
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="window-visualizer">
        <div className="section-header">
          <h2>Window Visualizer</h2>
        </div>
        
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading visualization...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="window-visualizer">
        <div className="section-header">
          <h2>Window Visualizer</h2>
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
    <div className="window-visualizer">
      <div className="section-header">
        <h2>Window Visualizer</h2>
      </div>
      
      <div className="form-group">
        <label>Room/Location Description:</label>
        <input 
          type="text" 
          value={roomLocation} 
          onChange={(e) => setRoomLocation(e.target.value)}
          placeholder="e.g. Front Living Room, Kitchen East Wall"
        />
      </div>
      
      <div className="visualization-controls">
        <div className="view-controls">
          <h3>View Options</h3>
          <div className="view-buttons">
            <button 
              className={`view-button ${viewMode === 'normal' ? 'active' : ''}`}
              onClick={() => setViewMode('normal')}
            >
              Normal View
            </button>
            <button 
              className={`view-button ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              Split View
            </button>
            <button 
              className={`view-button ${viewMode === 'before' ? 'active' : ''}`}
              onClick={() => setViewMode('before')}
            >
              Before Only
            </button>
          </div>
          
          <div className="window-actions">
            <button 
              className={`secondary-button ${isPlacingWindow ? 'active' : ''}`}
              onClick={() => setIsPlacingWindow(!isPlacingWindow)}
            >
              {isPlacingWindow ? 'Cancel' : 'Add Window'}
            </button>
            <button 
              className="secondary-button"
              onClick={handleRemoveWindow}
              disabled={activeWindowIndex < 0}
            >
              Remove Selected
            </button>
          </div>
        </div>
        
        <div className="product-selection">
          <h3>Window Selection</h3>
          <div className="form-group">
            <label>Window Type:</label>
            <select 
              value={selectedProduct ? selectedProduct.productId : ''}
              onChange={handleProductChange}
            >
              {products.map(product => (
                <option key={product.productId} value={product.productId}>
                  {product.productName}
                </option>
              ))}
            </select>
          </div>
          
          {selectedProduct && (
            <div className="product-description">
              <p>{selectedProduct.description}</p>
            </div>
          )}
        </div>
        
        <div className="option-controls">
          <div className="option-group">
            <h3>Frame Material</h3>
            <div className="option-buttons">
              <button 
                className={`option-button ${frameMaterial === 'vinyl' ? 'active' : ''}`}
                onClick={() => handleOptionChange('frameMaterial', 'vinyl')}
              >
                Vinyl
              </button>
              <button 
                className={`option-button ${frameMaterial === 'fiberglass' ? 'active' : ''}`}
                onClick={() => handleOptionChange('frameMaterial', 'fiberglass')}
              >
                Fiberglass
              </button>
              <button 
                className={`option-button ${frameMaterial === 'wood' ? 'active' : ''}`}
                onClick={() => handleOptionChange('frameMaterial', 'wood')}
              >
                Wood
              </button>
            </div>
          </div>
          
          <div className="option-group">
            <h3>Frame Color</h3>
            <div className="option-buttons">
              <button 
                className={`option-button ${frameColor === 'white' ? 'active' : ''}`}
                onClick={() => handleOptionChange('frameColor', 'white')}
              >
                White
              </button>
              <button 
                className={`option-button ${frameColor === 'black' ? 'active' : ''}`}
                onClick={() => handleOptionChange('frameColor', 'black')}
              >
                Black
              </button>
              <button 
                className={`option-button ${frameColor === 'bronze' ? 'active' : ''}`}
                onClick={() => handleOptionChange('frameColor', 'bronze')}
              >
                Bronze
              </button>
            </div>
          </div>
          
          <div className="option-group">
            <h3>Glass Type</h3>
            <div className="option-buttons">
              <button 
                className={`option-button ${glassType === 'single-pane' ? 'active' : ''}`}
                onClick={() => handleOptionChange('glassType', 'single-pane')}
              >
                Single Pane
              </button>
              <button 
                className={`option-button ${glassType === 'double-pane' ? 'active' : ''}`}
                onClick={() => handleOptionChange('glassType', 'double-pane')}
              >
                Double Pane
              </button>
              <button 
                className={`option-button ${glassType === 'triple-pane' ? 'active' : ''}`}
                onClick={() => handleOptionChange('glassType', 'triple-pane')}
              >
                Triple Pane
              </button>
            </div>
          </div>
          
          <div className="option-group">
            <h3>Grid Pattern</h3>
            <div className="option-buttons">
              <button 
                className={`option-button ${gridPattern === 'none' ? 'active' : ''}`}
                onClick={() => handleOptionChange('gridPattern', 'none')}
              >
                No Grid
              </button>
              <button 
                className={`option-button ${gridPattern === 'colonial' ? 'active' : ''}`}
                onClick={() => handleOptionChange('gridPattern', 'colonial')}
              >
                Colonial
              </button>
              <button 
                className={`option-button ${gridPattern === 'prairie' ? 'active' : ''}`}
                onClick={() => handleOptionChange('gridPattern', 'prairie')}
              >
                Prairie
              </button>
              <button 
                className={`option-button ${gridPattern === 'diamond' ? 'active' : ''}`}
                onClick={() => handleOptionChange('gridPattern', 'diamond')}
              >
                Diamond
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="visualization-canvas-container">
        <img 
          ref={photoRef}
          src={visualization.photoUrl}
          alt="Home visualization"
          style={{ display: viewMode === 'before' ? 'block' : 'none' }}
          onLoad={initCanvas}
        />
        
        {viewMode !== 'before' && (
          <div className={`canvas-wrapper ${viewMode === 'split' ? 'split-view' : ''}`}>
            {viewMode === 'split' && (
              <img 
                src={visualization.photoUrl}
                alt="Home before"
                className="before-image"
              />
            )}
            <canvas 
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{ cursor: isPlacingWindow ? 'crosshair' : 'default' }}
            />
          </div>
        )}
        
        <div className="canvas-controls">
          <button 
            className="icon-button"
            title="Zoom In"
          >
            <i className="icon-zoom-in"></i>
          </button>
          <button 
            className="icon-button"
            title="Zoom Out"
          >
            <i className="icon-zoom-out"></i>
          </button>
          <button 
            className="icon-button"
            title="Reset View"
          >
            <i className="icon-reset"></i>
          </button>
        </div>
      </div>
      
      <div className="visualization-actions">
        <button 
          className="secondary-button" 
          onClick={onBack}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button 
          className="secondary-button" 
          onClick={onCreateNew}
          disabled={isSaving}
        >
          Create New Visualization
        </button>
        <button 
          className="primary-button" 
          onClick={handleSaveVisualization}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Visualization'}
        </button>
      </div>
    </div>
  );
}
          