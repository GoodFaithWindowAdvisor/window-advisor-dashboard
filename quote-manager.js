// Quote Manager Backend Service for WindowVisor Dashboard
// This file implements the backend APIs for quote management

import { 
  getCollection, 
  getDocument, 
  createDocument, 
  updateDocument,
  queryDocuments,
  uploadFile
} from 'wix-data';
import { extractText } from 'wix-media-backend';

// Collection names
const QUOTES_COLLECTION = 'CompetitorQuotes';
const QUOTE_ITEMS_COLLECTION = 'QuoteItems';

/**
 * Upload and create a new quote
 * @param {string} projectId - The project ID
 * @param {File} file - The quote document file
 * @param {string} competitorName - The competitor name
 * @param {Function} progressCallback - Callback for upload progress
 * @returns {Promise<Object>} - Created quote
 */
export async function uploadQuote(projectId, file, competitorName, progressCallback) {
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
    
    const fileUrl = uploadResult.fileUrl;
    
    // Create quote record
    const now = new Date();
    
    const newQuote = {
      projectId,
      competitorName,
      documentUrl: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
      extractionStatus: 'pending',
      quoteNumber: '',
      quoteDate: null,
      totalAmount: 0,
      itemsCount: 0,
      quoteId: generateId()
    };
    
    const result = await createDocument(QUOTES_COLLECTION, newQuote);
    
    return result;
  } catch (error) {
    console.error('Failed to upload quote:', error);
    throw new Error('Failed to upload quote. Please try again.');
  }
}

/**
 * Process a quote by extracting text and parsing
 * @param {string} quoteId - The quote ID
 * @returns {Promise<Object>} - Processed quote
 */
export async function processQuote(quoteId) {
  try {
    // Get quote details
    const quote = await getDocument(QUOTES_COLLECTION, quoteId);
    
    if (!quote) {
      throw new Error('Quote not found');
    }
    
    // Update status to processing
    await updateDocument(QUOTES_COLLECTION, {
      ...quote,
      extractionStatus: 'processing',
      updatedAt: new Date()
    });
    
    // Extract text from document
    const extractedText = await extractText(quote.documentUrl);
    
    // Parse the extracted text
    const parsedData = await parseQuoteText(extractedText, quote.competitorName);
    
    // Create quote items
    const quoteItems = await createQuoteItems(quoteId, parsedData.items);
    
    // Update quote with extracted info
    const updatedQuote = await updateDocument(QUOTES_COLLECTION, {
      ...quote,
      quoteNumber: parsedData.quoteNumber || '',
      quoteDate: parsedData.quoteDate || null,
      totalAmount: parsedData.totalAmount || 0,
      itemsCount: quoteItems.length,
      extractionStatus: 'processed',
      updatedAt: new Date()
    });
    
    return updatedQuote;
  } catch (error) {
    console.error('Failed to process quote:', error);
    
    // Update status to error
    try {
      const quote = await getDocument(QUOTES_COLLECTION, quoteId);
      
      if (quote) {
        await updateDocument(QUOTES_COLLECTION, {
          ...quote,
          extractionStatus: 'error',
          updatedAt: new Date()
        });
      }
    } catch (updateError) {
      console.error('Failed to update quote status:', updateError);
    }
    
    throw new Error('Failed to process quote. Please try again.');
  }
}

/**
 * Parse extracted text into structured quote data
 * @param {string} text - The extracted text
 * @param {string} competitorName - The competitor name
 * @returns {Promise<Object>} - Parsed quote data
 */
async function parseQuoteText(text, competitorName) {
  // This is a simplified version of the parsing logic
  // In a real implementation, this would be more sophisticated
  // and include competitor-specific parsing rules
  
  try {
    let quoteNumber = '';
    let quoteDate = null;
    let totalAmount = 0;
    const items = [];
    
    // Extract quote number
    const quoteNumberMatch = text.match(/Quote\s*#?\s*(\w+[-]?\d+)/i) || 
                           text.match(/Quote\s*Number\s*:?\s*(\w+[-]?\d+)/i) ||
                           text.match(/Estimate\s*#?\s*(\w+[-]?\d+)/i);
    
    if (quoteNumberMatch) {
      quoteNumber = quoteNumberMatch[1];
    }
    
    // Extract date
    const dateMatch = text.match(/Date\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i) ||
                    text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
    
    if (dateMatch) {
      // Parse date (this is simplified)
      quoteDate = new Date(dateMatch[1]);
      
      // If the date is invalid, set to null
      if (isNaN(quoteDate.getTime())) {
        quoteDate = null;
      }
    }
    
    // Extract total amount
    const totalMatch = text.match(/Total\s*:?\s*\$?\s*([\d,]+\.\d{2})/i) ||
                     text.match(/Grand\s*Total\s*:?\s*\$?\s*([\d,]+\.\d{2})/i) ||
                     text.match(/Amount\s*Due\s*:?\s*\$?\s*([\d,]+\.\d{2})/i);
    
    if (totalMatch) {
      totalAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
    }
    
    // Extract items
    // This is a simplified approach that looks for patterns in the text
    // In a real implementation, this would be more sophisticated
    
    // Find all dimensions (width × height)
    const dimensionMatches = text.matchAll(/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)/gi);
    
    for (const match of dimensionMatches) {
      const width = parseFloat(match[1]);
      const height = parseFloat(match[2]);
      
      // Look for nearby price
      const lineStart = Math.max(0, text.lastIndexOf('\n', match.index));
      const lineEnd = text.indexOf('\n', match.index);
      const line = text.substring(lineStart, lineEnd > -1 ? lineEnd : undefined);
      
      // Try to find price in the line
      const priceMatch = line.match(/\$\s*([\d,]+\.\d{2})/);
      let price = 0;
      
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/,/g, ''));
      }
      
      // Try to find quantity
      const qtyMatch = line.match(/qty\s*:?\s*(\d+)/i) || line.match(/quantity\s*:?\s*(\d+)/i);
      let quantity = 1;
      
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10);
      }
      
      // Extract description from the line
      let description = line.replace(/\$\s*[\d,]+\.\d{2}/, '').trim();
      description = description.replace(/qty\s*:?\s*\d+/i, '').trim();
      description = description.replace(/quantity\s*:?\s*\d+/i, '').trim();
      description = description.replace(/\d+(?:\.\d+)?\s*(?:x|×)\s*\d+(?:\.\d+)?/, '').trim();
      
      if (description === '') {
        description = `${width}" × ${height}" Window`;
      }
      
      // Only add if dimensions and price are valid
      if (width > 0 && height > 0) {
        items.push({
          widthInches: width,
          heightInches: height,
          description,
          quantity,
          unitPrice: price / quantity,
          totalPrice: price,
          confidenceScore: 0.8 // Simplified - would be calculated based on extraction confidence
        });
      }
    }
    
    return {
      quoteNumber,
      quoteDate,
      totalAmount,
      items
    };
  } catch (error) {
    console.error('Failed to parse quote text:', error);
    return {
      quoteNumber: '',
      quoteDate: null,
      totalAmount: 0,
      items: []
    };
  }
}

/**
 * Create quote items in the database
 * @param {string} quoteId - The quote ID
 * @param {Array} items - The items array
 * @returns {Promise<Array>} - Created items
 */
async function createQuoteItems(quoteId, items) {
  const createdItems = [];
  
  for (const item of items) {
    try {
      const newItem = {
        ...item,
        quoteId,
        createdAt: new Date(),
        updatedAt: new Date(),
        itemId: generateId()
      };
      
      const result = await createDocument(QUOTE_ITEMS_COLLECTION, newItem);
      createdItems.push(result);
    } catch (error) {
      console.error('Failed to create quote item:', error);
      // Continue with other items
    }
  }
  
  return createdItems;
}

/**
 * Get quote details
 * @param {string} quoteId - The quote ID
 * @returns {Promise<Object>} - Quote details
 */
export async function getQuoteDetails(quoteId) {
  try {
    const quote = await getDocument(QUOTES_COLLECTION, quoteId);
    
    if (!quote) {
      throw new Error('Quote not found');
    }
    
    return quote;
  } catch (error) {
    console.error('Failed to get quote details:', error);
    throw new Error('Failed to get quote details. Please try again.');
  }
}

/**
 * Get quote items
 * @param {string} quoteId - The quote ID
 * @returns {Promise<Array>} - Quote items
 */
export async function getQuoteItems(quoteId) {
  try {
    const query = queryDocuments(QUOTE_ITEMS_COLLECTION)
      .eq('quoteId', quoteId);
    
    const results = await query.find();
    return results.items;
  } catch (error) {
    console.error('Failed to get quote items:', error);
    throw new Error('Failed to get quote items. Please try again.');
  }
}

/**
 * Update a quote item
 * @param {string} itemId - The item ID
 * @param {string} field - The field to update
 * @param {any} value - The new value
 * @returns {Promise<Object>} - Updated item
 */
export async function updateQuoteItem(itemId, field, value) {
  try {
    const item = await getDocument(QUOTE_ITEMS_COLLECTION, itemId);
    
    if (!item) {
      throw new Error('Quote item not found');
    }
    
    const updatedItem = {
      ...item,
      [field]: value,
      updatedAt: new Date()
    };
    
    // If updating dimensions or quantity, recalculate total price
    if (field === 'widthInches' || field === 'heightInches' || field === 'quantity' || field === 'unitPrice') {
      updatedItem.totalPrice = updatedItem.unitPrice * updatedItem.quantity;
    } else if (field === 'totalPrice') {
      // If updating total price, recalculate unit price
      updatedItem.unitPrice = value / updatedItem.quantity;
    }
    
    const result = await updateDocument(QUOTE_ITEMS_COLLECTION, updatedItem);
    
    // Update the quote's total amount
    await updateQuoteTotalAmount(item.quoteId);
    
    return result;
  } catch (error) {
    console.error('Failed to update quote item:', error);
    throw new Error('Failed to update quote item. Please try again.');
  }
}

/**
 * Update a quote's total amount based on its items
 * @param {string} quoteId - The quote ID
 * @returns {Promise<void>}
 */
async function updateQuoteTotalAmount(quoteId) {
  try {
    const items = await getQuoteItems(quoteId);
    
    const totalAmount = items.reduce((total, item) => total + item.totalPrice, 0);
    
    const quote = await getDocument(QUOTES_COLLECTION, quoteId);
    
    if (quote) {
      await updateDocument(QUOTES_COLLECTION, {
        ...quote,
        totalAmount,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Failed to update quote total amount:', error);
    // Don't throw error - this is a background operation
  }
}

/**
 * Verify a quote
 * @param {string} quoteId - The quote ID
 * @returns {Promise<Object>} - Verified quote
 */
export async function verifyQuote(quoteId) {
  try {
    const quote = await getDocument(QUOTES_COLLECTION, quoteId);
    
    if (!quote) {
      throw new Error('Quote not found');
    }
    
    const updatedQuote = await updateDocument(QUOTES_COLLECTION, {
      ...quote,
      extractionStatus: 'verified',
      updatedAt: new Date()
    });
    
    return updatedQuote;
  } catch (error) {
    console.error('Failed to verify quote:', error);
    throw new Error('Failed to verify quote. Please try again.');
  }
}

/**
 * Delete a quote
 * @param {string} quoteId - The quote ID
 * @returns {Promise<boolean>} - Success flag
 */
export async function deleteQuote(quoteId) {
  try {
    // Delete quote and its items
    await Promise.all([
      deleteDocument(QUOTES_COLLECTION, quoteId),
      deleteQuoteItems(quoteId)
    ]);
    
    return true;
  } catch (error) {
    console.error('Failed to delete quote:', error);
    throw new Error('Failed to delete quote. Please try again.');
  }
}

/**
 * Delete all items for a quote
 * @param {string} quoteId - The quote ID
 * @returns {Promise<void>}
 */
async function deleteQuoteItems(quoteId) {
  try {
    const query = queryDocuments(QUOTE_ITEMS_COLLECTION)
      .eq('quoteId', quoteId);
    
    const results = await query.find();
    
    const deletePromises = results.items.map(item => 
      deleteDocument(QUOTE_ITEMS_COLLECTION, item._id)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Failed to delete quote items:', error);
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