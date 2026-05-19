CREATE TABLE IF NOT EXISTS `master_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `idx_category_name` (`name`),
  UNIQUE INDEX `uq_category_name` (`name`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `master_province` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `idx_province_name` (`name`),
  INDEX `idx_province_active` (`is_active`),
  INDEX `idx_name_active` (`name`, `is_active`),
  UNIQUE INDEX `uq_province_name` (`name`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `master_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `idx_group_name` (`name`),
  INDEX `idx_group_active` (`is_active`),
  UNIQUE INDEX `uq_group_name` (`name`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `instagram_account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `instagram_id` varchar(255) NULL,
  `username` varchar(255) NOT NULL,
  `followers` int NULL DEFAULT '0',
  `following` int NOT NULL DEFAULT '0',
  `is_external` tinyint NOT NULL DEFAULT 1,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `is_manual_input` tinyint NOT NULL DEFAULT 0,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `idx_instagram_id` (`instagram_id`),
  INDEX `idx_username` (`username`),
  INDEX `idx_external` (`is_external`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_external_active` (`is_external`, `is_active`),
  UNIQUE INDEX `uq_instagram_id` (`instagram_id`),
  UNIQUE INDEX `uq_username` (`username`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `master_region` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `province_id` int NOT NULL,
  `js_loker` int NULL,
  `group_id` int NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `idx_region_province` (`province_id`),
  INDEX `idx_region_group` (`group_id`),
  UNIQUE INDEX `idx_region_name_province` (`name`, `province_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_region_province` FOREIGN KEY (`province_id`) REFERENCES `master_province`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_region_group` FOREIGN KEY (`group_id`) REFERENCES `master_group`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `instagram_content` (
  `id` int NOT NULL AUTO_INCREMENT,
  `caption` text NULL,
  `instagram_id` bigint NULL,
  `shortcode` varchar(255) NULL,
  `display_url` text NOT NULL,
  `remote_url` text NULL,
  `account_id` int NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `posted_at` timestamp NULL,
  `confirmed_at` timestamp NULL,
  `rejected_at` timestamp NULL,
  `action_by` varchar(255) NULL,
  INDEX `idx_shortcode` (`shortcode`),
  INDEX `idx_account` (`account_id`),
  INDEX `idx_posted_at` (`posted_at`),
  INDEX `idx_confirmed_at` (`confirmed_at`),
  INDEX `idx_rejected_at` (`rejected_at`),
  INDEX `idx_content_dates` (`posted_at`, `confirmed_at`, `rejected_at`),
  INDEX `idx_account_posted` (`account_id`, `posted_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_content_account` FOREIGN KEY (`account_id`) REFERENCES `instagram_account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `region_account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `region_id` int NOT NULL,
  `account_id` int NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `idx_region_account_region` (`region_id`),
  INDEX `idx_region_account_account` (`account_id`),
  INDEX `idx_region_account` (`region_id`, `account_id`),
  UNIQUE INDEX `idx_region_account_unique` (`region_id`, `account_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_region_account_region` FOREIGN KEY (`region_id`) REFERENCES `master_region`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_region_account_account` FOREIGN KEY (`account_id`) REFERENCES `instagram_account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB;
