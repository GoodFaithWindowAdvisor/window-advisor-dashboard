// Project Manager Backend Service for WindowVisor Dashboard
// This file implements the backend APIs for project management

import { 
  getCollection, 
  getDocument, 
  createDocument, 
  updateDocument,
  queryDocuments
} from 'wix-data';

// Collection names
const PROJECTS_COLLECTION = 'Projects';
const QUOTES_COLLECTION = 'CompetitorQuotes';
const COMPARISONS_COLLECTION = 'Comparisons';
const VISUALIZATIONS_COLLECTION = 'Visualizations';

/**
 * Get all projects for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of projects
 */
export async function getProjects(userId) {
  try {
    const query = queryDocuments(PROJECTS_COLLECTION)
      .eq('userId', userId)
      .descending('createdAt');
    
    const results = await query.find();
    
    // Enhance projects with counts
    const enhancedProjects = await Promise.all(
      results.items.map(async project => {
        const [quotesCount, comparisonsCount, visualizationsCount] = await Promise.all([
          getProjectItemsCount(QUOTES_COLLECTION, project._id),
          getProjectItemsCount(COMPARISONS_COLLECTION, project._id),
          getProjectItemsCount(VISUALIZATIONS_COLLECTION, project._id)
        ]);
        
        return {
          ...project,
          quotesCount,
          comparisonsCount,
          visualizationsCount
        };
      })
    );
    
    return enhancedProjects;
  } catch (error) {
    console.error('Failed to get projects:', error);
    throw new Error('Failed to get projects. Please try again.');
  }
}

/**
 * Get project details by ID
 * @param {string} projectId - The project ID
 * @returns {Promise<Object>} - Project details
 */
export async function getProjectById(projectId) {
  try {
    const project = await getDocument(PROJECTS_COLLECTION, projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Get counts for related items
    const [quotesCount, comparisonsCount, visualizationsCount] = await Promise.all([
      getProjectItemsCount(QUOTES_COLLECTION, projectId),
      getProjectItemsCount(COMPARISONS_COLLECTION, projectId),
      getProjectItemsCount(VISUALIZATIONS_COLLECTION, projectId)
    ]);
    
    return {
      ...project,
      quotesCount,
      comparisonsCount,
      visualizationsCount
    };
  } catch (error) {
    console.error('Failed to get project details:', error);
    throw new Error('Failed to get project details. Please try again.');
  }
}

/**
 * Get count of items for a project
 * @param {string} collection - The collection name
 * @param {string} projectId - The project ID
 * @returns {Promise<number>} - Count of items
 */
async function getProjectItemsCount(collection, projectId) {
  try {
    const query = queryDocuments(collection)
      .eq('projectId', projectId);
    
    const results = await query.count();
    return results.totalCount;
  } catch (error) {
    console.error(`Failed to get ${collection} count:`, error);
    return 0;
  }
}

/**
 * Create a new project
 * @param {Object} projectData - The project data
 * @returns {Promise<Object>} - Created project
 */
export async function createProject(projectData) {
  try {
    const now = new Date();
    
    const newProject = {
      ...projectData,
      createdAt: now,
      updatedAt: now,
      projectId: generateId()
    };
    
    const result = await createDocument(PROJECTS_COLLECTION, newProject);
    
    return {
      ...result,
      quotesCount: 0,
      comparisonsCount: 0,
      visualizationsCount: 0
    };
  } catch (error) {
    console.error('Failed to create project:', error);
    throw new Error('Failed to create project. Please try again.');
  }
}

/**
 * Update a project
 * @param {string} projectId - The project ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} - Updated project
 */
export async function updateProject(projectId, updates) {
  try {
    const project = await getDocument(PROJECTS_COLLECTION, projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await updateDocument(PROJECTS_COLLECTION, updatedProject);
    
    return result;
  } catch (error) {
    console.error('Failed to update project:', error);
    throw new Error('Failed to update project. Please try again.');
  }
}

/**
 * Update project notes
 * @param {string} projectId - The project ID
 * @param {string} notes - The new notes
 * @returns {Promise<Object>} - Updated project
 */
export async function updateProjectNotes(projectId, notes) {
  return updateProject(projectId, { notes });
}

/**
 * Get quotes for a project
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} - Array of quotes
 */
export async function getProjectQuotes(projectId) {
  try {
    const query = queryDocuments(QUOTES_COLLECTION)
      .eq('projectId', projectId)
      .descending('createdAt');
    
    const results = await query.find();
    return results.items;
  } catch (error) {
    console.error('Failed to get project quotes:', error);
    throw new Error('Failed to get project quotes. Please try again.');
  }
}

/**
 * Get comparisons for a project
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} - Array of comparisons
 */
export async function getProjectComparisons(projectId) {
  try {
    const query = queryDocuments(COMPARISONS_COLLECTION)
      .eq('projectId', projectId)
      .descending('createdAt');
    
    const results = await query.find();
    return results.items;
  } catch (error) {
    console.error('Failed to get project comparisons:', error);
    throw new Error('Failed to get project comparisons. Please try again.');
  }
}

/**
 * Get visualizations for a project
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} - Array of visualizations
 */
export async function getProjectVisualizations(projectId) {
  try {
    const query = queryDocuments(VISUALIZATIONS_COLLECTION)
      .eq('projectId', projectId)
      .descending('createdAt');
    
    const results = await query.find();
    return results.items;
  } catch (error) {
    console.error('Failed to get project visualizations:', error);
    throw new Error('Failed to get project visualizations. Please try again.');
  }
}

/**
 * Delete a project
 * @param {string} projectId - The project ID
 * @returns {Promise<boolean>} - Success flag
 */
export async function deleteProject(projectId) {
  try {
    // Delete project and all related items
    await Promise.all([
      deleteDocument(PROJECTS_COLLECTION, projectId),
      deleteProjectItems(QUOTES_COLLECTION, projectId),
      deleteProjectItems(COMPARISONS_COLLECTION, projectId),
      deleteProjectItems(VISUALIZATIONS_COLLECTION, projectId)
    ]);
    
    return true;
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw new Error('Failed to delete project. Please try again.');
  }
}

/**
 * Delete all items for a project from a collection
 * @param {string} collection - The collection name
 * @param {string} projectId - The project ID
 * @returns {Promise<void>}
 */
async function deleteProjectItems(collection, projectId) {
  try {
    const query = queryDocuments(collection)
      .eq('projectId', projectId);
    
    const results = await query.find();
    
    const deletePromises = results.items.map(item => 
      deleteDocument(collection, item._id)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error(`Failed to delete project items from ${collection}:`, error);
    throw error;
  }
}

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
