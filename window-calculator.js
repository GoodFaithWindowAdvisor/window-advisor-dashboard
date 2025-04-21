// Window Calculator Implementation for Warnke Windows WindowVisor Dashboard
// This file handles the calculation of window prices based on measurements and options

import { fetch } from 'wix-fetch';
import wixWindow from 'wix-window';
import wixStorage from 'wix-storage';

// Google Sheets API Configuration
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzyojx7Qg-Tl5wWYn4FS4hl9icNya_eBW7xCW_v3MqlcV7AxG-QjuunolHyHqrP_ntdRw/exec";

// Window Measurement Defaults and Constraints
const MIN_WIDTH = 12; // inches
const MAX_WIDTH = 120; // inches
const MIN_HEIGHT = 12; // inches
const MAX_HEIGHT = 120; // inches

// OAuth configuration
const CLIENT_ID = "62610418228-i22m3312lnfr0f3aiuvet7rb8p9tpgd1.apps.googleusercontent.com";
const AUTH_PARAMS = {
    client_id: CLIENT_ID,
    response_type: 'token',
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    redirect_uri: wixWindow.lightbox.getUrl()
};

/**
 * Initialize the calculator with default settings
 */
export function initCalculator() {
    const calculatorState = {
        ready: true,
        calculating: false,
        authStatus: 'not-authenticated',
        measurements: {
            width: 36,
            height: 60,
            quantity: 1
        },
        windowType: "double-hung",
        windowMaterial: "vinyl",
        glassType: "double-pane",
        results: null,
        error: null
    };
    
    // Check if we already have an OAuth token
    const token = wixStorage.local.getItem('googleOAuthToken');
    if (token) {
        calculatorState.authStatus = 'authenticated';
    }
    
    return calculatorState;
}

/**
 * Calculate window price based on measurements and options
 */
export async function calculatePrice(measurements, options) {
    // Create a state object to track the calculation process
    const state = {
        calculating: true,
        results: null,
        error: null
    };
    
    try {
        // Validate measurements
        if (!validateMeasurements(measurements)) {
            throw new Error("Invalid measurements. Please check width and height values.");
        }
        
        // Prepare data for API call
        const requestData = {
            action: "calculatePrice",
            measurements: {
                width: measurements.width,
                height: measurements.height,
                quantity: measurements.quantity || 1
            },
            options: {
                windowType: options.windowType || "double-hung",
                material: options.material || "vinyl",
                glassType: options.glassType || "double-pane"
            }
        };
        
        // Call Google Sheets API
        const response = await callGoogleSheetsAPI(requestData);
        
        if (response && response.success) {
            state.results = {
                basePrice: response.basePrice,
                optionsPrice: response.optionsPrice,
                totalPrice: response.totalPrice,
                pricePerWindow: response.pricePerWindow,
                estimatedInstallation: response.estimatedInstallation,
                totalProject: response.totalProject
            };
        } else {
            throw new Error(response.error || "Failed to calculate price. Please try again.");
        }
    } catch (error) {
        console.error("Price calculation error:", error);
        state.error = error.message;
    } finally {
        state.calculating = false;
    }
    
    return state;
}

/**
 * Call the Google Sheets API using the Apps Script Web App as a proxy
 */
async function callGoogleSheetsAPI(data) {
    try {
        const token = wixStorage.local.getItem('googleOAuthToken');
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                wixStorage.local.removeItem('googleOAuthToken');
                return { success: false, error: "Authentication required. Please log in again." };
            }
            throw new Error(`API call failed with status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("API call error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Validate window measurements
 */
function validateMeasurements(measurements) {
    const { width, height } = measurements;
    
    // Check if values are numeric and within bounds
    if (isNaN(width) || width < MIN_WIDTH || width > MAX_WIDTH) {
        return false;
    }
    
    if (isNaN(height) || height < MIN_HEIGHT || height > MAX_HEIGHT) {
        return false;
    }
    
    return true;
}

/**
 * Initiate Google OAuth flow
 */
export function initiateOAuth() {
    // Build OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    Object.entries(AUTH_PARAMS).forEach(([key, value]) => {
        authUrl.searchParams.append(key, value);
    });
    
    // Open OAuth window
    wixWindow.openLightbox("OAuthHandler", { url: authUrl.toString() });
}

/**
 * Handle OAuth callback and store token
 */
export function handleOAuthCallback(token) {
    if (token) {
        wixStorage.local.setItem('googleOAuthToken', token);
        return { authStatus: 'authenticated' };
    } else {
        return { authStatus: 'auth-failed' };
    }
}

/**
 * Log out and clear OAuth token
 */
export function logout() {
    wixStorage.local.removeItem('googleOAuthToken');
    return { authStatus: 'not-authenticated' };
}

/**
 * Save quote to Google Sheets
 */
export async function saveQuote(customerInfo, measurements, options, results) {
    if (!results) {
        return { success: false, error: "Please calculate price before saving quote" };
    }
    
    try {
        const requestData = {
            action: "saveQuote",
            customerInfo: customerInfo,
            measurements: measurements,
            options: options,
            results: results
        };
        
        const response = await callGoogleSheetsAPI(requestData);
        return response;
    } catch (error) {
        console.error("Save quote error:", error);
        return { success: false, error: error.message };
    }
}
