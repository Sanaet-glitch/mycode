/**
 * Attendance utility functions for token generation and validation
 * These functions handle the secure token generation for QR code attendance
 */

/**
 * Generates a secure token for QR code-based attendance
 * The token includes the session ID and an expiration timestamp
 * @param sessionId The ID of the class session
 * @returns A secure token string
 */
export const generateAttendanceToken = (sessionId: string): string => {
  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  try {
    // Create an expiration timestamp (5 minutes from now)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 5);
    const expiryTimestamp = Math.floor(expiryTime.getTime() / 1000);
    
    // Create a payload with the session ID and expiry time
    const payload = {
      sid: sessionId,
      exp: expiryTimestamp,
      // Add a random component for additional security
      nonce: crypto.getRandomValues(new Uint8Array(8)).join(''),
      // Add creation timestamp
      iat: Math.floor(Date.now() / 1000)
    };
    
    // Convert to JSON and encode as base64
    const jsonPayload = JSON.stringify(payload);
    const base64Payload = btoa(jsonPayload);
    
    return base64Payload;
  } catch (error) {
    console.error("Token generation error:", error);
    throw new Error("Failed to generate attendance token");
  }
};

/**
 * Validates an attendance token
 * @param token The token to validate
 * @returns An object with the session ID if valid, or an error message
 */
export const validateAttendanceToken = (token: string): { 
  valid: boolean; 
  sessionId?: string; 
  error?: string;
  expiresIn?: number;
} => {
  if (!token) {
    return { valid: false, error: "Token is required" };
  }

  try {
    // Decode the token
    const jsonPayload = atob(token);
    const payload = JSON.parse(jsonPayload);
    
    // Check if the payload has the required fields
    if (!payload.sid || !payload.exp) {
      return { valid: false, error: "Invalid token format" };
    }
    
    // Check if token has expired
    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    if (payload.exp < currentTimestamp) {
      return { valid: false, error: "Token has expired" };
    }
    
    // Calculate how many seconds until the token expires
    const expiresIn = payload.exp - currentTimestamp;
    
    // Return the session ID and expiration info
    return { 
      valid: true, 
      sessionId: payload.sid,
      expiresIn
    };
  } catch (error) {
    console.error("Token validation error:", error);
    return { valid: false, error: "Invalid token" };
  }
};

/**
 * Get the remaining validity time of a token in a readable format
 * @param token The token to check
 * @returns A human-readable string indicating remaining validity time
 */
export const getTokenRemainingTime = (token: string): string => {
  try {
    const result = validateAttendanceToken(token);
    
    if (!result.valid || !result.expiresIn) {
      return "Expired";
    }
    
    // Format the remaining time
    if (result.expiresIn < 60) {
      return `${result.expiresIn} seconds`;
    } else {
      const minutes = Math.floor(result.expiresIn / 60);
      const seconds = result.expiresIn % 60;
      return `${minutes}m ${seconds}s`;
    }
  } catch (error) {
    return "Invalid";
  }
}; 