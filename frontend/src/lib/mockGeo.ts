// Simulated drive route around Tokyo Tower area
// Each point: [latitude, longitude, heading (degrees), speed (m/s)]
const TOKYO_DRIVE_ROUTE: [number, number, number, number][] = [
  // Start near Shiba Park, heading north toward Tokyo Tower
  [35.6545, 139.7468, 10, 8],
  [35.6552, 139.7470, 15, 10],
  [35.6560, 139.7472, 12, 11],
  [35.6568, 139.7473, 8, 10],
  // Approaching Tokyo Tower
  [35.6575, 139.7474, 5, 9],
  [35.6582, 139.7470, 350, 8],
  // Passing Tokyo Tower (on the right)
  [35.6590, 139.7462, 340, 10],
  [35.6598, 139.7455, 330, 11],
  // Turning east toward Zojoji Temple
  [35.6600, 139.7448, 280, 8],
  [35.6596, 139.7438, 220, 9],
  // Heading south past Zojoji
  [35.6588, 139.7432, 200, 10],
  [35.6578, 139.7430, 190, 11],
  [35.6568, 139.7432, 175, 10],
  // Turning toward Shibakoen
  [35.6558, 139.7440, 140, 9],
  [35.6550, 139.7450, 100, 8],
  // Loop back north
  [35.6548, 139.7460, 50, 9],
  [35.6545, 139.7468, 10, 8],
];

type WatchCallback = (position: GeolocationPosition) => void;

let mockInterval: ReturnType<typeof setInterval> | null = null;
let currentIndex = 0;
let isRunning = false;

export function startMockGeolocation(callback: WatchCallback) {
  if (isRunning) return;
  isRunning = true;
  currentIndex = 0;

  const tick = () => {
    const point = TOKYO_DRIVE_ROUTE[currentIndex % TOKYO_DRIVE_ROUTE.length];
    const [lat, lon, heading, speed] = point;

    const position = {
      coords: {
        latitude: lat,
        longitude: lon,
        heading: heading,
        speed: speed,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
      },
      timestamp: Date.now(),
    } as unknown as GeolocationPosition;

    callback(position);
    currentIndex++;
  };

  // Fire first immediately
  tick();
  // Then every 3 seconds (simulates driving)
  mockInterval = setInterval(tick, 3000);
}

export function stopMockGeolocation() {
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
  }
  isRunning = false;
  currentIndex = 0;
}

export function isMockRunning() {
  return isRunning;
}
