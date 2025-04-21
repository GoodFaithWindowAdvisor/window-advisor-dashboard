// Comparison Manager Backend Service for WindowVisor Dashboard
// This file implements the backend APIs for comparison management

import { 
  getCollection, 
  getDocument, 
  createDocument, 
  updateDocument,
  queryDocuments
} from 'wix-data';

import { getQuoteDetails, getQuoteItems } from './quoteManager';
import { getProducts, matchProduct } from './productManager';
import { calculatePrice } from '../window-calculator';

// Collection names
const QUOTES_COLLECTION = 'CompetitorQuotes';
const COMPARISONS_COLLECTION = 'Comparisons';
const COMPARISON_ITEMS_COLLECTION = 'ComparisonItems';
const PRODUCTS_COLLECTION = 'WarnkeProducts';

/**
 * Generate a comparison for a quote
 * @param {string} quoteId - The quote ID
 * @param {string} projectId - The project ID
 * @returns {Promise<Object>} - Generated comparison with items
 */
export async function generateComparison(quoteId, projectId) {
  try {
    // Get quote details and items
    const [quote, quoteItems, products] = await Promise.all([
      getQuoteDetails(quoteId),
      getQuoteItems(quoteId),
      getProducts()
    ]);
    
    // Create comparison record
    const now = new Date();
    
    const comparisonData = {
      projectId,
      quoteId,
      competitorName: quote.competitorName,
      totalCompetitorPrice: quote.totalAmount,
      totalWarnkePrice: 0, // To be calculated
      savingsAmount: 0, // To be calculated
      savingsPercentage: 0, // To be calculated
      status: 'generated',
      createdAt: now,
      updatedAt: now,
      comparisonId: generateId()
    };
    
    const comparison = await createDocument(COMPARISONS_COLLECTION, comparisonData);
    
    // Generate comparison items
    const comparisonItems = await generateComparisonItems(comparison.comparisonId, quoteItems, products);
    
    // Calculate total Warnke price and savings
    const totalWarnkePrice = comparisonItems.reduce((total, item) => total + item.warnkePrice, 0);
    const savingsAmount = quote.totalAmount - totalWarnkePrice;
    const savingsPercentage = quote.totalAmount > 0 ? (savingsAmount / quote.totalAmount) * 100 : 0;
    
    // Update comparison with calculated values
    const updatedComparison = await updateDocument(COMPARISONS_COLLECTION, {
      ...comparison,
      totalWarnkePrice,
      savingsAmount,
      savingsPercentage,
      updatedAt: now
    });
    
    return {
      comparison: updatedComparison,
      items: comparisonItems
    };
  } catch (error) {
    console.error('Failed to generate comparison:', error);
    throw new Error('Failed to generate comparison. Please try again.');
  }
}

/**
 * Generate comparison items
 * @param {string} comparisonId - The comparison ID
 * @param {Array} quoteItems - The quote items
 * @param {Array} products - The products catalog
 * @returns {Promise<Array>} - Generated comparison items
 */
async function generateComparisonItems(comparisonId, quoteItems, products) {
  const comparisonItems = [];
  
  for (const quoteItem of quoteItems) {
    try {
      // Match with Warnke product
      const matchedProduct = matchProduct(quoteItem, products);
      
      // Calculate Warnke price
      const priceCalculation = await calculateWarnkePrice(quoteItem, matchedProduct);
      
      // Create comparison item
      const comparisonItem = {
        comparisonId,
        quoteItemId: quoteItem.itemId,
        competitorProductDescription: quoteItem.description,
        competitorOptions: extractOptions(quoteItem.description),
        competitorPrice: quoteItem.totalPrice,
        warnkeProductId: matchedProduct.productId,
        warnkeProductName: matchedProduct.productName,
        warnkeProductDescription: matchedProduct.description,
        warnkeOptions: formatOptions(priceCalculation.options),
        warnkePrice: priceCalculation.totalPrice,
        width: quoteItem.widthInches,
        height: quoteItem.heightInches,
        quantity: quoteItem.quantity,
        savingsAmount: quoteItem.totalPrice - priceCalculation.totalPrice,
        savingsPercentage: quoteItem.totalPrice > 0 ? 
          ((quoteItem.totalPrice - priceCalculation.totalPrice) / quoteItem.totalPrice) * 100 : 0,
        matchConfidence: matchedProduct.confidence,
        createdAt: new Date(),
        updatedAt: new Date(),
        comparisonItemId: generateId()
      };
      
      const createdItem = await createDocument(COMPARISON_ITEMS_COLLECTION, comparisonItem);
      comparisonItems.push(createdItem);
    } catch (error) {
      console.error('Failed to generate comparison item:', error);
      // Continue with other items
    }
  }
  
  return comparisonItems;
}

/**
 * Calculate Warnke Windows price for a window
 * @param {Object} quoteItem - The quote item
 * @param {Object} matchedProduct - The matched Warnke product
 * @returns {Promise<Object>} - Price calculation result
 */
async function calculateWarnkePrice(quoteItem, matchedProduct) {
  try {
    // Extract width, height, and quantity
    const { widthInches, heightInches, quantity } = quoteItem;
    
    // Map window type
    const windowType = mapWindowType(matchedProduct.productName);
    
    // Map material
    const material = mapMaterial(matchedProduct.materialType);
    
    // Map glass type
    const glassType = mapGlassType(quoteItem.description);
    
    // Calculate price
    const measurements = {
      width: widthInches,
      height: heightInches,
      quantity
    };
    
    const options = {
      windowType,
      material,
      glassType
    };
    
    const calculation = await calculatePrice(measurements, options);
    
    return {
      totalPrice: calculation.totalPrice,
      pricePerWindow: calculation.pricePerWindow,
      basePrice: calculation.basePrice,
      optionsPrice: calculation.optionsPrice,
      options
    };
  } catch (error) {
    console.error('Failed to calculate Warnke price:', error);
    
    // Return a fallback price based on the matched product's base price
    return {
      totalPrice: quoteItem.quantity * matchedProduct.basePrice,
      pricePerWindow: matchedProduct.basePrice,
      basePrice: matchedProduct.basePrice,
      optionsPrice: 0,
      options: {
        windowType: 'double-hung',
        material: 'vinyl',
        glassType: 'double-pane'
      }
    };
  }
}

/**
 * Map window type from product name
 * @param {string} productName - The product name
 * @returns {string} - Mapped window type
 */
function mapWindowType(productName) {
  const name = productName.toLowerCase();
  
  if (name.includes('double-hung') || name.includes('double hung')) {
    return 'double-hung';
  } else if (name.includes('casement')) {
    return 'casement';
  } else if (name.includes('awning')) {
    return 'awning';
  } else if (name.includes('slider') || name.includes('sliding')) {
    return 'slider';
  } else if (name.includes('picture') || name.includes('fixed')) {
    return 'picture';
  } else if (name.includes('bay')) {
    return 'bay';
  } else if (name.includes('bow')) {
    return 'bow';
  } else if (name.includes('garden')) {
    return 'garden';
  } else {
    return 'double-hung'; // Default
  }
}

/**
 * Map material type
 * @param {string} materialType - The material type
 * @returns {string} - Mapped material
 */
function mapMaterial(materialType) {
  const material = materialType.toLowerCase();
  
  if (material.includes('vinyl')) {
    return 'vinyl';
  } else if (material.includes('fiberglass')) {
    return 'fiberglass';
  } else if (material.includes('wood')) {
    return 'wood';
  } else if (material.includes('aluminum')) {
    return 'aluminum';
  } else if (material.includes('composite')) {
    return 'composite';
  } else {
    return 'vinyl'; // Default
  }
}

/**
 * Map glass type from description
 * @param {string} description - The window description
 * @returns {string} - Mapped glass type
 */
function mapGlassType(description) {
  const desc = description.toLowerCase();
  
  if (desc.includes('triple') || desc.includes('3-pane') || desc.includes('3 pane')) {
    return 'triple-pane';
  } else if (desc.includes('single') || desc.includes('1-pane') || desc.includes('1 pane')) {
    return 'single-pane';
  } else {
    return 'double-pane'; // Default
  }
}

/**
 * Extract options from description
 * @param {string} description - The window description
 * @returns {string} - Extracted options
 */
function extractOptions(description) {
  // Extract options from description
  // This is a simplified approach
  const options = [];
  
  // Look for common options
  if (/low-e|low e|lowe/i.test(description)) {
    options.push('Low-E Glass');
  }
  
  if (/argon|gas filled/i.test(description)) {
    options.push('Argon Gas');
  }
  
  if (/energy star|energystar/i.test(description)) {
    options.push('ENERGY STAR');
  }
  
  if (/tempered|safety glass/i.test(description)) {
    options.push('Tempered Glass');
  }
  
  if (/grids|grilles|muntins/i.test(description)) {
    options.push('Grids');
  }
  
  if (/screens/i.test(description)) {
    options.push('Screens');
  }
  
  if (/tilt|washable/i.test(description)) {
    options.push('Tilt Feature');
  }
  
  return options.join(', ');
}

/**
 * Format options object into string
 * @param {Object} options - The options object
 * @returns {string} - Formatted options
 */
function formatOptions(options) {
  const formattedOptions = [];
  
  if (options.material) {
    formattedOptions.push(`${options.material.charAt(0).toUpperCase() + options.material.slice(1)} Frame`);
  }
  
  if (options.glassType) {
    formattedOptions.push(formatGlassType(options.glassType));
  }
  
  return formattedOptions.join(', ');
}

/**
 * Format glass type
 * @param {string} glassType - The glass type
 * @returns {string} - Formatted glass type
 */
function formatGlassType(glassType) {
  switch (glassType) {
    case 'single-pane':
      return 'Single Pane Glass';
    case 'double-pane':
      return 'Double Pane Glass';
    case 'triple-pane':
      return 'Triple Pane Glass';
    default:
      return 'Double Pane Glass';
  }
}

/**
 * Get comparison details
 * @param {string} comparisonId - The comparison ID
 * @returns {Promise<Object>} - Comparison details
 */
export async function getComparisonDetails(comparisonId) {
  try {
    const comparison = await getDocument(COMPARISONS_COLLECTION, comparisonId);
    
    if (!comparison) {
      throw new Error('Comparison not found');
    }
    
    return comparison;
  } catch (error) {
    console.error('Failed to get comparison details:', error);
    throw new Error('Failed to get comparison details. Please try again.');
  }
}

/**
 * Get comparison items
 * @param {string} comparisonId - The comparison ID
 * @returns {Promise<Array>} - Comparison items
 */
export async function getComparisonItems(comparisonId) {
  try {
    const query = queryDocuments(COMPARISON_ITEMS_COLLECTION)
      .eq('comparisonId', comparisonId);
    
    const results = await query.find();
    return results.items;
  } catch (error) {
    console.error('Failed to get comparison items:', error);
    throw new Error('Failed to get comparison items. Please try again.');
  }
}

/**
 * Update comparison status
 * @param {string} comparisonId - The comparison ID
 * @param {string} status - The new status
 * @returns {Promise<Object>} - Updated comparison
 */
export async function updateComparisonStatus(comparisonId, status) {
  try {
    const comparison = await getDocument(COMPARISONS_COLLECTION, comparisonId);
    
    if (!comparison) {
      throw new Error('Comparison not found');
    }
    
    const updatedComparison = await updateDocument(COMPARISONS_COLLECTION, {
      ...comparison,
      status,
      updatedAt: new Date()
    });
    
    return updatedComparison;
  } catch (error) {
    console.error('Failed to update comparison status:', error);
    throw new Error('Failed to update comparison status. Please try again.');
  }
}

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
