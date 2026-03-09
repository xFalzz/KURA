import axios from "axios";

const API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;
const BASE_URL = "https://api.rawg.io/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  params: { key: API_KEY },
});

// Games
export const getGames = async (params: Record<string, unknown> = {}) => {
  const response = await apiClient.get('/games', { params: { page_size: 20, ...params } });
  return response.data;
};

export const getTrendingGames = async (page = 1) =>
  getGames({ ordering: '-added', page });

export const getNewReleases = async (page = 1) => {
  const date = new Date();
  const today = date.toISOString().split('T')[0];
  date.setDate(date.getDate() - 30);
  const thirtyDaysAgo = date.toISOString().split('T')[0];
  return getGames({ dates: `${thirtyDaysAgo},${today}`, ordering: '-released', page });
};

export const getThisWeekGames = async (page = 1) => {
  const date = new Date();
  const end = date.toISOString().split('T')[0];
  date.setDate(date.getDate() - 7);
  const start = date.toISOString().split('T')[0];
  return getGames({ dates: `${start},${end}`, ordering: '-released', page });
};

export const getNextWeekGames = async (page = 1) => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const start = date.toISOString().split('T')[0];
  date.setDate(date.getDate() + 7);
  const end = date.toISOString().split('T')[0];
  return getGames({ dates: `${start},${end}`, ordering: 'released', page });
};

export const getTopRatedGames = async (page = 1) =>
  getGames({ ordering: '-rating', page });

export const searchGames = async (query: string, page = 1) =>
  getGames({ search: query, search_precise: true, page });

export const getGamesByGenre = async (genreId: number | string, page = 1, ordering = '-added') =>
  getGames({ genres: genreId, ordering, page });

export const getGamesByPlatform = async (platformId: number | string, page = 1, ordering = '-added') =>
  getGames({ platforms: platformId, ordering, page });

export const getGameDetails = async (idOrSlug: string) => {
  const response = await apiClient.get(`/games/${idOrSlug}`);
  return response.data;
};

export const getGameScreenshots = async (idOrSlug: string) => {
  const response = await apiClient.get(`/games/${idOrSlug}/screenshots`);
  return response.data;
};

export const getGameMovies = async (idOrSlug: string) => {
  const response = await apiClient.get(`/games/${idOrSlug}/movies`);
  return response.data;
};

export const getSuggestedGames = async (idOrSlug: string) => {
  const response = await apiClient.get(`/games/${idOrSlug}/suggested`);
  return response.data;
};

// Genres
export const getGenres = async () => {
  const response = await apiClient.get('/genres', { params: { page_size: 20 } });
  return response.data;
};

// Platforms
export const getPlatforms = async () => {
  const response = await apiClient.get('/platforms/lists/parents', { params: { page_size: 20 } });
  return response.data;
};

export const getStores = async () => {
  const response = await apiClient.get('/stores', { params: { page_size: 20 } });
  return response.data;
};
