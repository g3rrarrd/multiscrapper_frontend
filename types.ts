export enum Platform {
  INSTAGRAM = 'ig',
  TIKTOK = 'tk',
  X = 'x',
  FACEBOOK = 'fb',
  YOUTUBE = 'yt'
}

export type PlatformKey = 'ig' | 'tk' | 'x' | 'fb' | 'yt';

export interface PlutchikEmotions {
  alegria?: number | null;
  confianza?: number | null;
  miedo?: number | null;
  sorpresa?: number | null;
  tristeza?: number | null;
  aversion?: number | null;
  ira?: number | null;
  anticipacion?: number | null;
}

export interface DimUsuario {
  platform: string;
  username: string;
  followers: number;
  followers_updated_at?: string;
}

export interface ScrapeResult extends PlutchikEmotions {
  id: string | number;
  platform: Platform | PlatformKey;
  username: string;
  followers?: number;
  dim_usuario?: number | null;
  usuario?: DimUsuario;
  date?: string;
  post_date?: string;
  created_at?: string;
  likes?: number;
  comments?: number;
  views?: number;
  retweets?: number;
  description?: string;
  caption?: string;
  text?: string;
  raw_data?: string;
  is_loto?: boolean;
  sentimiento_global?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | string;
}

export interface PostComment {
  id?: number;
  post: number | string;
  texto: string;
  platform: string;
  created_at?: string;
}

export interface SinglePostResponse {
  status: 'created' | 'already_exists' | string;
  post_id: number;
  username: string;
  platform: string;
  comments_saved: number;
  post: ScrapeResult;
}

export interface UserCommentsResponse {
  total_posts: number;
  total_comments: number;
  comments: PostComment[];
}

export interface ApiKeyConfig {
  ig_keys: string;
  x_tk_busqueda: string;
  x_tk_timeline: string;
}

export interface ScrapingStats {
  totalProcessed: number;
  activeTasks: number;
  successRate: number;
}
