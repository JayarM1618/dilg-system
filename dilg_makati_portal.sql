CREATE DATABASE IF NOT EXISTS `dilg_makati_portal` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dilg_makati_portal`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `barangay_programs`, `barangay_announcements`, `activity_logs`, `security_incidents`, `submission_files`, `submissions`, `resources`,
  `report_categories`, `personal_access_tokens`, `sessions`, `password_reset_tokens`,
  `users`, `barangays`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `migrations`;

-- ---------------------------------------------------------------------
-- 1) SCHEMA
-- ---------------------------------------------------------------------
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `barangays` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `contact_number` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `about` text,
  `hall_address` varchar(255) DEFAULT NULL,
  `hotline` varchar(50) DEFAULT NULL,
  `office_hours` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barangays_name_unique` (`name`),
  UNIQUE KEY `barangays_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('super_admin','office_supervisor','barangay_rep') NOT NULL DEFAULT 'barangay_rep',
  `barangay_id` bigint unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_barangay_id_foreign` (`barangay_id`),
  CONSTRAINT `users_barangay_id_foreign` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `payload` longtext NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `report_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `cycle` enum('weekly','monthly','quarterly','semestral','annual') NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resources` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `report_category_id` bigint unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(30) NOT NULL DEFAULT 'template',
  `description` text,
  `file_path` varchar(255) NOT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `sha256` char(64) DEFAULT NULL,
  `version` varchar(255) NOT NULL DEFAULT '1.0',
  `is_current` tinyint(1) NOT NULL DEFAULT 1,
  `effective_date` date DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `uploaded_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `resources_report_category_id_foreign` (`report_category_id`),
  KEY `resources_uploaded_by_foreign` (`uploaded_by`),
  KEY `resources_type_is_current_index` (`type`,`is_current`),
  CONSTRAINT `resources_report_category_id_foreign` FOREIGN KEY (`report_category_id`) REFERENCES `report_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resources_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `submissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `barangay_id` bigint unsigned NOT NULL,
  `report_category_id` bigint unsigned NOT NULL,
  `period_label` varchar(255) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `due_date` date NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `status` enum('pending','submitted','under_review','compliant','non_compliant') NOT NULL DEFAULT 'pending',
  `submitted_by` bigint unsigned DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_remarks` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_submission_period` (`barangay_id`,`report_category_id`,`period_label`),
  KEY `submissions_report_category_id_foreign` (`report_category_id`),
  KEY `submissions_submitted_by_foreign` (`submitted_by`),
  KEY `submissions_reviewed_by_foreign` (`reviewed_by`),
  CONSTRAINT `submissions_barangay_id_foreign` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE CASCADE,
  CONSTRAINT `submissions_report_category_id_foreign` FOREIGN KEY (`report_category_id`) REFERENCES `report_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `submissions_submitted_by_foreign` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `submissions_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `submission_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `submission_id` bigint unsigned NOT NULL,
  `version` int unsigned NOT NULL,
  `path` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `size_bytes` bigint unsigned NOT NULL DEFAULT 0,
  `sha256` char(64) NOT NULL,
  `uploaded_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `submission_files_submission_id_version_unique` (`submission_id`,`version`),
  KEY `submission_files_uploaded_by_foreign` (`uploaded_by`),
  CONSTRAINT `submission_files_submission_id_foreign` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `submission_files_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `security_incidents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reported_by` bigint unsigned NOT NULL,
  `type` enum('phishing_attempt','suspicious_login','data_leak_suspicion','malware','other') NOT NULL,
  `severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
  `description` text NOT NULL,
  `evidence_path` varchar(255) DEFAULT NULL,
  `status` enum('reported','acknowledged','escalated_to_icto','resolved','false_positive') NOT NULL DEFAULT 'reported',
  `acknowledged_by` bigint unsigned DEFAULT NULL,
  `acknowledged_at` timestamp NULL DEFAULT NULL,
  `resolution_notes` text,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `security_incidents_reported_by_foreign` (`reported_by`),
  KEY `security_incidents_acknowledged_by_foreign` (`acknowledged_by`),
  CONSTRAINT `security_incidents_reported_by_foreign` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`),
  CONSTRAINT `security_incidents_acknowledged_by_foreign` FOREIGN KEY (`acknowledged_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `subject_type` varchar(255) DEFAULT NULL,
  `subject_id` bigint unsigned DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_user_id_foreign` (`user_id`),
  KEY `activity_logs_subject_type_subject_id_index` (`subject_type`,`subject_id`),
  CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `barangay_announcements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `barangay_id` bigint unsigned NOT NULL,
  `title` varchar(150) NOT NULL,
  `body` text NOT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `published_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `barangay_announcements_barangay_id_published_at_index` (`barangay_id`,`published_at`),
  KEY `barangay_announcements_created_by_foreign` (`created_by`),
  CONSTRAINT `barangay_announcements_barangay_id_foreign` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE CASCADE,
  CONSTRAINT `barangay_announcements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `barangay_programs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `barangay_id` bigint unsigned NOT NULL,
  `kind` varchar(10) NOT NULL DEFAULT 'event',
  `title` varchar(150) NOT NULL,
  `description` text,
  `category` varchar(30) NOT NULL DEFAULT 'other',
  `venue` varchar(150) DEFAULT NULL,
  `starts_at` timestamp NULL DEFAULT NULL,
  `ends_at` timestamp NULL DEFAULT NULL,
  `schedule_note` varchar(150) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `barangay_programs_barangay_id_kind_starts_at_index` (`barangay_id`,`kind`,`starts_at`),
  KEY `barangay_programs_created_by_foreign` (`created_by`),
  CONSTRAINT `barangay_programs_barangay_id_foreign` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE CASCADE,
  CONSTRAINT `barangay_programs_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Tell Laravel these migrations already ran, so `php artisan migrate` will not try to re-create the tables.
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
  (1, '0001_01_01_000000_create_users_table', 1),
  (2, '0001_01_01_000001_create_cache_table', 1),
  (3, '0001_01_01_000002_create_jobs_table', 1),
  (4, '2024_01_01_000001_create_barangays_table', 1),
  (5, '2024_01_01_000002_add_role_and_barangay_to_users_table', 1),
  (6, '2024_01_01_000003_create_report_categories_table', 1),
  (7, '2024_01_01_000004_create_submissions_table', 1),
  (8, '2024_01_01_000005_create_security_incidents_table', 1),
  (9, '2024_01_01_000006_create_activity_logs_table', 1),
  (10, '2026_09_27_091637_create_personal_access_tokens_table', 1),
  (11, '2026_10_02_000001_add_repository_versions_and_resource_library', 1),
  (12, '2026_10_07_000001_remove_non_makati_barangays', 1),
  (13, '2026_10_08_000001_create_barangay_public_info', 1);

-- ---------------------------------------------------------------------
-- 2) REFERENCE DATA + USER ACCOUNTS
-- ---------------------------------------------------------------------
-- Barangays of Makati City (Embo barangays, Pitogo and Post Proper Northside/Southside removed)
INSERT INTO `barangays` (`id`, `name`, `code`, `contact_person`, `contact_number`, `contact_email`, `is_active`, `created_at`, `updated_at`) VALUES
  (1, 'Bangkal', 'BGY-001', 'Punong Barangay of Bangkal', '0917-000-0001', 'bangkal@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (2, 'Bel-Air', 'BGY-002', 'Punong Barangay of Bel-Air', '0917-000-0002', 'bel-air@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (3, 'Carmona', 'BGY-003', 'Punong Barangay of Carmona', '0917-000-0003', 'carmona@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (6, 'Dasmariñas', 'BGY-006', 'Punong Barangay of Dasmariñas', '0917-000-0006', 'dasmarinas@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (8, 'Forbes Park', 'BGY-008', 'Punong Barangay of Forbes Park', '0917-000-0008', 'forbes.park@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (9, 'Guadalupe Nuevo', 'BGY-009', 'Punong Barangay of Guadalupe Nuevo', '0917-000-0009', 'guadalupe.nuevo@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (10, 'Guadalupe Viejo', 'BGY-010', 'Punong Barangay of Guadalupe Viejo', '0917-000-0010', 'guadalupe.viejo@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (11, 'Kasilawan', 'BGY-011', 'Punong Barangay of Kasilawan', '0917-000-0011', 'kasilawan@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (12, 'La Paz', 'BGY-012', 'Punong Barangay of La Paz', '0917-000-0012', 'la.paz@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (13, 'Magallanes', 'BGY-013', 'Punong Barangay of Magallanes', '0917-000-0013', 'magallanes@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (14, 'Olympia', 'BGY-014', 'Punong Barangay of Olympia', '0917-000-0014', 'olympia@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (15, 'Palanan', 'BGY-015', 'Punong Barangay of Palanan', '0917-000-0015', 'palanan@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (17, 'Pinagkaisahan', 'BGY-017', 'Punong Barangay of Pinagkaisahan', '0917-000-0017', 'pinagkaisahan@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (18, 'Pio del Pilar', 'BGY-018', 'Punong Barangay of Pio del Pilar', '0917-000-0018', 'pio.del.pilar@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (20, 'Poblacion', 'BGY-020', 'Punong Barangay of Poblacion', '0917-000-0020', 'poblacion@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (23, 'Rizal', 'BGY-023', 'Punong Barangay of Rizal', '0917-000-0023', 'rizal@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (24, 'San Antonio', 'BGY-024', 'Punong Barangay of San Antonio', '0917-000-0024', 'san.antonio@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (25, 'San Isidro', 'BGY-025', 'Punong Barangay of San Isidro', '0917-000-0025', 'san.isidro@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (26, 'San Lorenzo', 'BGY-026', 'Punong Barangay of San Lorenzo', '0917-000-0026', 'san.lorenzo@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (27, 'Santa Cruz', 'BGY-027', 'Punong Barangay of Santa Cruz', '0917-000-0027', 'santa.cruz@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (28, 'Singkamas', 'BGY-028', 'Punong Barangay of Singkamas', '0917-000-0028', 'singkamas@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (30, 'Tejeros', 'BGY-030', 'Punong Barangay of Tejeros', '0917-000-0030', 'tejeros@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (31, 'Urdaneta', 'BGY-031', 'Punong Barangay of Urdaneta', '0917-000-0031', 'urdaneta@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (32, 'Valenzuela', 'BGY-032', 'Punong Barangay of Valenzuela', '0917-000-0032', 'valenzuela@barangay.test', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00');

-- Report categories (the "3 Rs": what barangays must submit)
INSERT INTO `report_categories` (`id`, `name`, `cycle`, `description`, `created_at`, `updated_at`) VALUES
  (1, 'Monthly Accomplishment Report', 'monthly', 'Summary of barangay programs, projects and activities accomplished during the month.', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (2, 'Weekly Peace and Order Situation Report', 'weekly', 'Weekly peace and order, blotter and incident summary.', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (3, 'Quarterly Barangay Financial Report', 'quarterly', 'Statement of income and expenditures for the quarter.', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (4, 'Semestral Barangay Development Plan Update', 'semestral', 'Progress update on the Barangay Development Plan.', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (5, 'Annual Barangay Profile', 'annual', 'Yearly update of the barangay profile and demographic data.', '2026-09-30 09:00:00', '2026-09-30 09:00:00');

-- Users. Password for ALL accounts = password123   (bcrypt hash below)
INSERT INTO `users` (`id`, `name`, `email`, `role`, `barangay_id`, `is_active`, `email_verified_at`, `password`, `created_at`, `updated_at`) VALUES
  (1, 'DILG Makati Admin', 'admin@dilg.gov.ph', 'super_admin', NULL, 1, '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (2, 'DILG Makati Supervisor', 'supervisor@dilg.gov.ph', 'office_supervisor', NULL, 1, '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (3, 'Bangkal Barangay Representative', 'rep.bangkal@barangay.test', 'barangay_rep', 1, 1, '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (4, 'Poblacion Barangay Representative', 'rep.poblacion@barangay.test', 'barangay_rep', 20, 1, '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (5, 'Rizal Barangay Representative', 'rep.rizal@barangay.test', 'barangay_rep', 23, 1, '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (7, 'San Antonio Barangay Representative', 'rep.san.antonio@barangay.test', 'barangay_rep', 24, 1, '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00');

-- ---------------------------------------------------------------------
-- 3) OPTIONAL SAMPLE DATA (so the Talaghayan dashboard is not empty)
--    Skip / delete this section for a clean production database.
-- ---------------------------------------------------------------------
INSERT INTO `submissions` (`id`, `barangay_id`, `report_category_id`, `period_label`, `period_start`, `period_end`, `due_date`, `file_path`, `original_filename`, `status`, `submitted_by`, `submitted_at`, `reviewed_by`, `reviewed_at`, `review_remarks`, `created_at`, `updated_at`) VALUES
  (1, 1, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', 3, '2026-09-01 09:56:00', 1, '2026-09-03 09:56:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (2, 2, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'under_review', NULL, '2026-09-01 17:35:00', 2, '2026-09-03 17:35:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (3, 3, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'non_compliant', NULL, '2026-09-01 08:39:00', 1, '2026-09-03 08:39:00', 'Missing signature of the Punong Barangay.', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (6, 6, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (8, 8, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', NULL, '2026-09-04 17:19:00', 1, '2026-09-06 17:19:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (9, 9, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'non_compliant', NULL, '2026-09-03 14:05:00', 2, '2026-09-05 14:05:00', 'Incomplete attachments.', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (10, 10, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'under_review', NULL, '2026-09-02 17:56:00', 2, '2026-09-04 17:56:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (11, 11, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', NULL, '2026-09-01 14:36:00', 2, '2026-09-03 14:36:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (12, 12, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', NULL, '2026-09-05 10:52:00', 1, '2026-09-07 10:52:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (13, 13, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (14, 14, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', NULL, '2026-09-05 14:30:00', 1, '2026-09-07 14:30:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (15, 15, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', NULL, '2026-09-04 09:40:00', 2, '2026-09-06 09:40:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (17, 17, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', NULL, '2026-09-01 14:27:00', 1, '2026-09-03 14:27:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (18, 18, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', NULL, '2026-09-06 10:41:00', 2, '2026-09-08 10:41:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (20, 20, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', 4, '2026-09-02 16:42:00', 1, '2026-09-04 16:42:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (23, 23, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', 5, '2026-09-02 11:47:00', 2, '2026-09-04 11:47:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (24, 24, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', 7, '2026-09-08 15:37:00', 1, '2026-09-10 15:37:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (25, 25, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', NULL, '2026-09-04 17:02:00', 2, '2026-09-06 17:02:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (26, 26, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', NULL, '2026-09-03 13:42:00', 2, '2026-09-05 13:42:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (27, 27, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'compliant', NULL, '2026-09-04 15:37:00', 1, '2026-09-06 15:37:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (28, 28, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (30, 30, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'submitted', NULL, '2026-09-01 14:24:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (31, 31, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'non_compliant', NULL, '2026-09-01 14:00:00', 1, '2026-09-03 14:00:00', 'Incomplete attachments.', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (32, 32, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', NULL, NULL, 'under_review', NULL, '2026-09-05 13:59:00', 1, '2026-09-07 13:59:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (34, 1, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (35, 2, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'submitted', NULL, '2026-09-22 17:39:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (36, 3, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (39, 6, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'submitted', NULL, '2026-09-18 10:02:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (41, 8, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (42, 9, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'submitted', NULL, '2026-09-22 08:08:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (43, 10, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'submitted', NULL, '2026-09-18 16:57:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (44, 11, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (45, 12, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'compliant', NULL, '2026-09-28 10:24:00', 2, '2026-09-30 10:00:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (46, 13, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'submitted', NULL, '2026-09-21 09:24:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (47, 14, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'under_review', NULL, '2026-09-20 10:16:00', 2, '2026-09-22 10:16:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (48, 15, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'submitted', NULL, '2026-09-27 14:18:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (50, 17, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'submitted', NULL, '2026-09-23 16:50:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (51, 18, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'under_review', NULL, '2026-09-16 11:14:00', 1, '2026-09-18 11:14:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (53, 20, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (56, 23, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (57, 24, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'compliant', 7, '2026-09-15 13:54:00', 1, '2026-09-17 13:54:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (58, 25, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'submitted', NULL, '2026-09-25 17:50:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (59, 26, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'submitted', NULL, '2026-09-16 17:45:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (60, 27, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'under_review', NULL, '2026-09-27 17:46:00', 1, '2026-09-29 17:46:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (61, 28, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'submitted', NULL, '2026-09-24 12:42:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (63, 30, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (64, 31, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'compliant', NULL, '2026-09-25 08:48:00', 2, '2026-09-27 08:48:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (65, 32, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (67, 1, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', 3, '2026-09-28 09:18:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (68, 2, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (69, 3, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'under_review', NULL, '2026-09-19 09:00:00', 2, '2026-09-21 09:00:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (72, 6, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-15 08:06:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (74, 8, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-22 17:40:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (75, 9, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (76, 10, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (77, 11, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (78, 12, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-18 17:29:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (79, 13, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-25 09:43:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (80, 14, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-23 12:24:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (81, 15, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-28 13:03:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (83, 17, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-15 12:44:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (84, 18, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-26 09:19:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (86, 20, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', 4, '2026-09-29 08:34:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (89, 23, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'compliant', 5, '2026-09-17 16:22:00', 2, '2026-09-19 16:22:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (90, 24, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'compliant', 7, '2026-09-24 10:22:00', 2, '2026-09-26 10:22:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (91, 25, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-18 14:42:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (92, 26, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'under_review', NULL, '2026-09-17 10:34:00', 1, '2026-09-19 10:34:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (93, 27, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (94, 28, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (96, 30, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-19 10:14:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (97, 31, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'compliant', NULL, '2026-09-19 16:30:00', 2, '2026-09-21 16:30:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (98, 32, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', NULL, NULL, 'submitted', NULL, '2026-09-20 10:40:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00');

INSERT INTO `security_incidents` (`id`, `reported_by`, `type`, `severity`, `description`, `evidence_path`, `status`, `acknowledged_by`, `acknowledged_at`, `resolution_notes`, `resolved_at`, `created_at`, `updated_at`) VALUES
  (1, 3, 'phishing_attempt', 'medium', 'Received an email pretending to be from DILG asking for our portal password.', NULL, 'acknowledged', 1, '2026-09-28 10:15:00', NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (2, 5, 'suspicious_login', 'high', 'Login notification from an unknown location on the barangay shared account.', NULL, 'escalated_to_icto', 2, '2026-09-29 08:40:00', NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (3, 4, 'malware', 'critical', 'Barangay hall PC flagged by antivirus after opening a .xls attachment.', NULL, 'reported', NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00');

-- ---------------------------------------------------------------------
--  Citizens View sample data (public profile, announcements, events, programs)
--  Dates are fixed around 2026-10-09; edit or delete them from the portal.
-- ---------------------------------------------------------------------
UPDATE `barangays` SET `about` = 'A residential and commercial barangay in the heart of Makati. The barangay hall serves residents with certificates, clearances and community programs.', `hall_address` = 'Barangay Hall, Bangkal, Makati City', `office_hours` = 'Monday to Friday, 8:00 AM to 5:00 PM' WHERE `id` = 1;
UPDATE `barangays` SET `about` = 'A residential barangay known for its tree-lined streets. The barangay focuses on safety, cleanliness and neighbourhood programs.', `hall_address` = 'Barangay Hall, Bel-Air, Makati City', `office_hours` = 'Monday to Friday, 8:00 AM to 5:00 PM' WHERE `id` = 2;
UPDATE `barangays` SET `about` = 'A busy mixed-use barangay with shops, restaurants and homes. The barangay supports small businesses and keeps the community safe.', `hall_address` = 'Barangay Hall, Poblacion, Makati City', `office_hours` = 'Monday to Friday, 8:00 AM to 5:00 PM' WHERE `id` = 20;
UPDATE `barangays` SET `about` = 'A residential barangay with a close-knit community. Programs focus on senior citizens, youth and the environment.', `hall_address` = 'Barangay Hall, Rizal, Makati City', `office_hours` = 'Monday to Friday, 8:00 AM to 5:00 PM' WHERE `id` = 23;
UPDATE `barangays` SET `about` = 'A residential barangay offering skills training and disaster preparedness for its families.', `hall_address` = 'Barangay Hall, San Antonio, Makati City', `office_hours` = 'Monday to Friday, 8:00 AM to 5:00 PM' WHERE `id` = 24;

INSERT INTO `barangay_announcements` (`id`, `barangay_id`, `title`, `body`, `is_pinned`, `published_at`, `created_by`, `created_at`, `updated_at`) VALUES
  (1, 1, 'Barangay Assembly this month', 'All residents are invited to the quarterly Barangay Assembly. Please bring a valid ID. Updates on projects and the barangay budget will be presented.', 1, '2026-10-07 10:00:00', 3, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (2, 1, 'Water interruption notice', 'Scheduled pipe maintenance may cause low water pressure in some puroks. Please store water ahead of time.', 0, '2026-10-04 10:00:00', 3, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (3, 2, 'Free anti-rabies vaccination for pets', 'Bring your dog or cat to the barangay hall. Pets must be on a leash or inside a carrier.', 1, '2026-10-06 10:00:00', NULL, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (4, 2, 'Clean-up drive volunteers needed', 'Join your neighbours in keeping Bel-Air clean. Gloves and bags will be provided.', 0, '2026-10-01 10:00:00', NULL, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (5, 20, 'Business permit renewal reminder', 'Business owners are reminded to renew their barangay clearance before the deadline to avoid penalties.', 1, '2026-10-08 10:00:00', 4, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (6, 20, 'Night market schedule', 'The weekend night market runs on its regular schedule. Vendors, please coordinate with the barangay hall for stall assignments.', 0, '2026-10-03 10:00:00', 4, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (7, 23, 'Senior citizen pension orientation', 'Senior citizens and their families are invited to an orientation on pension and benefits.', 1, '2026-10-05 10:00:00', 5, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (8, 23, 'Declogging of canals this week', 'Barangay crews will be declogging canals. Please avoid throwing garbage into drainage.', 0, '2026-10-02 10:00:00', 5, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (9, 24, 'Livelihood training slots open', 'Slots are open for the food processing livelihood training. Register at the barangay hall.', 1, '2026-10-07 10:00:00', 7, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (10, 24, 'Typhoon preparedness reminder', 'Prepare a go-bag, charge your phones and know your evacuation center. Follow barangay announcements.', 0, '2026-09-30 10:00:00', 7, '2026-10-09 10:00:00', '2026-10-09 10:00:00');

INSERT INTO `barangay_programs` (`id`, `barangay_id`, `kind`, `title`, `description`, `category`, `venue`, `starts_at`, `ends_at`, `schedule_note`, `created_by`, `created_at`, `updated_at`) VALUES
  (1, 1, 'event', 'Quarterly Barangay Assembly', 'Open to all residents. Reports on projects and the budget.', 'social_services', 'Bangkal Barangay Hall', '2026-10-15 06:00:00', '2026-10-15 08:00:00', NULL, 3, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (2, 1, 'event', 'Medical and Dental Mission', 'Free check-ups, dental cleaning and medicines while supplies last.', 'health', 'Bangkal Covered Court', '2026-10-23 00:00:00', '2026-10-23 06:00:00', NULL, 3, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (3, 1, 'event', 'Youth Basketball League Opening', 'Opening ceremony and first games of the barangay league.', 'sports_youth', 'Bangkal Covered Court', '2026-11-05 07:00:00', '2026-11-05 10:00:00', NULL, 3, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (4, 2, 'event', 'Pet Anti-Rabies Vaccination', 'Free vaccination for dogs and cats.', 'health', 'Bel-Air Barangay Hall', '2026-10-18 01:00:00', '2026-10-18 05:00:00', NULL, NULL, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (5, 2, 'event', 'Community Clean-Up Drive', 'Bring gloves if you have them. Bags and refreshments provided.', 'environment', 'Bel-Air Plaza', '2026-10-24 22:00:00', '2026-10-25 01:00:00', NULL, NULL, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (6, 20, 'event', 'Business Permit Renewal Desk', 'Extended desk for business clearance renewals.', 'social_services', 'Poblacion Barangay Hall', '2026-10-14 01:00:00', '2026-10-14 09:00:00', NULL, 4, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (7, 20, 'event', 'Peace and Order Dialogue', 'Residents and tanod meet to discuss safety concerns.', 'peace_and_order', 'Poblacion Barangay Hall', '2026-10-27 07:00:00', '2026-10-27 09:00:00', NULL, 4, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (8, 20, 'event', 'Christmas Tree Lighting', 'Community program with music and food stalls.', 'other', 'Poblacion Plaza', '2026-11-30 10:00:00', '2026-11-30 13:00:00', NULL, 4, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (9, 23, 'event', 'Senior Citizens Pension Orientation', 'Learn how to claim pension and other benefits.', 'social_services', 'Rizal Barangay Hall', '2026-10-17 02:00:00', '2026-10-17 05:00:00', NULL, 5, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (10, 23, 'event', 'Tree Planting Activity', 'Volunteers welcome. Seedlings provided.', 'environment', 'Rizal Riverside', '2026-10-29 23:00:00', '2026-10-30 03:00:00', NULL, 5, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (11, 24, 'event', 'Livelihood Training: Food Processing', 'Hands-on training. Limited slots, register early.', 'livelihood', 'San Antonio Barangay Hall', '2026-10-20 01:00:00', '2026-10-20 07:00:00', NULL, 7, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (12, 24, 'event', 'Disaster Preparedness Drill', 'Earthquake and fire drill for all households.', 'peace_and_order', 'San Antonio Covered Court', '2026-11-03 01:00:00', '2026-11-03 04:00:00', NULL, 7, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (13, 1, 'program', 'Feeding Program', 'Weekly supplemental feeding for children of the barangay.', 'health', NULL, NULL, NULL, 'Every Saturday, 8 AM to 11 AM', 3, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (14, 1, 'program', 'Scholarship Assistance', 'Help with school fees for qualified students.', 'education', NULL, NULL, NULL, 'Applications open each semester', 3, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (15, 2, 'program', 'Senior Citizen Wellness Hour', 'Light exercise and blood pressure checks for seniors.', 'health', NULL, NULL, NULL, 'Every Tuesday, 9 AM', NULL, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (16, 20, 'program', 'Livelihood Bazaar', 'A place for residents to sell homemade products.', 'livelihood', NULL, NULL, NULL, 'Every Friday, 3 PM', 4, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (17, 20, 'program', 'Barangay Legal Aid Desk', 'Free legal advice for residents.', 'social_services', NULL, NULL, NULL, 'Monday to Friday, 1 PM to 4 PM', 4, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (18, 23, 'program', 'Youth Tutorial Sessions', 'Free tutoring for elementary and high school students.', 'education', NULL, NULL, NULL, 'Every Wednesday, 4 PM', 5, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (19, 23, 'program', 'Zumba for Health', 'Free community exercise session.', 'sports_youth', NULL, NULL, NULL, 'Monday, Wednesday and Friday, 5:30 AM', 5, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (20, 24, 'program', 'Skills Training Center', 'Short courses in cooking, sewing and basic electrical work.', 'livelihood', NULL, NULL, NULL, 'Weekdays, 9 AM to 3 PM', 7, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (21, 24, 'program', 'Solid Waste Segregation Drive', 'Sort your waste to keep San Antonio clean.', 'environment', NULL, NULL, NULL, 'Collection every Thursday', 7, '2026-10-09 10:00:00', '2026-10-09 10:00:00');
