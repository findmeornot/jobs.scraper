CREATE TABLE IF NOT EXISTS `scrape_session` (
  `id` VARCHAR(36) NOT NULL,
  `started_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `finished_at` TIMESTAMP(3) NULL,
  `total_accounts` INT NOT NULL DEFAULT 0,
  `success_count` INT NOT NULL DEFAULT 0,
  `error_count` INT NOT NULL DEFAULT 0,
  `deleted_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('running','completed','failed') NOT NULL DEFAULT 'running',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `scrape_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(36) NOT NULL,
  `level` ENUM('info','warn','error','success') NOT NULL DEFAULT 'info',
  `message` TEXT NOT NULL,
  `account_username` VARCHAR(255) NULL,
  `posts_count` INT NULL,
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
