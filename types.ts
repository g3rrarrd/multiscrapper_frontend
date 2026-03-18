
export enum Platform {
  INSTAGRAM = 'ig',
  TIKTOK = 'tk',
  X = 'x'
}

export interface ApiKeyConfig {
  ig_keys: string;
  x_tk_busqueda: string;
  x_tk_timeline: string;
}

export interface ScrapeResult {
  id: string;
  platform: Platform;
  username: string;
  followers: number;
  date: string;
  likes: number;
  comments?: number;
  views?: number;
  retweets?: number;
  description: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface ScrapingStats {
  totalProcessed: number;
  activeTasks: number;
  successRate: number;
}
