CREATE DATABASE IF NOT EXISTS `dilg_makati_portal` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dilg_makati_portal`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `form_submissions`, `form_templates`,
  `requirement_responses`, `requirement_assignments`, `requirement_files`, `requirements`,
  `barangay_programs`, `barangay_announcements`, `activity_logs`, `security_incidents`, `submission_files`, `submissions`, `resources`,
  `report_categories`, `bagwis_ppa_entries`, `bagwis_ppas`, `repository_documents`, `document_categories`,
  `sessions`, `users`, `barangays`, `cache`, `cache_locks`,
  -- tables from the old schema that the system no longer uses (so re-importing cleans them away)
  `personal_access_tokens`, `password_reset_tokens`, `jobs`, `job_batches`, `failed_jobs`,
  `migrations`;

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
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `contact_number` varchar(50) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('super_admin','office_supervisor','barangay_rep') NOT NULL DEFAULT 'barangay_rep',
  `barangay_id` bigint unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `invited_at` timestamp NULL DEFAULT NULL,
  `activated_at` timestamp NULL DEFAULT NULL,
  `activation_token` varchar(64) DEFAULT NULL,
  `activation_expires_at` timestamp NULL DEFAULT NULL,
  `terms_accepted_at` timestamp NULL DEFAULT NULL,
  `profile_photo_path` varchar(2048) DEFAULT NULL,
  `verification_status` enum('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified',
  `verified_at` timestamp NULL DEFAULT NULL,
  `verified_by` bigint unsigned DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_activation_token_unique` (`activation_token`),
  KEY `users_barangay_id_foreign` (`barangay_id`),
  KEY `users_created_by_foreign` (`created_by`),
  KEY `users_verified_by_foreign` (`verified_by`),
  CONSTRAINT `users_barangay_id_foreign` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_verified_by_foreign` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
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

CREATE TABLE `report_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(60) NULL UNIQUE,
  `cycle` enum('weekly','monthly','quarterly','semestral','annual') NOT NULL,
  `description` text,
  `sector` varchar(30) DEFAULT 'Barangay',
  `scope` varchar(30) NULL,
  `deadline_description` varchar(255) NULL,
  `barangay_action` varchar(255) NULL,
  `supervisor_action` varchar(255) NULL,
  `sort_order` smallint unsigned DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resources` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `report_category_id` bigint unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(30) NOT NULL DEFAULT 'template',
  `resource_group` varchar(60) DEFAULT 'standard_formats',
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
  KEY `activity_logs_created_at_index` (`created_at`),
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

-- Requirements: DILG sends files/complaints/memos to barangays; barangays comply back.
CREATE TABLE `requirements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `kind` varchar(20) NOT NULL DEFAULT 'file',
  `description` text,
  `due_date` date DEFAULT NULL,
  `requires_response` tinyint(1) NOT NULL DEFAULT 1,
  `audience` varchar(10) NOT NULL DEFAULT 'all',
  `status` varchar(10) NOT NULL DEFAULT 'open',
  `created_by` bigint unsigned NOT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `requirements_status_due_date_index` (`status`,`due_date`),
  KEY `requirements_created_by_foreign` (`created_by`),
  CONSTRAINT `requirements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `requirement_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `requirement_id` bigint unsigned NOT NULL,
  `path` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `size_bytes` bigint unsigned NOT NULL DEFAULT 0,
  `sha256` varchar(64) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `requirement_files_requirement_id_foreign` (`requirement_id`),
  CONSTRAINT `requirement_files_requirement_id_foreign` FOREIGN KEY (`requirement_id`) REFERENCES `requirements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `requirement_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `requirement_id` bigint unsigned NOT NULL,
  `barangay_id` bigint unsigned NOT NULL,
  `status` varchar(12) NOT NULL DEFAULT 'pending',
  `received_at` timestamp NULL DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `requirement_assignments_requirement_id_barangay_id_unique` (`requirement_id`,`barangay_id`),
  KEY `requirement_assignments_barangay_id_status_index` (`barangay_id`,`status`),
  KEY `requirement_assignments_reviewed_by_foreign` (`reviewed_by`),
  CONSTRAINT `requirement_assignments_requirement_id_foreign` FOREIGN KEY (`requirement_id`) REFERENCES `requirements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `requirement_assignments_barangay_id_foreign` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE CASCADE,
  CONSTRAINT `requirement_assignments_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `requirement_responses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `assignment_id` bigint unsigned NOT NULL,
  `version` int unsigned NOT NULL DEFAULT 1,
  `note` text,
  `path` varchar(255) DEFAULT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `size_bytes` bigint unsigned NOT NULL DEFAULT 0,
  `sha256` varchar(64) DEFAULT NULL,
  `uploaded_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `requirement_responses_assignment_id_foreign` (`assignment_id`),
  KEY `requirement_responses_uploaded_by_foreign` (`uploaded_by`),
  CONSTRAINT `requirement_responses_assignment_id_foreign` FOREIGN KEY (`assignment_id`) REFERENCES `requirement_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `requirement_responses_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Editable form templates (supervisors create these)
CREATE TABLE `form_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100) DEFAULT 'general',
  `fields` json NOT NULL COMMENT 'Array of field definitions [{name, type, label, required, options}]',
  `version` varchar(20) NOT NULL DEFAULT '1.0',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `form_templates_created_by_foreign` (`created_by`),
  CONSTRAINT `form_templates_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Form submissions (barangay reps fill out and e-sign)
CREATE TABLE `form_submissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `form_template_id` bigint unsigned NOT NULL,
  `requirement_id` bigint unsigned DEFAULT NULL COMMENT 'Links to requirement if this form was sent as a requirement',
  `barangay_id` bigint unsigned NOT NULL,
  `data` json NOT NULL COMMENT 'Key-value pairs matching the template fields',
  `status` varchar(20) NOT NULL DEFAULT 'draft' COMMENT 'draft, submitted, approved, revision, rejected',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `submitted_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `review_notes` text,
  `signature_data` longtext COMMENT 'Base64-encoded signature image',
  `signature_name` varchar(255) DEFAULT NULL,
  `signature_position` varchar(255) DEFAULT NULL,
  `signed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `form_submissions_template_foreign` (`form_template_id`),
  KEY `form_submissions_requirement_foreign` (`requirement_id`),
  KEY `form_submissions_barangay_foreign` (`barangay_id`),
  KEY `form_submissions_submitted_by_foreign` (`submitted_by`),
  KEY `form_submissions_reviewed_by_foreign` (`reviewed_by`),
  CONSTRAINT `form_submissions_template_foreign` FOREIGN KEY (`form_template_id`) REFERENCES `form_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_submissions_requirement_foreign` FOREIGN KEY (`requirement_id`) REFERENCES `requirements` (`id`) ON DELETE SET NULL,
  CONSTRAINT `form_submissions_barangay_foreign` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_submissions_submitted_by_foreign` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `form_submissions_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bagwis PPAs (city-level programs)
CREATE TABLE `bagwis_ppas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(60) NOT NULL UNIQUE,
  `frequency` varchar(30) NOT NULL,
  `responsible_office` varchar(255) NOT NULL,
  `description` text NULL,
  `deadline_description` varchar(255) NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` smallint unsigned DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bagwis_ppa_entries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `bagwis_ppa_id` bigint unsigned NOT NULL,
  `period_label` varchar(40) NOT NULL,
  `status` varchar(30) DEFAULT 'pending',
  `remarks` text NULL,
  `submitted_by` bigint unsigned NULL,
  `submitted_at` timestamp NULL,
  `reviewed_by` bigint unsigned NULL,
  `reviewed_at` timestamp NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_ppa_period` (`bagwis_ppa_id`, `period_label`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ppa_entry_ppa` FOREIGN KEY (`bagwis_ppa_id`) REFERENCES `bagwis_ppas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ppa_entry_submitter` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ppa_entry_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
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
  (13, '2026_10_08_000001_create_barangay_public_info', 1),
  (14, '2026_10_11_000001_add_activation_to_users_table', 1),
  (15, '2026_10_12_000001_remove_unused_tables_and_columns', 1),
  (16, '2026_10_13_000001_create_requirements_tables', 1);

-- ---------------------------------------------------------------------
-- 2) REFERENCE DATA + USER ACCOUNTS
-- ---------------------------------------------------------------------
-- Barangays of Makati City (Embo barangays, Pitogo and Post Proper Northside/Southside removed)
INSERT INTO `barangays` (`id`, `name`, `code`, `is_active`, `created_at`, `updated_at`) VALUES
  (1, 'Bangkal', 'BGY-001', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (2, 'Bel-Air', 'BGY-002', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (3, 'Carmona', 'BGY-003', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (6, 'Dasmariñas', 'BGY-006', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (8, 'Forbes Park', 'BGY-008', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (9, 'Guadalupe Nuevo', 'BGY-009', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (10, 'Guadalupe Viejo', 'BGY-010', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (11, 'Kasilawan', 'BGY-011', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (12, 'La Paz', 'BGY-012', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (13, 'Magallanes', 'BGY-013', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (14, 'Olympia', 'BGY-014', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (15, 'Palanan', 'BGY-015', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (17, 'Pinagkaisahan', 'BGY-017', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (18, 'Pio del Pilar', 'BGY-018', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (20, 'Poblacion', 'BGY-020', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (24, 'San Antonio', 'BGY-024', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (25, 'San Isidro', 'BGY-025', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (26, 'San Lorenzo', 'BGY-026', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (27, 'Santa Cruz', 'BGY-027', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (28, 'Singkamas', 'BGY-028', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (30, 'Tejeros', 'BGY-030', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (31, 'Urdaneta', 'BGY-031', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (32, 'Valenzuela', 'BGY-032', 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00');

-- Report categories (the "3 Rs": what barangays must submit)
INSERT INTO `report_categories` (`id`, `name`, `slug`, `cycle`, `description`, `sector`, `scope`, `deadline_description`, `barangay_action`, `supervisor_action`, `sort_order`, `created_at`, `updated_at`) VALUES
  (1, 'Monthly Accomplishment Report', NULL, 'monthly', 'Summary of barangay programs, projects and activities accomplished during the month.', 'Barangay', NULL, NULL, NULL, NULL, 0, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (2, 'Weekly Peace and Order Situation Report', NULL, 'weekly', 'Weekly peace and order, blotter and incident summary.', 'Barangay', NULL, NULL, NULL, NULL, 0, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (3, 'Quarterly Barangay Financial Report', NULL, 'quarterly', 'Statement of income and expenditures for the quarter.', 'Barangay', NULL, NULL, NULL, NULL, 0, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (4, 'Semestral Barangay Development Plan Update', NULL, 'semestral', 'Progress update on the Barangay Development Plan.', 'Barangay', NULL, NULL, NULL, NULL, 0, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (5, 'Annual Barangay Profile', NULL, 'annual', 'Yearly update of the barangay profile and demographic data.', 'Barangay', NULL, NULL, NULL, NULL, 0, '2026-09-30 09:00:00', '2026-09-30 09:00:00');

-- PDF Architecture: 14 BORMS report categories
INSERT INTO `report_categories` (`slug`, `name`, `cycle`, `description`, `sector`, `scope`, `deadline_description`, `barangay_action`, `supervisor_action`, `sort_order`, `created_at`, `updated_at`) VALUES
  ('cleanup-barkada', 'Clean-Up (BARKADA Report)', 'weekly', 'Barangay Kalinisan Day — lingguhang paglilinis at clean-up drive sa bawat barangay.', 'Barangay', NULL, 'Tuwing Lunes', 'Submit photo docs & attendance', 'Review / Validate', 1, NOW(), NOW()),
  ('barco', 'BaRCO (Road Clearing)', 'monthly', 'Barangay Road Clearing Operations — buwanang pag-uulat ng paglilinis ng mga kalsada at bangketa.', 'Barangay', NULL, 'Tuwing ika-20 ng buwan', 'Submit road clearing form', 'Review / Validate', 2, NOW(), NOW()),
  ('eca', 'ECA (Compliance Assessment)', 'monthly', 'Enhanced Compliance Assessment — pagsusuri sa pagsunod ng lokal na pamahalaan sa environmental laws at ecological sanitation.', 'Barangay', NULL, 'Regular Monthly', 'Submit compliance checklist', 'Review / Validate', 3, NOW(), NOW()),
  ('vaw-desk', 'VAW Desk Report', 'quarterly', 'Violence Against Women — ulat ng mga kaso at aksyon mula sa Barangay VAW Desk.', 'Barangay', NULL, 'Ika-5 ng Apr, Jul, Oct, Dec', 'Submit quarterly cases log', 'Review / Validate', 4, NOW(), NOW()),
  ('vac-report', 'VAC Report (Child Protection)', 'quarterly', 'Violence Against Children — ulat ng mga kasong naaksyunan para sa proteksyon ng kabataan.', 'Barangay', NULL, 'Ika-5 ng Apr, Jul, Oct, Dec', 'Submit quarterly cases log', 'Review / Validate', 5, NOW(), NOW()),
  ('kp-report', 'KP Report (Katarungang Pambarangay)', 'quarterly', 'Katarungang Pambarangay — submit Lupon cases summary.', 'Barangay', NULL, 'Ika-5 ng Apr, Jul, Oct, Dec', 'Submit Lupon cases summary', 'Review / Validate', 6, NOW(), NOW()),
  ('bfdp', 'BFDP (Brgy Full Disclosure Policy)', 'quarterly', 'Barangay Full Disclosure Policy — upload photos of 3 transparency boards & financial docs.', 'Barangay', NULL, 'Ika-10 ng Apr, Jul, Oct, Dec', 'Upload photos of 3 boards & financial docs', 'Review / Audit Compliance', 7, NOW(), NOW()),
  ('skfdp', 'SKFDP (SK Full Disclosure Policy)', 'quarterly', 'Sangguniang Kabataan Full Disclosure Policy — upload SK financial postings & budget.', 'SK', NULL, 'Ika-10 ng Apr, Jul, Oct, Dec', 'Upload SK financial postings & budget', 'Review / Audit Compliance', 8, NOW(), NOW()),
  ('ba-soba', 'Barangay Assembly (BA / SOBA)', 'semestral', 'State of the Barangay Address / Barangay Assembly — upload post-assembly docs & minutes.', 'Barangay', NULL, 'Pagkatapos ng Assembly (Mar & Oct)', 'Upload post-assembly docs & minutes', 'Review / Validate', 9, NOW(), NOW()),
  ('rbi', 'RBI (Registry of Inhabitants)', 'semestral', 'Registry of Barangay Inhabitants — upload updated population summary.', 'Barangay', NULL, 'Kada Semestre', 'Upload updated population summary', 'Review / Validate', 10, NOW(), NOW()),
  ('kk-assembly', 'KK Assembly (Katipunan ng Kabataan)', 'semestral', 'Katipunan ng Kabataan Assembly — upload youth assembly documentation.', 'SK', NULL, 'Kada Semestre', 'Upload youth assembly documentation', 'Review / Validate', 11, NOW(), NOW()),
  ('skmt-sk-concerns', 'SKMT / SK Concerns', 'annual', 'Sangguniang Kabataan Mandatory Training — upload SK training completion documents.', 'SK', NULL, 'Depende sa Training/Election Cycle', 'Upload SK training completion', 'Review / Validate', 12, NOW(), NOW()),
  ('accomplishment-report', 'Barangay Accomplishment Report', 'annual', 'Annual accomplishment report ng barangay.', 'Barangay', NULL, 'Katapusan ng Taon', 'Submit annual accomplishment report', 'Review / Final Sign-off', 13, NOW(), NOW()),
  ('sglgb-self-audit', 'SGLGB Self-Audit Assessment', 'annual', 'Seal of Good Local Governance for Barangay — fill-out self-assessment & attach MOVs.', 'Brgy / SK', NULL, 'DILG Audit Period', 'Fill-out self-assessment & attach MOVs', 'Validate & On-site Audit', 14, NOW(), NOW());

-- Users. Password for ALL accounts = password123   (bcrypt hash below)
INSERT INTO `users` (`id`, `name`, `email`, `role`, `barangay_id`, `is_active`, `invited_at`, `activated_at`, `email_verified_at`, `password`, `created_at`, `updated_at`) VALUES
  (1, 'DILG Makati Admin', 'admin@dilg.gov.ph', 'super_admin', NULL, 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00', '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (2, 'DILG Makati Supervisor', 'supervisor@dilg.gov.ph', 'office_supervisor', NULL, 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00', '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (3, 'Bangkal Barangay Representative', 'rep.bangkal@barangay.test', 'barangay_rep', 1, 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00', '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (4, 'Poblacion Barangay Representative', 'rep.poblacion@barangay.test', 'barangay_rep', 20, 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00', '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (7, 'San Antonio Barangay Representative', 'rep.san.antonio@barangay.test', 'barangay_rep', 24, 1, '2026-09-30 09:00:00', '2026-09-30 09:00:00', '2026-09-30 09:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (9, 'Ron Suarez', 'orangeezz50805@gmail.com', 'office_supervisor', NULL, 1, '2026-10-12 17:00:19', '2026-10-12 17:01:41', '2026-10-12 17:01:41', '$2y$12$p/itb1ADoHvMDaImEs9lSOw9d7mb8FSGsDFrgj.fggfHQN6.avEES', '2026-10-12 17:00:12', '2026-10-14 18:37:05');

-- ---------------------------------------------------------------------
-- 3) OPTIONAL SAMPLE DATA (so the Talaghayan dashboard is not empty)
--    Skip / delete this section for a clean production database.
-- ---------------------------------------------------------------------
INSERT INTO `submissions` (`id`, `barangay_id`, `report_category_id`, `period_label`, `period_start`, `period_end`, `due_date`, `status`, `submitted_by`, `submitted_at`, `reviewed_by`, `reviewed_at`, `review_remarks`, `created_at`, `updated_at`) VALUES
  (1, 1, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', 3, '2026-09-01 09:56:00', 1, '2026-09-03 09:56:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (2, 2, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'under_review', NULL, '2026-09-01 17:35:00', 2, '2026-09-03 17:35:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (3, 3, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'non_compliant', NULL, '2026-09-01 08:39:00', 1, '2026-09-03 08:39:00', 'Missing signature of the Punong Barangay.', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (6, 6, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (8, 8, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', NULL, '2026-09-04 17:19:00', 1, '2026-09-06 17:19:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (9, 9, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'non_compliant', NULL, '2026-09-03 14:05:00', 2, '2026-09-05 14:05:00', 'Incomplete attachments.', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (10, 10, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'under_review', NULL, '2026-09-02 17:56:00', 2, '2026-09-04 17:56:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (11, 11, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', NULL, '2026-09-01 14:36:00', 2, '2026-09-03 14:36:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (12, 12, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', NULL, '2026-09-05 10:52:00', 1, '2026-09-07 10:52:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (13, 13, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (14, 14, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', NULL, '2026-09-05 14:30:00', 1, '2026-09-07 14:30:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (15, 15, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', NULL, '2026-09-04 09:40:00', 2, '2026-09-06 09:40:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (17, 17, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', NULL, '2026-09-01 14:27:00', 1, '2026-09-03 14:27:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (18, 18, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', NULL, '2026-09-06 10:41:00', 2, '2026-09-08 10:41:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (20, 20, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', 4, '2026-09-02 16:42:00', 1, '2026-09-04 16:42:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (23, 23, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', 5, '2026-09-02 11:47:00', 2, '2026-09-04 11:47:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (24, 24, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', 7, '2026-09-08 15:37:00', 1, '2026-09-10 15:37:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (25, 25, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', NULL, '2026-09-04 17:02:00', 2, '2026-09-06 17:02:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (26, 26, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', NULL, '2026-09-03 13:42:00', 2, '2026-09-05 13:42:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (27, 27, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', NULL, '2026-09-04 15:37:00', 1, '2026-09-06 15:37:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (28, 28, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (30, 30, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'submitted', NULL, '2026-09-01 14:24:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (31, 31, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'non_compliant', NULL, '2026-09-01 14:00:00', 1, '2026-09-03 14:00:00', 'Incomplete attachments.', '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (32, 32, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'under_review', NULL, '2026-09-05 13:59:00', 1, '2026-09-07 13:59:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (34, 1, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (35, 2, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', NULL, '2026-09-22 17:39:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (36, 3, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (39, 6, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', NULL, '2026-09-18 10:02:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (41, 8, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (42, 9, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', NULL, '2026-09-22 08:08:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (43, 10, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', NULL, '2026-09-18 16:57:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (44, 11, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (45, 12, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'compliant', NULL, '2026-09-28 10:24:00', 2, '2026-09-30 10:00:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (46, 13, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', NULL, '2026-09-21 09:24:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (47, 14, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'under_review', NULL, '2026-09-20 10:16:00', 2, '2026-09-22 10:16:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (48, 15, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', NULL, '2026-09-27 14:18:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (50, 17, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', NULL, '2026-09-23 16:50:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (51, 18, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'under_review', NULL, '2026-09-16 11:14:00', 1, '2026-09-18 11:14:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (53, 20, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (56, 23, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (57, 24, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'compliant', 7, '2026-09-15 13:54:00', 1, '2026-09-17 13:54:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (58, 25, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', NULL, '2026-09-25 17:50:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (59, 26, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', NULL, '2026-09-16 17:45:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (60, 27, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'under_review', NULL, '2026-09-27 17:46:00', 1, '2026-09-29 17:46:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (61, 28, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', NULL, '2026-09-24 12:42:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (63, 30, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (64, 31, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'compliant', NULL, '2026-09-25 08:48:00', 2, '2026-09-27 08:48:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (65, 32, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (67, 1, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', 3, '2026-09-28 09:18:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (68, 2, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (69, 3, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'under_review', NULL, '2026-09-19 09:00:00', 2, '2026-09-21 09:00:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (72, 6, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-15 08:06:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (74, 8, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-22 17:40:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (75, 9, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (76, 10, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (77, 11, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (78, 12, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-18 17:29:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (79, 13, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-25 09:43:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (80, 14, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-23 12:24:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (81, 15, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-28 13:03:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (83, 17, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-15 12:44:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (84, 18, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-26 09:19:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (86, 20, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', 4, '2026-09-29 08:34:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (89, 23, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'compliant', 5, '2026-09-17 16:22:00', 2, '2026-09-19 16:22:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (90, 24, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'compliant', 7, '2026-09-24 10:22:00', 2, '2026-09-26 10:22:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (91, 25, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-18 14:42:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (92, 26, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'under_review', NULL, '2026-09-17 10:34:00', 1, '2026-09-19 10:34:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (93, 27, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (94, 28, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (96, 30, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-19 10:14:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (97, 31, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'compliant', NULL, '2026-09-19 16:30:00', 2, '2026-09-21 16:30:00', NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00'),
  (98, 32, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', NULL, '2026-09-20 10:40:00', NULL, NULL, NULL, '2026-09-30 09:00:00', '2026-09-30 09:00:00');

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
  (11, 24, 'event', 'Livelihood Training: Food Processing', 'Hands-on training. Limited slots, register early.', 'livelihood', 'San Antonio Barangay Hall', '2026-10-20 01:00:00', '2026-10-20 07:00:00', NULL, 7, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (12, 24, 'event', 'Disaster Preparedness Drill', 'Earthquake and fire drill for all households.', 'peace_and_order', 'San Antonio Covered Court', '2026-11-03 01:00:00', '2026-11-03 04:00:00', NULL, 7, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (13, 1, 'program', 'Feeding Program', 'Weekly supplemental feeding for children of the barangay.', 'health', NULL, NULL, NULL, 'Every Saturday, 8 AM to 11 AM', 3, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (14, 1, 'program', 'Scholarship Assistance', 'Help with school fees for qualified students.', 'education', NULL, NULL, NULL, 'Applications open each semester', 3, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (15, 2, 'program', 'Senior Citizen Wellness Hour', 'Light exercise and blood pressure checks for seniors.', 'health', NULL, NULL, NULL, 'Every Tuesday, 9 AM', NULL, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (16, 20, 'program', 'Livelihood Bazaar', 'A place for residents to sell homemade products.', 'livelihood', NULL, NULL, NULL, 'Every Friday, 3 PM', 4, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (17, 20, 'program', 'Barangay Legal Aid Desk', 'Free legal advice for residents.', 'social_services', NULL, NULL, NULL, 'Monday to Friday, 1 PM to 4 PM', 4, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (20, 24, 'program', 'Skills Training Center', 'Short courses in cooking, sewing and basic electrical work.', 'livelihood', NULL, NULL, NULL, 'Weekdays, 9 AM to 3 PM', 7, '2026-10-09 10:00:00', '2026-10-09 10:00:00'),
  (21, 24, 'program', 'Solid Waste Segregation Drive', 'Sort your waste to keep San Antonio clean.', 'environment', NULL, NULL, NULL, 'Collection every Thursday', 7, '2026-10-09 10:00:00', '2026-10-09 10:00:00');

-- ---------------------------------------------------------------------
--  Demo activity for the super admin Monitoring page (delete these rows any time)
-- ---------------------------------------------------------------------
INSERT INTO `activity_logs` (`user_id`, `action`, `subject_type`, `subject_id`, `meta`, `ip_address`, `created_at`, `updated_at`) VALUES
  (1, 'user.login', NULL, NULL, '[]', '127.0.0.1', '2026-10-05 01:10:00', '2026-10-05 01:10:00'),
  (3, 'user.login', NULL, NULL, '[]', '127.0.0.1', '2026-10-06 00:30:00', '2026-10-06 00:30:00'),
  (3, 'barangay.announcement.created', NULL, NULL, '{"barangay_id": 1, "title": "Barangay Assembly this month"}', '127.0.0.1', '2026-10-07 02:00:00', '2026-10-07 02:00:00'),
  (3, 'barangay.program.created', NULL, NULL, '{"barangay_id": 1, "kind": "event", "title": "Medical and Dental Mission"}', '127.0.0.1', '2026-10-07 02:15:00', '2026-10-07 02:15:00'),
  (2, 'user.login', NULL, NULL, '[]', '127.0.0.1', '2026-10-08 01:00:00', '2026-10-08 01:00:00'),
  (2, 'submission.reviewed', NULL, NULL, '{"status": "compliant"}', '127.0.0.1', '2026-10-08 01:30:00', '2026-10-08 01:30:00'),
  (4, 'user.login', NULL, NULL, '[]', '127.0.0.1', '2026-10-08 03:00:00', '2026-10-08 03:00:00'),
  (4, 'barangay.announcement.created', NULL, NULL, '{"barangay_id": 20, "title": "Night market schedule"}', '127.0.0.1', '2026-10-08 03:20:00', '2026-10-08 03:20:00'),
  (1, 'resource.uploaded', NULL, NULL, '{"version": 1}', '127.0.0.1', '2026-10-09 02:00:00', '2026-10-09 02:00:00'),
  (7, 'user.login', NULL, NULL, '[]', '127.0.0.1', '2026-10-09 04:00:00', '2026-10-09 04:00:00'),
  (7, 'barangay.program.created', NULL, NULL, '{"barangay_id": 24, "kind": "program", "title": "Skills Training Center"}', '127.0.0.1', '2026-10-09 04:10:00', '2026-10-09 04:10:00');

-- ---------------------------------------------------------------------
--  Demo requirements data (DILG supervisor → barangays compliance flow)
--  Delete these rows any time.
-- ---------------------------------------------------------------------
INSERT INTO `requirements` (`id`, `title`, `kind`, `description`, `due_date`, `requires_response`, `audience`, `status`, `created_by`, `closed_at`, `created_at`, `updated_at`) VALUES
  (1, 'Monthly Accomplishment Report Template – October 2026', 'file', 'Please download the updated template and submit your filled-out report before the deadline.', '2026-10-31', 1, 'all', 'open', 2, NULL, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
  (2, 'Barangay Budget Utilisation Q3 2026', 'report', 'Submit your Q3 budget utilisation report with supporting receipts.', '2026-10-20', 1, 'all', 'open', 2, NULL, '2026-10-03 09:00:00', '2026-10-03 09:00:00'),
  (3, 'DILG Memorandum Circular No. 2026-45', 'memo', 'For acknowledgement only. Please confirm receipt.', NULL, 0, 'all', 'open', 2, NULL, '2026-10-05 10:00:00', '2026-10-05 10:00:00'),
  (4, 'Noise Complaint – Brgy. Bangkal Night Market', 'complaint', 'Several residents have filed noise complaints regarding the weekend night market. Please submit your action report.', '2026-10-15', 1, 'selected', 'open', 2, NULL, '2026-10-07 11:00:00', '2026-10-07 11:00:00'),
  (5, 'Updated BDRRM Plan Submission', 'file', 'All barangays must submit their updated Barangay Disaster Risk Reduction Management Plan.', '2026-11-15', 1, 'all', 'open', 2, NULL, '2026-10-10 08:00:00', '2026-10-10 08:00:00');

-- Assignments: requirements 1-3 and 5 go to ALL active barangays; requirement 4 goes only to Bangkal (id 1)
INSERT INTO `requirement_assignments` (`id`, `requirement_id`, `barangay_id`, `status`, `received_at`, `submitted_at`, `reviewed_by`, `reviewed_at`, `review_notes`, `created_at`, `updated_at`) VALUES
  -- Requirement 1: Monthly template (mixed statuses for demo)
  ( 1, 1,  1, 'complied',   '2026-10-02 08:00:00', '2026-10-08 09:00:00', 2, '2026-10-09 10:00:00', NULL, '2026-10-01 08:00:00', '2026-10-09 10:00:00'),
  ( 2, 1,  2, 'submitted',  '2026-10-02 10:00:00', '2026-10-07 14:00:00', NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-07 14:00:00'),
  ( 3, 1,  3, 'received',   '2026-10-03 09:00:00', NULL, NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-03 09:00:00'),
  ( 4, 1,  6, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
  ( 5, 1,  8, 'complied',   '2026-10-02 07:00:00', '2026-10-05 11:00:00', 2, '2026-10-06 09:00:00', NULL, '2026-10-01 08:00:00', '2026-10-06 09:00:00'),
  ( 6, 1,  9, 'revision',   '2026-10-02 14:00:00', '2026-10-06 08:00:00', 2, '2026-10-07 10:00:00', 'Missing barangay captain signature on page 3.', '2026-10-01 08:00:00', '2026-10-07 10:00:00'),
  ( 7, 1, 10, 'submitted',  '2026-10-03 08:00:00', '2026-10-09 15:00:00', NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-09 15:00:00'),
  ( 8, 1, 11, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
  ( 9, 1, 12, 'complied',   '2026-10-02 09:00:00', '2026-10-04 10:00:00', 2, '2026-10-05 08:00:00', NULL, '2026-10-01 08:00:00', '2026-10-05 08:00:00'),
  (10, 1, 13, 'received',   '2026-10-04 08:00:00', NULL, NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-04 08:00:00'),
  (11, 1, 14, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
  (12, 1, 15, 'complied',   '2026-10-02 11:00:00', '2026-10-06 09:00:00', 2, '2026-10-07 08:00:00', NULL, '2026-10-01 08:00:00', '2026-10-07 08:00:00'),
  (13, 1, 17, 'submitted',  '2026-10-03 07:00:00', '2026-10-10 10:00:00', NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-10 10:00:00'),
  (14, 1, 18, 'received',   '2026-10-04 10:00:00', NULL, NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-04 10:00:00'),
  (15, 1, 20, 'complied',   '2026-10-02 08:30:00', '2026-10-05 09:00:00', 2, '2026-10-06 14:00:00', NULL, '2026-10-01 08:00:00', '2026-10-06 14:00:00'),
  (16, 1, 23, 'submitted',  '2026-10-03 10:00:00', '2026-10-08 11:00:00', NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-08 11:00:00'),
  (17, 1, 24, 'complied',   '2026-10-02 09:00:00', '2026-10-04 14:00:00', 2, '2026-10-05 10:00:00', NULL, '2026-10-01 08:00:00', '2026-10-05 10:00:00'),
  (18, 1, 25, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
  (19, 1, 26, 'received',   '2026-10-05 09:00:00', NULL, NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-05 09:00:00'),
  (20, 1, 27, 'complied',   '2026-10-02 10:00:00', '2026-10-04 16:00:00', 2, '2026-10-05 11:00:00', NULL, '2026-10-01 08:00:00', '2026-10-05 11:00:00'),
  (21, 1, 28, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
  (22, 1, 30, 'received',   '2026-10-06 08:00:00', NULL, NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-06 08:00:00'),
  (23, 1, 31, 'submitted',  '2026-10-03 14:00:00', '2026-10-09 09:00:00', NULL, NULL, NULL, '2026-10-01 08:00:00', '2026-10-09 09:00:00'),
  (24, 1, 32, 'complied',   '2026-10-02 07:30:00', '2026-10-04 08:00:00', 2, '2026-10-05 09:00:00', NULL, '2026-10-01 08:00:00', '2026-10-05 09:00:00'),

  -- Requirement 2: Budget report (fewer have started)
  (25, 2,  1, 'submitted',  '2026-10-04 08:00:00', '2026-10-10 09:00:00', NULL, NULL, NULL, '2026-10-03 09:00:00', '2026-10-10 09:00:00'),
  (26, 2,  2, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-03 09:00:00', '2026-10-03 09:00:00'),
  (27, 2,  3, 'received',   '2026-10-05 10:00:00', NULL, NULL, NULL, NULL, '2026-10-03 09:00:00', '2026-10-05 10:00:00'),
  (28, 2, 20, 'complied',   '2026-10-04 09:00:00', '2026-10-07 10:00:00', 2, '2026-10-08 08:00:00', NULL, '2026-10-03 09:00:00', '2026-10-08 08:00:00'),
  (29, 2, 23, 'submitted',  '2026-10-05 08:00:00', '2026-10-09 14:00:00', NULL, NULL, NULL, '2026-10-03 09:00:00', '2026-10-09 14:00:00'),
  (30, 2, 24, 'received',   '2026-10-06 08:00:00', NULL, NULL, NULL, NULL, '2026-10-03 09:00:00', '2026-10-06 08:00:00'),

  -- Requirement 3: Memo (acknowledge only - most have received)
  (31, 3,  1, 'received',   '2026-10-06 08:00:00', NULL, NULL, NULL, NULL, '2026-10-05 10:00:00', '2026-10-06 08:00:00'),
  (32, 3,  2, 'received',   '2026-10-06 09:00:00', NULL, NULL, NULL, NULL, '2026-10-05 10:00:00', '2026-10-06 09:00:00'),
  (33, 3,  3, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-05 10:00:00', '2026-10-05 10:00:00'),
  (34, 3, 20, 'received',   '2026-10-05 14:00:00', NULL, NULL, NULL, NULL, '2026-10-05 10:00:00', '2026-10-05 14:00:00'),
  (35, 3, 23, 'received',   '2026-10-06 07:00:00', NULL, NULL, NULL, NULL, '2026-10-05 10:00:00', '2026-10-06 07:00:00'),
  (36, 3, 24, 'received',   '2026-10-06 10:00:00', NULL, NULL, NULL, NULL, '2026-10-05 10:00:00', '2026-10-06 10:00:00'),

  -- Requirement 4: Complaint (selected - only Bangkal)
  (37, 4,  1, 'received',   '2026-10-08 08:00:00', NULL, NULL, NULL, NULL, '2026-10-07 11:00:00', '2026-10-08 08:00:00'),

  -- Requirement 5: BDRRM Plan (new - all pending)
  (38, 5,  1, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-10 08:00:00', '2026-10-10 08:00:00'),
  (39, 5,  2, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-10 08:00:00', '2026-10-10 08:00:00'),
  (40, 5, 20, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-10 08:00:00', '2026-10-10 08:00:00'),
  (41, 5, 23, 'pending',    NULL, NULL, NULL, NULL, NULL, '2026-10-10 08:00:00', '2026-10-10 08:00:00'),
  (42, 5, 24, 'received',   '2026-10-11 08:00:00', NULL, NULL, NULL, NULL, '2026-10-10 08:00:00', '2026-10-11 08:00:00');

-- Requirement activity logs
INSERT INTO `activity_logs` (`user_id`, `action`, `subject_type`, `subject_id`, `meta`, `ip_address`, `created_at`, `updated_at`) VALUES
  (2, 'requirement.sent', 'App\\Models\\Requirement', 1, '{"title":"Monthly Accomplishment Report Template – October 2026","audience":"all"}', '127.0.0.1', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
  (2, 'requirement.sent', 'App\\Models\\Requirement', 2, '{"title":"Barangay Budget Utilisation Q3 2026","audience":"all"}', '127.0.0.1', '2026-10-03 09:00:00', '2026-10-03 09:00:00'),
  (2, 'requirement.sent', 'App\\Models\\Requirement', 3, '{"title":"DILG Memorandum Circular No. 2026-45","audience":"all"}', '127.0.0.1', '2026-10-05 10:00:00', '2026-10-05 10:00:00'),
  (2, 'requirement.sent', 'App\\Models\\Requirement', 4, '{"title":"Noise Complaint – Brgy. Bangkal Night Market","audience":"selected"}', '127.0.0.1', '2026-10-07 11:00:00', '2026-10-07 11:00:00'),
  (2, 'requirement.sent', 'App\\Models\\Requirement', 5, '{"title":"Updated BDRRM Plan Submission","audience":"all"}', '127.0.0.1', '2026-10-10 08:00:00', '2026-10-10 08:00:00');

-- 1) Document categories
CREATE TABLE IF NOT EXISTS `document_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint unsigned NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `group_slug` varchar(60) NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `document_categories_slug_unique` (`slug`),
  CONSTRAINT `fk_doc_cat_parent` FOREIGN KEY (`parent_id`) REFERENCES `document_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Repository documents
CREATE TABLE IF NOT EXISTS `repository_documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `document_category_id` bigint unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `access_level` varchar(20) NOT NULL DEFAULT 'public',
  `barangay_id` bigint unsigned DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `size_bytes` bigint unsigned NOT NULL DEFAULT 0,
  `sha256` varchar(64) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `archived_at` timestamp NULL DEFAULT NULL,
  `uploaded_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `repo_docs_category_status` (`document_category_id`, `status`),
  KEY `repo_docs_barangay_status` (`barangay_id`, `status`),
  KEY `repo_docs_status` (`status`),
  CONSTRAINT `repo_docs_category_fk` FOREIGN KEY (`document_category_id`) REFERENCES `document_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `repo_docs_barangay_fk` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE SET NULL,
  CONSTRAINT `repo_docs_uploader_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- 3) Seed default document categories
INSERT INTO `document_categories` (`name`, `slug`, `group_slug`, `description`, `parent_id`, `sort_order`, `created_at`, `updated_at`) VALUES
  ('Policies & Guidelines', 'policies', NULL, 'Official DILG policies, memorandums, and guidelines', NULL, 1, NOW(), NOW()),
  ('Compliance Records', 'compliance', NULL, 'Compliance certificates, inspection reports, and verification records', NULL, 2, NOW(), NOW()),
  ('Barangay Documents', 'barangay-docs', NULL, 'Official barangay records, resolutions, and certifications', NULL, 3, NOW(), NOW()),
  ('Administrative Records', 'admin-records', NULL, 'Internal administrative documents, meeting minutes, and correspondence', NULL, 4, NOW(), NOW()),
  ('Cybersecurity & IT', 'cybersecurity', NULL, 'Network documentation, security audits, and IT policies', NULL, 5, NOW(), NOW()),
  ('Reports & Analytics', 'reports', NULL, 'Consolidated reports, statistical data, and analytics outputs', NULL, 6, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- PDF Architecture: Repository parent categories
INSERT INTO `document_categories` (`slug`, `name`, `group_slug`, `description`, `parent_id`, `sort_order`, `created_at`, `updated_at`) VALUES
  ('legislative-archives', 'Legislative Archives', 'legislative', 'Mambabatas — Resolutions, Ordinances, SK Resolutions', NULL, 1, NOW(), NOW()),
  ('civil-registry', 'Civil Registry Records', 'civil_registry', 'RBI Masterlist, KK Directory', NULL, 2, NOW(), NOW()),
  ('audit-compliance', 'Audit & Compliance Requirements', 'audit_compliance', 'MOVs / Means of Verification', NULL, 3, NOW(), NOW());

-- PDF Architecture: Repository child categories
SET @leg_id = (SELECT id FROM document_categories WHERE slug = 'legislative-archives');
SET @civ_id = (SELECT id FROM document_categories WHERE slug = 'civil-registry');
SET @aud_id = (SELECT id FROM document_categories WHERE slug = 'audit-compliance');

INSERT INTO `document_categories` (`slug`, `name`, `group_slug`, `description`, `parent_id`, `sort_order`, `created_at`, `updated_at`) VALUES
  ('brgy-resolutions', 'Barangay Resolutions', 'legislative', 'Mga pinagtibay na Barangay Resolutions', @leg_id, 1, NOW(), NOW()),
  ('brgy-ordinances', 'Barangay Ordinances', 'legislative', 'Mga naipasang Barangay Ordinances', @leg_id, 2, NOW(), NOW()),
  ('sk-resolutions', 'SK Resolutions & Ordinances', 'legislative', 'Sub-folder para sa SK Resolutions & Ordinances', @leg_id, 3, NOW(), NOW()),
  ('rbi-masterlist', 'RBI Masterlist', 'civil_registry', 'Registry of Barangay Inhabitants — protektadong talaan', @civ_id, 1, NOW(), NOW()),
  ('kk-directory', 'KK Directory', 'civil_registry', 'Katipunan ng Kabataan Directory — edad 15-30', @civ_id, 2, NOW(), NOW()),
  ('fdp-movs', 'BFDP / SKFDP MOVs', 'audit_compliance', 'Scanned copies ng financial disclosure boards', @aud_id, 1, NOW(), NOW()),
  ('project-docs', 'Project Documentation', 'audit_compliance', 'Project photos, liquidation attachments, attendance sheets', @aud_id, 2, NOW(), NOW()),
  ('sglgb-evidence', 'SGLGB Compliance Evidence', 'audit_compliance', 'Folders ng compliance evidence para sa SGLGB', @aud_id, 3, NOW(), NOW());

-- Feature Expansion: Additional document categories (3Rs aligned)
-- These use INSERT IGNORE so re-running is safe (slug is UNIQUE).
INSERT IGNORE INTO `document_categories` (`name`, `slug`, `group_slug`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
  -- Civil Registry
  ('Birth Certificates', 'birth_certificates', 'civil_registry', 'Barangay-certified birth records', 10, NOW(), NOW()),
  ('Death Certificates', 'death_certificates', 'civil_registry', 'Barangay-certified death records', 11, NOW(), NOW()),
  ('Barangay Clearances', 'barangay_clearances', 'civil_registry', 'Barangay clearance documents', 12, NOW(), NOW()),
  ('Certificates of Indigency', 'certificates_of_indigency', 'civil_registry', 'Certificates of indigency', 13, NOW(), NOW()),
  -- Audit & Compliance
  ('COA Audit Reports', 'coa_audit', 'audit_compliance', 'Commission on Audit reports', 20, NOW(), NOW()),
  ('Financial Statements', 'financial_statements', 'audit_compliance', 'Barangay financial statements', 21, NOW(), NOW()),
  ('Annual Budget', 'annual_budget', 'audit_compliance', 'Approved annual budget documents', 22, NOW(), NOW()),
  -- Katarungang Pambarangay
  ('KP Case Records', 'kp_case_records', 'katarungang_pambarangay', 'Katarungang Pambarangay case files and settlements', 30, NOW(), NOW()),
  ('Mediation Agreements', 'mediation_agreements', 'katarungang_pambarangay', 'Mediation and conciliation agreements', 31, NOW(), NOW()),
  ('Certificates to File Action', 'cfa', 'katarungang_pambarangay', 'Certificates to File Action issued by Lupong Tagapamayapa', 32, NOW(), NOW()),
  -- Peace & Order / Anti-Illegal Drugs
  ('Peace & Order Reports', 'peace_order', 'peace_order', 'Barangay peace and order situational reports', 40, NOW(), NOW()),
  ('Anti-Illegal Drugs Reports', 'anti_drugs', 'peace_order', 'BADAC reports and anti-illegal drugs campaign records', 41, NOW(), NOW()),
  ('Tanod Duty Reports', 'tanod_reports', 'peace_order', 'Barangay tanod deployment and duty reports', 42, NOW(), NOW()),
  -- GAD (Gender and Development)
  ('GAD Plan & Budget', 'gad_plan', 'gad', 'Gender and Development plan and budget', 50, NOW(), NOW()),
  ('GAD Accomplishment Reports', 'gad_accomplishment', 'gad', 'GAD accomplishment and activity reports', 51, NOW(), NOW()),
  -- Vulnerable Sectors
  ('PWD Records', 'pwd_records', 'vulnerable_sectors', 'Persons with Disability registry and services', 60, NOW(), NOW()),
  ('Senior Citizens Records', 'senior_citizens', 'vulnerable_sectors', 'Senior citizen registry and services', 61, NOW(), NOW()),
  ('Solo Parent Records', 'solo_parent', 'vulnerable_sectors', 'Solo parent registry and services', 62, NOW(), NOW()),
  -- SK (Sangguniang Kabataan)
  ('SK Plans & Programs', 'sk_plans', 'sk', 'SK development plans and programs', 70, NOW(), NOW()),
  ('SK Financial Reports', 'sk_financial', 'sk', 'SK financial reports and budget utilization', 71, NOW(), NOW()),
  ('SK Activity Reports', 'sk_activity', 'sk', 'SK activity and accomplishment reports', 72, NOW(), NOW()),
  -- Environment / Solid Waste Management
  ('SWM Plans', 'swm_plans', 'environment', 'Solid Waste Management plans', 80, NOW(), NOW()),
  ('Environmental Reports', 'environmental_reports', 'environment', 'Environmental monitoring and compliance reports', 81, NOW(), NOW()),
  ('Cleanup Drive Reports', 'cleanup_drive', 'environment', 'Weekly/monthly cleanup drive documentation', 82, NOW(), NOW());

-- PDF Architecture: 6 Bagwis PPAs (city-level programs)
INSERT INTO `bagwis_ppas` (`slug`, `name`, `frequency`, `responsible_office`, `description`, `deadline_description`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
  ('subaybayan', 'Subaybayan (Support to LG)', 'Monthly (Tuwing ika-25)', 'City Portal Focal / Engineering / Planning', 'Monitoring portal para sa mga proyektong pang-imprastraktura ng lungsod.', 'Every 25th of the month', 1, 1, NOW(), NOW()),
  ('fdp', 'FDP (Full Disclosure Policy - City)', 'Quarterly (Tuwing ika-10)', 'UDD (Urban Development Dept / Accounting)', 'Pagpaskil ng mga opisyal na ulat-pananalapi ng Pamahalaang Lungsod.', 'Every 10th after quarter end', 1, 2, NOW(), NOW()),
  ('cflga', 'CFLGA (Child-Friendly Audit)', 'Annual', 'MSWD / CHO', 'Pagtatasa sa antas ng lungsod kaugnay ng child-friendly local governance.', 'Annual assessment period', 1, 3, NOW(), NOW()),
  ('sglgif', 'SGLGIF (SGLG Incentive Fund)', 'Implementation Phase', 'City Planning / Engineering', 'Pagsubaybay sa implementasyon ng mga proyektong pinondohan ng SGLG Incentive Fund.', 'Per project milestone', 1, 4, NOW(), NOW()),
  ('sglg', 'SGLG (City Level Assessment)', 'Annual', 'DILG Makati Field Office', 'Pangkalahatang estado ng Lungsod ng Makati sa SGLG.', 'Annual DILG assessment', 1, 5, NOW(), NOW()),
  ('weekly-cleanup', 'Weekly Cleanup (City Consolidation)', 'Weekly', 'DES (Dept. of Environmental Services)', 'Konsolidasyon ng kalinisan at solid waste status sa buong lungsod.', 'Every Monday', 1, 6, NOW(), NOW());

-- 4) Register migrations so php artisan migrate skips them
INSERT IGNORE INTO `migrations` (`migration`, `batch`) VALUES
  ('2026_10_14_000001_create_repository_documents_table', 3),
  ('2024_01_15_000001_pdf_architecture_update', 4),
  ('2026_10_20_000001_create_form_templates_table', 5),
  ('2026_10_20_000002_create_form_submissions_table', 5),
  ('2026_10_20_000003_feature_expansion_document_categories', 5);

SELECT 'Repository tables created and seeded successfully.' AS result;
