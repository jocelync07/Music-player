// base url of the ad server
export const BASE_URL_AD_SERVER = 'https://2110.kujira.au/';

// Deezer API proxy base
export const DEEZER_PROXY = '/deezer-api';

// Shared limits
export const LIMITS = {
  TOP_TRACKS: 10,
  SEARCH: 12,
};

// Pre-built endpoint paths
export const DEEZER_ENDPOINTS = {
  CHART: `${DEEZER_PROXY}/chart/0/tracks?limit=${LIMITS.TOP_TRACKS}`,
  SEARCH: `${DEEZER_PROXY}/search?limit=${LIMITS.SEARCH}`,
  MOOD: `${DEEZER_PROXY}/search`,
  PLAYLIST: `${DEEZER_PROXY}/playlist/`,
};
