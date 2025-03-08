/**
 * Location and distance utility functions for attendance verification
 */

export enum LocationErrorCode {
  INVALID_LOCATION = "INVALID_LOCATION",
  MISSING_COORDINATES = "MISSING_COORDINATES",
  CALCULATION_ERROR = "CALCULATION_ERROR",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  POSITION_UNAVAILABLE = "POSITION_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

export interface LocationError {
  code: LocationErrorCode;
  message: string;
  retry?: boolean; // indicates if the error is retryable
  technicalDetails?: any; // for logging purposes
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number; // in meters
  timestamp?: number; // when the location was captured
}

let lecturerLocation: Location | null = null;

/**
 * Sets the lecturer's current location for proximity verification
 * @param location The lecturer's current location
 * @throws {LocationError} If the location is invalid
 */
export const setLecturerLocation = (location: Location): void => {
  if (!location) {
    throw {
      code: LocationErrorCode.INVALID_LOCATION,
      message: "Location data is missing",
      retry: false
    } as LocationError;
  }
  
  if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    throw {
      code: LocationErrorCode.MISSING_COORDINATES,
      message: "Location is missing latitude or longitude coordinates",
      retry: false,
      technicalDetails: { location }
    } as LocationError;
  }
  
  // Store timestamp if not provided
  if (!location.timestamp) {
    location.timestamp = Date.now();
  }
  
  lecturerLocation = location;
  console.log("Lecturer location set:", location);
};

/**
 * Gets the lecturer's current location
 * @returns The lecturer's location or null if not set
 */
export const getLecturerLocation = (): Location | null => {
  return lecturerLocation;
};

/**
 * Calculates the distance between two geographic points using the Haversine formula
 * @param location1 First location with latitude and longitude
 * @param location2 Second location with latitude and longitude
 * @returns Distance in meters between the two points
 * @throws {LocationError} If there's an error calculating distance
 */
export const calculateDistance = (location1: Location, location2: Location): number => {
  try {
    console.log("Calculating distance between:", location1, "and", location2);
    
    if (!location1 || !location2) {
      console.error("Missing location object(s):", { loc1: !!location1, loc2: !!location2 });
      throw {
        code: LocationErrorCode.INVALID_LOCATION,
        message: "Both locations are required to calculate distance",
        retry: false
      } as LocationError;
    }
    
    // Validate location data
    if (typeof location1.latitude !== 'number' || typeof location1.longitude !== 'number' ||
        isNaN(location1.latitude) || isNaN(location1.longitude)) {
      console.error("Invalid coordinates in location1:", location1);
      throw {
        code: LocationErrorCode.MISSING_COORDINATES,
        message: "First location is missing valid coordinates",
        retry: false,
        technicalDetails: { location: location1 }
      } as LocationError;
    }
    
    if (typeof location2.latitude !== 'number' || typeof location2.longitude !== 'number' ||
        isNaN(location2.latitude) || isNaN(location2.longitude)) {
      console.error("Invalid coordinates in location2:", location2);
      throw {
        code: LocationErrorCode.MISSING_COORDINATES,
        message: "Second location is missing valid coordinates",
        retry: false,
        technicalDetails: { location: location2 }
      } as LocationError;
    }
    
    // Earth's radius in meters
    const R = 6371e3;
    
    // Convert latitude and longitude to radians
    const φ1 = (location1.latitude * Math.PI) / 180;
    const φ2 = (location2.latitude * Math.PI) / 180;
    const Δφ = ((location2.latitude - location1.latitude) * Math.PI) / 180;
    const Δλ = ((location2.longitude - location1.longitude) * Math.PI) / 180;

    // Haversine formula
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in meters
    const distance = R * c;
    console.log(`Calculated distance: ${distance.toFixed(2)} meters`);
    return distance;
  } catch (error) {
    if ((error as LocationError).code) {
      throw error; // Re-throw if it's already a LocationError
    }
    
    console.error("Error calculating distance:", error);
    throw {
      code: LocationErrorCode.CALCULATION_ERROR,
      message: "Failed to calculate distance between locations",
      retry: true,
      technicalDetails: { error, location1, location2 }
    } as LocationError;
  }
};

/**
 * Checks if a student's location is within the proximity radius of a classroom
 * @param studentLocation The student's current location
 * @param classroomLocation The classroom location (lecturer or beacon)
 * @param proximityRadius The maximum allowed distance in meters
 * @returns An object indicating if student is within range and the calculated distance
 * @throws {LocationError} If there's an error checking proximity
 */
export const isWithinProximity = (
  studentLocation: Location, 
  classroomLocation: Location, 
  proximityRadius: number = 100
): { within: boolean; distance: number } => {
  try {
    const distance = calculateDistance(studentLocation, classroomLocation);
    return { 
      within: distance <= proximityRadius,
      distance
    };
  } catch (error) {
    console.error("Error checking proximity:", error);
    throw error; // Re-throw the LocationError from calculateDistance
  }
};

/**
 * Gets formatted location text from coordinates
 * @param location Location with latitude and longitude
 * @returns Formatted string representation of the location
 */
export const getLocationText = (location: Location | null): string => {
  if (!location) return "Unknown location";
  
  let text = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  
  if (location.accuracy) {
    text += ` (±${location.accuracy.toFixed(1)}m)`;
  }
  
  return text;
};

/**
 * Handles geolocation position errors and converts them to LocationError
 * @param error GeolocationPositionError from the browser API
 * @returns LocationError with appropriate code and message
 */
export const handleGeolocationError = (error: GeolocationPositionError): LocationError => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        code: LocationErrorCode.PERMISSION_DENIED,
        message: "Location access was denied. Please enable location services in your browser settings.",
        retry: false,
        technicalDetails: { error }
      };
    case error.POSITION_UNAVAILABLE:
      return {
        code: LocationErrorCode.POSITION_UNAVAILABLE,
        message: "Location information is unavailable. Please try again in a different location.",
        retry: true,
        technicalDetails: { error }
      };
    case error.TIMEOUT:
      return {
        code: LocationErrorCode.TIMEOUT,
        message: "Location request timed out. Please check your connection and try again.",
        retry: true,
        technicalDetails: { error }
      };
    default:
      return {
        code: LocationErrorCode.UNKNOWN_ERROR,
        message: "An unknown error occurred while accessing your location.",
        retry: true,
        technicalDetails: { error }
      };
  }
};

/**
 * Gets the current location with improved error handling
 * @param options Optional geolocation options
 * @returns Promise that resolves to a Location object
 */
export const getCurrentLocation = (
  options: PositionOptions = { 
    enableHighAccuracy: true, 
    timeout: 10000, 
    maximumAge: 0 
  }
): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: LocationErrorCode.POSITION_UNAVAILABLE,
        message: "Geolocation is not supported by this browser.",
        retry: false
      } as LocationError);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(handleGeolocationError(error));
      },
      options
    );
  });
};