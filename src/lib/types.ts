export interface Platform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  image_background?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Developer {
  id: number;
  name: string;
  slug: string;
}

export interface Publisher {
  id: number;
  name: string;
  slug: string;
}

export interface StoreEntry {
  id: number;
  store: {
    id: number;
    name: string;
    slug: string;
    domain: string;
  };
}

export interface EsrbRating {
  id: number;
  name: string;
  slug: string;
}

export interface Rating {
  id: number;
  title: string;
  count: number;
  percent: number;
}

export interface Screenshot {
  id: number;
  image: string;
  width?: number;
  height?: number;
}

export interface Game {
  id: number;
  slug: string;
  name: string;
  released: string;
  background_image: string;
  metacritic: number;
  rating: number;
  rating_top: number;
  ratings_count: number;
  reviews_count: number;
  added: number;
  playtime: number;
  genres: Genre[];
  parent_platforms?: Platform[];
  platforms?: Platform[];
  short_screenshots?: Screenshot[];
  description?: string;
  description_raw?: string;
  // Detail-only fields
  ratings?: Rating[];
  tags?: Tag[];
  developers?: Developer[];
  publishers?: Publisher[];
  stores?: StoreEntry[];
  esrb_rating?: EsrbRating;
  website?: string;
}

export interface GamesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Game[];
}
