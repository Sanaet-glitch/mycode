interface Location {
  latitude: number;
  longitude: number;
}

let lecturerLocation: Location | null = null;

export const setLecturerLocation = (location: Location) => {
  lecturerLocation = location;
  console.log("Lecturer location set:", location);
};

export const getLecturerLocation = () => {
  return lecturerLocation;
};

export const calculateDistance = (location1: Location, location2: Location) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (location1.latitude * Math.PI) / 180;
  const φ2 = (location2.latitude * Math.PI) / 180;
  const Δφ = ((location2.latitude - location1.latitude) * Math.PI) / 180;
  const Δλ = ((location2.longitude - location1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};