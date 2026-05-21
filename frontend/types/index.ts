export interface Account {
  id: number;
  username: string;
  instagram_id: string | null;
  followers: number;
  following: number;
  is_external: boolean;
  is_active: boolean;
  is_manual_input: boolean;
  region_count: number;
  created_at: string;
}

export interface AccountRegion {
  id: number;
  region_id: number;
  account_id: number;
  region_name: string;
  province_name: string | null;
}

export interface Province {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Group {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Region {
  id: number;
  name: string;
  province_id: number;
  group_id: number | null;
  js_loker: number | null;
  province_name: string;
  group_name: string | null;
  account_count: number;
}

export interface RegionAccount {
  id: number;
  account_id: number;
  username: string;
  instagram_id: string | null;
  is_active: boolean;
}

export interface ContentItem {
  id: number;
  instagram_id: number | null;
  username: string;
  display_url: string;
  caption: string | null;
  shortcode: string | null;
  posted_at: string | null;
  confirmed_at: string | null;
  remote_url: string | null;
  action_by: string | null;
  content_created_at: string;
  group_id: number;
  group_name: string;
  region_id: number;
  region_name: string;
  account_id: number;
  processingDone?: boolean;
  processingError?: string;
  skipReason?: string;
}

export interface ContentGroup {
  id: number;
  name: string;
  content_count: number;
  content: ContentItem[];
}

export interface DashboardStats {
  total_accounts: number;
  total_content: number;
  pending_content: number;
  confirmed_content: number;
  external_accounts: number;
}

export interface ScrapeSession {
  id: string;
  started_at: string;
  finished_at: string | null;
  total_accounts: number;
  success_count: number;
  error_count: number;
  deleted_count: number;
  status: "running" | "completed" | "failed";
}

export interface LiveLogEntry {
  id: number;
  session_id: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  account_username: string | null;
  posts_count: number | null;
  created_at: string;
}

export interface ContentProcessedDetail {
  contentId: number;
  remoteUrl: string | null;
  skipReason?: string;
  error?: string;
}

export type AccountFilterType = "all" | "external" | "internal";

export type SyncMode = "all" | "empty";

export interface SyncProgress {
  running: boolean;
  total: number;
  processed: number;
  failed: number;
  current: string | null;
  stopRequested: boolean;
  mode: SyncMode;
  canResume: boolean;
  pendingCount: number;
}
