import axios from "axios";

const API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;
const BASE_URL = "https://api.rawg.io/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  params: {
    key: API_KEY,
  },
});

export const getTrendingGames = async (page = 1) => {
  const response = await apiClient.get('/games', {
    params: {
      ordering: '-added',
      page_size: 20,
      page,
    },
  });
  return response.data;
};

export const getNewReleases = async (page = 1) => {
  // get last 30 days games
  const date = new Date();
  const today = date.toISOString().split('T')[0];
  date.setDate(date.getDate() - 30);
  const thirtyDaysAgo = date.toISOString().split('T')[0];

  const response = await apiClient.get('/games', {
    params: {
      dates: `${thirtyDaysAgo},${today}`,
      ordering: '-released',
      page_size: 20,
      page,
    },
  });
  return response.data;
};

export const getTopRatedGames = async (page = 1) => {
  const response = await apiClient.get('/games', {
    params: {
      ordering: '-rating',
      page_size: 20,
      page,
    },
  });
  return response.data;
};

export const searchGames = async (query: string, page = 1) => {
  const response = await apiClient.get('/games', {
    params: {
      search: query,
      search_precise: true,
      page_size: 20,
      page,
    },
  });
  return response.data;
};

export const getGameDetails = async (idOrSlug: string) => {
  const response = await apiClient.get(`/games/${idOrSlug}`);
  return response.data;
};

export const getGameScreenshots = async (idOrSlug: string) => {
  const response = await apiClient.get(`/games/${idOrSlug}/screenshots`);
  return response.data;
};
