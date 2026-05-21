CREATE TABLE IF NOT EXISTS master_category (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_category_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_category_name ON master_category (name);

CREATE TABLE IF NOT EXISTS master_province (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_province_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_province_name ON master_province (name);
CREATE INDEX IF NOT EXISTS idx_province_active ON master_province (is_active);
CREATE INDEX IF NOT EXISTS idx_province_name_active ON master_province (name, is_active);

CREATE TABLE IF NOT EXISTS master_group (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_group_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_group_name ON master_group (name);
CREATE INDEX IF NOT EXISTS idx_group_active ON master_group (is_active);

CREATE TABLE IF NOT EXISTS instagram_account (
  id SERIAL PRIMARY KEY,
  instagram_id VARCHAR(255) NULL,
  username VARCHAR(255) NOT NULL,
  followers INTEGER NULL DEFAULT 0,
  following INTEGER NOT NULL DEFAULT 0,
  is_external SMALLINT NOT NULL DEFAULT 1,
  is_active SMALLINT NOT NULL DEFAULT 1,
  is_manual_input SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_instagram_id UNIQUE (instagram_id),
  CONSTRAINT uq_username UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS idx_instagram_id ON instagram_account (instagram_id);
CREATE INDEX IF NOT EXISTS idx_username ON instagram_account (username);
CREATE INDEX IF NOT EXISTS idx_external ON instagram_account (is_external);
CREATE INDEX IF NOT EXISTS idx_active ON instagram_account (is_active);
CREATE INDEX IF NOT EXISTS idx_external_active ON instagram_account (is_external, is_active);

CREATE TABLE IF NOT EXISTS master_region (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  province_id INTEGER NOT NULL,
  js_loker INTEGER NULL,
  group_id INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_region_name_province UNIQUE (name, province_id),
  CONSTRAINT fk_region_province FOREIGN KEY (province_id) REFERENCES master_province(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT fk_region_group FOREIGN KEY (group_id) REFERENCES master_group(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_region_province ON master_region (province_id);
CREATE INDEX IF NOT EXISTS idx_region_group ON master_region (group_id);

CREATE TABLE IF NOT EXISTS instagram_content (
  id SERIAL PRIMARY KEY,
  caption TEXT NULL,
  instagram_id BIGINT NULL,
  shortcode VARCHAR(255) NULL,
  display_url TEXT NOT NULL,
  remote_url TEXT NULL,
  account_id INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  posted_at TIMESTAMPTZ NULL,
  confirmed_at TIMESTAMPTZ NULL,
  rejected_at TIMESTAMPTZ NULL,
  action_by VARCHAR(255) NULL,
  CONSTRAINT fk_content_account FOREIGN KEY (account_id) REFERENCES instagram_account(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_shortcode ON instagram_content (shortcode);
CREATE INDEX IF NOT EXISTS idx_account ON instagram_content (account_id);
CREATE INDEX IF NOT EXISTS idx_posted_at ON instagram_content (posted_at);
CREATE INDEX IF NOT EXISTS idx_confirmed_at ON instagram_content (confirmed_at);
CREATE INDEX IF NOT EXISTS idx_rejected_at ON instagram_content (rejected_at);
CREATE INDEX IF NOT EXISTS idx_content_dates ON instagram_content (posted_at, confirmed_at, rejected_at);
CREATE INDEX IF NOT EXISTS idx_account_posted ON instagram_content (account_id, posted_at);

CREATE TABLE IF NOT EXISTS region_account (
  id SERIAL PRIMARY KEY,
  region_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_region_account UNIQUE (region_id, account_id),
  CONSTRAINT fk_region_account_region FOREIGN KEY (region_id) REFERENCES master_region(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT fk_region_account_account FOREIGN KEY (account_id) REFERENCES instagram_account(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_region_account_region ON region_account (region_id);
CREATE INDEX IF NOT EXISTS idx_region_account_account ON region_account (account_id);
