// Visualization Manager Backend Service for WindowVisor Dashboard
// This file implements the backend APIs for visualization management

import { 
  getCollection, 
  getDocument, 
  createDocument, 
  updateDocument,
  queryDocuments,
  uploadFile
} from 'wix-data';

// Collection names
const VISUALIZATIONS_COLLECTION = 'Visualizations';
const PRODUCTS_COLLECTION = 'WarnkeProducts';

/**
 * Upload a photo and create a new visualization
 * @param {string} projectId - The project ID
 * @param {File} file - The photo file
 * @param {Function} progressCallback - Callback for upload progress
 * @returns {Promise<Object>} - Created visualization
 */
export async function uploadVisualizationPhoto(projectId, file, progressCallback) {
  try {
    // Upload file to media manager
    const uploadResult = await uploadFile(file, {
      progressHandler: (uploaded, total) => {
        const progress = Math.round((uploaded / total) * 100);
        if (progressCallback) {
          progressCallback(progress);
        }
      }
    });
    
    const photoUrl = uploadResult.fileUrl;
    
    // Create visualization record
    const now = new Date();
    
    const newVisualization = {
      projectId,
      photoUrl,
      renderedImageUrl: null,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      roomLocation: '',
      placedWindows: [],
      createdAt: now,
      updatedAt: now,
      visualizationId: generateId()
    };
    
    const result = await createDocument(VISUALIZATIONS_COLLECTION, newVisualization);
    
    return result;
  } catch (error) {
    console.error('Failed to upload visualization photo:', error);
    throw new Error('Failed to upload visualization photo. Please try again.');
  }
}

/**
 * Get visualization details
 * @param {string} visualizationId - The visualization ID
 * @returns {Promise<Object>} - Visualization details
 */
export async function getVisualizationDetails(visualizationId) {
  try {
    const visualization = await getDocument(VISUALIZATIONS_COLLECTION, visualizationId);
    
    if (!visualization) {
      throw new Error('Visualization not found');
    }
    
    return visualization;
  } catch (error) {
    console.error('Failed to get visualization details:', error);
    throw new Error('Failed to get visualization details. Please try again.');
  }
}

/**
 * Get Warnke Windows product catalog
 * @returns {Promise<Array>} - Products catalog
 */
export async function getWarnkeProducts() {
  try {
    const query = queryDocuments(PRODUCTS_COLLECTION);
    
    const results = await query.find();
    return results.items;
  } catch (error) {
    console.error('Failed to get Warnke products:', error);
    throw new Error('Failed to get Warnke products. Please try again.');
  }
}

/**
 * Save visualization
 * @param {Object} visualizationData - The visualization data
 * @returns {Promise<Object>} - Saved visualization
 */
export async function saveVisualization(visualizationData) {
  try {
    const { visualizationId, roomLocation, placedWindows, renderedImageUrl } = visualizationData;
    
    // Get current visualization
    const visualization = await getDocument(VISUALIZATIONS_COLLECTION, visualizationId);
    
    if (!visualization) {
      throw new Error('Visualization not found');
    }
    
    // Update with new data
    const updatedVisualization = {
      ...visualization,
      roomLocation,
      placedWindows,
      renderedImageUrl,
      updatedAt: new Date()
    };
    
    // Save visualization
    const result = await updateDocument(VISUALIZATIONS_COLLECTION, updatedVisualization);
    
    return result;
  } catch (error) {
    console.error('Failed to save visualization:', error);
    throw new Error('Failed to save visualization. Please try again.');
  }
}

/**
 * Get all visualizations for a project
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} - Array of visualizations
 */
export async function getProjectVisualizations(projectId) {
  try {
    const query = queryDocuments(VISUALIZATIONS_COLLECTION)
      .eq('projectId', projectId)
      .descending('createdAt');
    
    const results = await query.find();
    
    // Enhance visualizations with window counts
    const enhancedVisualizations = results.items.map(visualization => {
      const windowCount = visualization.placedWindows ? visualization.placedWindows.length : 0;
      
      return {
        ...visualization,
        productCount: windowCount
      };
    });
    
    return enhancedVisualizations;
  } catch (error) {
    console.error('Failed to get project visualizations:', error);
    throw new Error('Failed to get project visualizations. Please try again.');
  }
}

/**
 * Delete a visualization
 * @param {string} visualizationId - The visualization ID
 * @returns {Promise<boolean>} - Success flag
 */
export async function deleteVisualization(visualizationId) {
  try {
    await deleteDocument(VISUALIZATIONS_COLLECTION, visualizationId);
    return true;
  } catch (error) {
    console.error('Failed to delete visualization:', error);
    throw new Error('Failed to delete visualization. Please try again.');
  }
}

/**
 * Clone a visualization
 * @param {string} visualizationId - The visualization ID to clone
 * @returns {Promise<Object>} - Cloned visualization
 */
export async function cloneVisualization(visualizationId) {
  try {
    // Get original visualization
    const visualization = await getDocument(VISUALIZATIONS_COLLECTION, visualizationId);
    
    if (!visualization) {
      throw new Error('Visualization not found');
    }
    
    // Create new visualization record with cloned data
    const now = new Date();
    
    const clonedVisualization = {
      projectId: visualization.projectId,
      photoUrl: visualization.photoUrl,
      renderedImageUrl: null, // Reset rendered image
      fileName: visualization.fileName,
      fileSize: visualization.fileSize,
      fileType: visualization.fileType,
      roomLocation: `${visualization.roomLocation} (Copy)`,
      placedWindows: visualization.placedWindows,
      createdAt: now,
      updatedAt: now,
      visualizationId: generateId()
    };
    
    const result = await createDocument(VISUALIZATIONS_COLLECTION, clonedVisualization);
    
    return result;
  } catch (error) {
    console.error('Failed to clone visualization:', error);
    throw new Error('Failed to clone visualization. Please try again.');
  }
}

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}