import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getTrendingGames, getNewReleases, getTopRatedGames, searchGames,
  getGameDetails, getGameScreenshots, getGameMovies, getSuggestedGames,
  getGenres, getPlatforms, getStores, getGamesByGenre, getGamesByPlatform,
  getThisWeekGames, getNextWeekGames, getGames,
} from "@/services/api";

export const useTrendingGames = (page = 1) =>
  useQuery({ queryKey: ["games", "trending", page], queryFn: () => getTrendingGames(page) });

export const useNewReleases = (page = 1) =>
  useQuery({ queryKey: ["games", "new-releases", page], queryFn: () => getNewReleases(page) });

export const useThisWeekGames = (page = 1) =>
  useQuery({ queryKey: ["games", "this-week", page], queryFn: () => getThisWeekGames(page) });

export const useNextWeekGames = (page = 1) =>
  useQuery({ queryKey: ["games", "next-week", page], queryFn: () => getNextWeekGames(page) });

export const useTopRatedGames = (page = 1) =>
  useQuery({ queryKey: ["games", "top-rated", page], queryFn: () => getTopRatedGames(page) });

export const useSearchGames = (query: string, page = 1) =>
  useQuery({ queryKey: ["games", "search", query, page], queryFn: () => searchGames(query, page), enabled: !!query });

export const useGameDetails = (slug: string) =>
  useQuery({ queryKey: ["game", slug], queryFn: () => getGameDetails(slug), enabled: !!slug });

export const useGameScreenshots = (slug: string) =>
  useQuery({ queryKey: ["game-screenshots", slug], queryFn: () => getGameScreenshots(slug), enabled: !!slug });

export const useGameMovies = (slug: string) =>
  useQuery({ queryKey: ["game-movies", slug], queryFn: () => getGameMovies(slug), enabled: !!slug });

export const useSuggestedGames = (slug: string) =>
  useQuery({ queryKey: ["game-suggested", slug], queryFn: () => getSuggestedGames(slug), enabled: !!slug });

export const useGenres = () =>
  useQuery({ queryKey: ["genres"], queryFn: getGenres, staleTime: Infinity });

export const usePlatforms = () =>
  useQuery({ queryKey: ["platforms"], queryFn: getPlatforms, staleTime: Infinity });

export const useStores = () =>
  useQuery({ queryKey: ["stores"], queryFn: getStores, staleTime: Infinity });

export const useGamesByGenre = (genreId: number | string, page = 1, ordering = '-added') =>
  useQuery({ queryKey: ["games-by-genre", genreId, page, ordering], queryFn: () => getGamesByGenre(genreId, page, ordering), enabled: !!genreId });

export const useGamesByPlatform = (platformId: number | string, page = 1, ordering = '-added') =>
  useQuery({ queryKey: ["games-by-platform", platformId, page, ordering], queryFn: () => getGamesByPlatform(platformId, page, ordering), enabled: !!platformId });

// Infinite scroll hook for the main list page
export const useInfiniteGames = (params: Record<string, unknown> = {}) =>
  useInfiniteQuery({
    queryKey: ["games", "infinite", params],
    queryFn: ({ pageParam = 1 }) => getGames({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        return Number(url.searchParams.get("page"));
      }
      return undefined;
    },
  });
