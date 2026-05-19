export interface InstagramAccount {
  id: number;
  instagram_id: string | null;
  username: string;
  followers: number;
  following: number;
  is_external: boolean;
  is_active: boolean;
  is_manual_input: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface InstagramContent {
  id: number;
  caption: string | null;
  instagram_id: number | null;
  shortcode: string | null;
  display_url: string;
  remote_url: string | null;
  account_id: number | null;
  created_at: Date;
  posted_at: Date | null;
  confirmed_at: Date | null;
  rejected_at: Date | null;
  action_by: string | null;
}

export interface MasterCategory {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface MasterProvince {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MasterGroup {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MasterRegion {
  id: number;
  name: string;
  province_id: number;
  js_loker: number | null;
  group_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface RegionAccount {
  id: number;
  region_id: number;
  account_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface InstagramAccountResult {
  success: boolean;
  userId?: string;
  username: string;
  followers?: string;
  following?: string;
  error?: string;
}

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

export interface GeminiJobData {
  isJobPost: boolean;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  area: string | null;
  education: string | null;
  apply_url: string | null;
  min_age: number | null;
  max_age: number | null;
  soft_skills: string[] | null;
  hard_skills: string[] | null;
  category_ids: number[] | null;
}

export interface ContentRow {
  id: number;
  instagram_id: number | null;
  username: string;
  display_url: string;
  posted_at: Date | null;
  remote_url: string | null;
  shortcode: string | null;
  caption: string | null;
  confirmed_at: Date | null;
  rejected_at: Date | null;
  action_by: string | null;
  content_created_at: Date;
  group_id: number;
  group_name: string;
  region_id: number;
  region_name: string;
  account_id: number;
}
