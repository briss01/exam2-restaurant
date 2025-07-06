/**
 * API Configuration and Utility Functions
 * 
 * This module provides a centralized interface for all API calls to the restaurant backend.
 * It handles HTTP requests, response parsing, and error handling for the client application.
 */

// Base URL for the restaurant API server
const SERVER_URL = 'http://localhost:3001/api/';

/**
 * Generic HTTP response handler that processes JSON responses
 * Handles both successful and error responses from the server
 */
function getJson(httpResponsePromise) {
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {
          // Success response - parse JSON and resolve
          response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))
        } else {
          // Error response - parse error JSON and reject
          response.json()
            .then(obj => reject(obj))
            .catch(err => reject({ error: "Cannot parse server response" }))
        }
      })
      .catch(err => reject({ error: "Cannot communicate"  }))
  });
}

/**
 * Fetch all orders for the current user
 */
const getOrders = async () => {
  return getJson(fetch(SERVER_URL + 'orders', { credentials: 'include' }));
}

/**
 * Fetch all available ingredients with their properties
 */
const getIngredients = async () => {
  return getJson(fetch(SERVER_URL + 'ingredients', { credentials: 'include' }));
}

/**
 * Fetch all available base dishes
 */
const getDishes = async () => {
  return getJson(fetch(SERVER_URL + 'basedishes', { credentials: 'include' }));
}

/**
 * Fetch all available dish sizes with pricing and ingredient limits
 */
const getSizes = async () => {
  return getJson(fetch(SERVER_URL + 'sizes', { credentials: 'include' }));
}

/**
 * Submit a new order to the server
 * order: Order object containing dish, size, ingredients, and total
 */
const addOrder = async (order) => {
  return getJson(fetch(SERVER_URL + 'orders', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }));
}

/**
 * Cancel an existing order by ID
 * Requires 2FA authentication
 * orderId: ID of the order to cancel
 */
const cancelOrder = async (orderId) => {
  return getJson(fetch(SERVER_URL + 'orders/' + orderId, {
    method: 'DELETE',
    credentials: 'include'
  }));
}

/**
 * Authenticate user with email and password
 * First step of the two-factor authentication process
 * credentials: Object containing username and password
 */
const logIn = async (credentials) => {
  return getJson(fetch(SERVER_URL + 'sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  }));
};

/**
 * Get current user information from active session
 */
const getUserInfo = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', { credentials: 'include' }));
};

/**
 * Log out current user and terminate session
 */
const logOut = async() => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  }));
}

/**
 * Verify Two-Factor Authentication (TOTP) code
 * Second step of the authentication process
 * totpCode: 6-digit TOTP code from authenticator app
 */
const totpVerify = async (totpCode) => {
  return getJson(fetch(SERVER_URL + 'login-totp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({code: totpCode}),
  }));
};

// Export all API functions as a single object
const API = { getOrders, getIngredients, getDishes, getSizes, addOrder, cancelOrder, logIn, getUserInfo, logOut, totpVerify };
export default API;