export interface ScrapedPost {
  id: number;
  caption: string;
  display_url: string;
  shortcode: string;
  base64: string;
  created_at: string;
}

export interface ScrapedPostsResponse {
  first: number;
  total: number;
  result: ScrapedPost[];
}

export interface ScrapedProfile {
  id: string;
  followers: string;
  following: string;
}
