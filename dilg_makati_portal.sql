-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping data for table dilg_makati_portal.activity_logs: ~31 rows (approximately)
INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `subject_type`, `subject_id`, `meta`, `ip_address`, `created_at`, `updated_at`) VALUES
	(1, 1, 'user.login', NULL, NULL, '[]', '127.0.0.1', '2026-10-04 17:10:00', '2026-10-04 17:10:00'),
	(2, 3, 'user.login', NULL, NULL, '[]', '127.0.0.1', '2026-10-05 16:30:00', '2026-10-05 16:30:00'),
	(3, 3, 'barangay.announcement.created', NULL, NULL, '{"title": "Barangay Assembly this month", "barangay_id": 1}', '127.0.0.1', '2026-10-06 18:00:00', '2026-10-06 18:00:00'),
	(4, 3, 'barangay.program.created', NULL, NULL, '{"kind": "event", "title": "Medical and Dental Mission", "barangay_id": 1}', '127.0.0.1', '2026-10-06 18:15:00', '2026-10-06 18:15:00'),
	(5, 2, 'user.login', NULL, NULL, '[]', '127.0.0.1', '2026-10-07 17:00:00', '2026-10-07 17:00:00'),
	(6, 2, 'submission.reviewed', NULL, NULL, '{"status": "compliant"}', '127.0.0.1', '2026-10-07 17:30:00', '2026-10-07 17:30:00'),
	(7, 4, 'user.login', NULL, NULL, '[]', '127.0.0.1', '2026-10-07 19:00:00', '2026-10-07 19:00:00'),
	(8, 4, 'barangay.announcement.created', NULL, NULL, '{"title": "Night market schedule", "barangay_id": 20}', '127.0.0.1', '2026-10-07 19:20:00', '2026-10-07 19:20:00'),
	(9, 1, 'resource.uploaded', NULL, NULL, '{"version": 1}', '127.0.0.1', '2026-10-08 18:00:00', '2026-10-08 18:00:00'),
	(10, 7, 'user.login', NULL, NULL, '[]', '127.0.0.1', '2026-10-08 20:00:00', '2026-10-08 20:00:00'),
	(11, 7, 'barangay.program.created', NULL, NULL, '{"kind": "program", "title": "Skills Training Center", "barangay_id": 24}', '127.0.0.1', '2026-10-08 20:10:00', '2026-10-08 20:10:00'),
	(12, 2, 'requirement.sent', 'App\\Models\\Requirement', 1, '{"title": "Monthly Accomplishment Report Template – October 2026", "audience": "all"}', '127.0.0.1', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
	(13, 2, 'requirement.sent', 'App\\Models\\Requirement', 2, '{"title": "Barangay Budget Utilisation Q3 2026", "audience": "all"}', '127.0.0.1', '2026-10-03 01:00:00', '2026-10-03 01:00:00'),
	(14, 2, 'requirement.sent', 'App\\Models\\Requirement', 3, '{"title": "DILG Memorandum Circular No. 2026-45", "audience": "all"}', '127.0.0.1', '2026-10-05 02:00:00', '2026-10-05 02:00:00'),
	(15, 2, 'requirement.sent', 'App\\Models\\Requirement', 4, '{"title": "Noise Complaint – Brgy. Bangkal Night Market", "audience": "selected"}', '127.0.0.1', '2026-10-07 03:00:00', '2026-10-07 03:00:00'),
	(16, 2, 'requirement.sent', 'App\\Models\\Requirement', 5, '{"title": "Updated BDRRM Plan Submission", "audience": "all"}', '127.0.0.1', '2026-10-10 00:00:00', '2026-10-10 00:00:00'),
	(17, 9, 'user.login', 'App\\Models\\User', 9, '[]', '::1', '2026-10-27 04:34:26', NULL),
	(18, 9, 'user.login', 'App\\Models\\User', 9, '[]', '::1', '2026-10-27 04:52:12', NULL),
	(19, 9, 'security.password_changed', 'App\\Models\\User', 9, '{"email": "orangeezz50805@gmail.com", "forced": true}', '::1', '2026-10-27 04:54:04', NULL),
	(20, 9, 'user.logout', 'App\\Models\\User', 9, '[]', '::1', '2026-10-27 04:59:17', NULL),
	(21, 1, 'user.login', 'App\\Models\\User', 1, '[]', '::1', '2026-10-27 05:02:18', NULL),
	(22, 1, 'user.logout', 'App\\Models\\User', 1, '[]', '::1', '2026-10-27 05:02:34', NULL),
	(23, 9, 'user.login', 'App\\Models\\User', 9, '[]', '::1', '2026-10-27 05:02:59', NULL),
	(24, 9, 'user.logout', 'App\\Models\\User', 9, '[]', '::1', '2026-10-27 05:07:31', NULL),
	(25, 9, 'user.login', 'App\\Models\\User', 9, '[]', '::1', '2026-10-27 05:07:38', NULL),
	(26, 9, 'form_template.created', 'App\\Models\\FormTemplate', 1, '{"title": "Memio"}', '::1', '2026-10-27 05:16:42', NULL),
	(27, 9, 'user.logout', 'App\\Models\\User', 9, '[]', '::1', '2026-10-27 05:18:07', NULL),
	(28, 3, 'user.login', 'App\\Models\\User', 3, '[]', '::1', '2026-10-27 05:18:11', NULL),
	(29, 3, 'security.password_changed', 'App\\Models\\User', 3, '{"email": "rep.bangkal@barangay.test", "forced": true}', '::1', '2026-10-27 05:18:43', NULL),
	(30, 3, 'user.logout', 'App\\Models\\User', 3, '[]', '::1', '2026-10-27 05:21:19', NULL),
	(31, 1, 'user.login', 'App\\Models\\User', 1, '[]', '::1', '2026-10-27 05:21:31', NULL),
	(32, 1, 'user.logout', 'App\\Models\\User', 1, '[]', '::1', '2026-10-27 05:28:25', NULL),
	(33, 9, 'user.login', 'App\\Models\\User', 9, '[]', '::1', '2026-10-27 05:28:30', NULL),
	(34, 9, 'form_template.deleted', 'App\\Models\\FormTemplate', 1, '{"title": "Memio"}', '::1', '2026-10-27 06:05:42', NULL),
	(35, 9, 'user.logout', 'App\\Models\\User', 9, '[]', '::1', '2026-10-27 06:09:26', NULL),
	(36, 9, 'user.login', 'App\\Models\\User', 9, '[]', '::1', '2026-10-29 04:40:44', NULL),
	(37, 9, 'form_template.created', 'App\\Models\\FormTemplate', 2, '{"title": "Barangay Monthly Accomplishment & Verification Report"}', '::1', '2026-10-29 04:41:26', NULL),
	(38, 9, 'requirement.sent', 'App\\Models\\Requirement', 6, '{"kind": "report", "audience": "selected", "barangays": 1, "form_template_id": 2}', '::1', '2026-10-29 04:41:42', NULL),
	(39, 9, 'user.logout', 'App\\Models\\User', 9, '[]', '::1', '2026-10-29 04:41:44', NULL),
	(40, 9, 'user.login', 'App\\Models\\User', 9, '[]', '::1', '2026-10-29 04:43:10', NULL),
	(41, 9, 'user.logout', 'App\\Models\\User', 9, '[]', '::1', '2026-10-29 04:43:45', NULL),
	(42, 9, 'user.login', 'App\\Models\\User', 9, '[]', '::1', '2026-10-29 04:43:53', NULL),
	(43, 9, 'requirement.sent', 'App\\Models\\Requirement', 7, '{"kind": "report", "audience": "selected", "barangays": 1, "form_template_id": 2}', '::1', '2026-10-29 04:44:13', NULL),
	(44, 9, 'user.logout', 'App\\Models\\User', 9, '[]', '::1', '2026-10-29 04:44:26', NULL),
	(45, 3, 'user.login', 'App\\Models\\User', 3, '[]', '::1', '2026-10-29 04:44:41', NULL),
	(46, 3, 'user.logout', 'App\\Models\\User', 3, '[]', '::1', '2026-10-29 05:05:19', NULL),
	(47, 9, 'user.login', 'App\\Models\\User', 9, '[]', '::1', '2026-10-29 05:05:22', NULL),
	(48, 9, 'form_template.deleted', 'App\\Models\\FormTemplate', 2, '{"title": "Barangay Monthly Accomplishment & Verification Report"}', '::1', '2026-10-29 05:12:17', NULL),
	(49, 9, 'form_template.created', 'App\\Models\\FormTemplate', 3, '{"title": "Barangay Monthly Accomplishment & Verification Report"}', '::1', '2026-10-29 05:20:51', NULL),
	(50, 9, 'form_template.deleted', 'App\\Models\\FormTemplate', 3, '{"title": "Barangay Monthly Accomplishment & Verification Report"}', '::1', '2026-10-29 05:21:02', NULL),
	(51, 9, 'user.logout', 'App\\Models\\User', 9, '[]', '::1', '2026-10-29 05:28:46', NULL),
	(52, 1, 'user.login', 'App\\Models\\User', 1, '[]', '::1', '2026-10-29 05:28:56', NULL);

-- Dumping data for table dilg_makati_portal.bagwis_ppas: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.bagwis_ppa_entries: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.barangays: ~23 rows (approximately)
INSERT INTO `barangays` (`id`, `name`, `code`, `about`, `hall_address`, `hotline`, `office_hours`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'Bangkal', 'BGY-001', 'A residential and commercial barangay in the heart of Makati. The barangay hall serves residents with certificates, clearances and community programs.', 'Barangay Hall, Bangkal, Makati City', NULL, 'Monday to Friday, 8:00 AM to 5:00 PM', 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(2, 'Bel-Air', 'BGY-002', 'A residential barangay known for its tree-lined streets. The barangay focuses on safety, cleanliness and neighbourhood programs.', 'Barangay Hall, Bel-Air, Makati City', NULL, 'Monday to Friday, 8:00 AM to 5:00 PM', 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(3, 'Carmona', 'BGY-003', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(6, 'Dasmariñas', 'BGY-006', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(8, 'Forbes Park', 'BGY-008', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(9, 'Guadalupe Nuevo', 'BGY-009', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(10, 'Guadalupe Viejo', 'BGY-010', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(11, 'Kasilawan', 'BGY-011', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(12, 'La Paz', 'BGY-012', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(13, 'Magallanes', 'BGY-013', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(14, 'Olympia', 'BGY-014', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(15, 'Palanan', 'BGY-015', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(17, 'Pinagkaisahan', 'BGY-017', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(18, 'Pio del Pilar', 'BGY-018', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(20, 'Poblacion', 'BGY-020', 'A busy mixed-use barangay with shops, restaurants and homes. The barangay supports small businesses and keeps the community safe.', 'Barangay Hall, Poblacion, Makati City', NULL, 'Monday to Friday, 8:00 AM to 5:00 PM', 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(24, 'San Antonio', 'BGY-024', 'A residential barangay offering skills training and disaster preparedness for its families.', 'Barangay Hall, San Antonio, Makati City', NULL, 'Monday to Friday, 8:00 AM to 5:00 PM', 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(25, 'San Isidro', 'BGY-025', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(26, 'San Lorenzo', 'BGY-026', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(27, 'Santa Cruz', 'BGY-027', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(28, 'Singkamas', 'BGY-028', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(30, 'Tejeros', 'BGY-030', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(31, 'Urdaneta', 'BGY-031', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00'),
	(32, 'Valenzuela', 'BGY-032', NULL, NULL, NULL, NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00');

-- Dumping data for table dilg_makati_portal.barangay_announcements: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.barangay_programs: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.cache: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.cache_locks: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.document_categories: ~41 rows (approximately)
INSERT INTO `document_categories` (`id`, `parent_id`, `name`, `slug`, `group_slug`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
	(1, NULL, 'Policies & Guidelines', 'policies', NULL, 'Official DILG policies, memorandums, and guidelines', 1, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(2, NULL, 'Compliance Records', 'compliance', NULL, 'Compliance certificates, inspection reports, and verification records', 2, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(3, NULL, 'Barangay Documents', 'barangay-docs', NULL, 'Official barangay records, resolutions, and certifications', 3, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(4, NULL, 'Administrative Records', 'admin-records', NULL, 'Internal administrative documents, meeting minutes, and correspondence', 4, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(5, NULL, 'Cybersecurity & IT', 'cybersecurity', NULL, 'Network documentation, security audits, and IT policies', 5, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(6, NULL, 'Reports & Analytics', 'reports', NULL, 'Consolidated reports, statistical data, and analytics outputs', 6, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(7, NULL, 'Legislative Archives', 'legislative-archives', 'legislative', 'Mambabatas — Resolutions, Ordinances, SK Resolutions', 1, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(8, NULL, 'Civil Registry Records', 'civil-registry', 'civil_registry', 'RBI Masterlist, KK Directory', 2, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(9, NULL, 'Audit & Compliance Requirements', 'audit-compliance', 'audit_compliance', 'MOVs / Means of Verification', 3, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(10, 7, 'Barangay Resolutions', 'brgy-resolutions', 'legislative', 'Mga pinagtibay na Barangay Resolutions', 1, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(11, 7, 'Barangay Ordinances', 'brgy-ordinances', 'legislative', 'Mga naipasang Barangay Ordinances', 2, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(12, 7, 'SK Resolutions & Ordinances', 'sk-resolutions', 'legislative', 'Sub-folder para sa SK Resolutions & Ordinances', 3, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(13, 8, 'RBI Masterlist', 'rbi-masterlist', 'civil_registry', 'Registry of Barangay Inhabitants — protektadong talaan', 1, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(14, 8, 'KK Directory', 'kk-directory', 'civil_registry', 'Katipunan ng Kabataan Directory — edad 15-30', 2, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(15, 9, 'BFDP / SKFDP MOVs', 'fdp-movs', 'audit_compliance', 'Scanned copies ng financial disclosure boards', 1, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(16, 9, 'Project Documentation', 'project-docs', 'audit_compliance', 'Project photos, liquidation attachments, attendance sheets', 2, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(17, 9, 'SGLGB Compliance Evidence', 'sglgb-evidence', 'audit_compliance', 'Folders ng compliance evidence para sa SGLGB', 3, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(18, NULL, 'Birth Certificates', 'birth_certificates', 'civil_registry', 'Barangay-certified birth records', 10, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(19, NULL, 'Death Certificates', 'death_certificates', 'civil_registry', 'Barangay-certified death records', 11, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(20, NULL, 'Barangay Clearances', 'barangay_clearances', 'civil_registry', 'Barangay clearance documents', 12, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(21, NULL, 'Certificates of Indigency', 'certificates_of_indigency', 'civil_registry', 'Certificates of indigency', 13, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(22, NULL, 'COA Audit Reports', 'coa_audit', 'audit_compliance', 'Commission on Audit reports', 20, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(23, NULL, 'Financial Statements', 'financial_statements', 'audit_compliance', 'Barangay financial statements', 21, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(24, NULL, 'Annual Budget', 'annual_budget', 'audit_compliance', 'Approved annual budget documents', 22, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(25, NULL, 'KP Case Records', 'kp_case_records', 'katarungang_pambarangay', 'Katarungang Pambarangay case files and settlements', 30, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(26, NULL, 'Mediation Agreements', 'mediation_agreements', 'katarungang_pambarangay', 'Mediation and conciliation agreements', 31, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(27, NULL, 'Certificates to File Action', 'cfa', 'katarungang_pambarangay', 'Certificates to File Action issued by Lupong Tagapamayapa', 32, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(28, NULL, 'Peace & Order Reports', 'peace_order', 'peace_order', 'Barangay peace and order situational reports', 40, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(29, NULL, 'Anti-Illegal Drugs Reports', 'anti_drugs', 'peace_order', 'BADAC reports and anti-illegal drugs campaign records', 41, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(30, NULL, 'Tanod Duty Reports', 'tanod_reports', 'peace_order', 'Barangay tanod deployment and duty reports', 42, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(31, NULL, 'GAD Plan & Budget', 'gad_plan', 'gad', 'Gender and Development plan and budget', 50, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(32, NULL, 'GAD Accomplishment Reports', 'gad_accomplishment', 'gad', 'GAD accomplishment and activity reports', 51, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(33, NULL, 'PWD Records', 'pwd_records', 'vulnerable_sectors', 'Persons with Disability registry and services', 60, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(34, NULL, 'Senior Citizens Records', 'senior_citizens', 'vulnerable_sectors', 'Senior citizen registry and services', 61, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(35, NULL, 'Solo Parent Records', 'solo_parent', 'vulnerable_sectors', 'Solo parent registry and services', 62, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(36, NULL, 'SK Plans & Programs', 'sk_plans', 'sk', 'SK development plans and programs', 70, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(37, NULL, 'SK Financial Reports', 'sk_financial', 'sk', 'SK financial reports and budget utilization', 71, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(38, NULL, 'SK Activity Reports', 'sk_activity', 'sk', 'SK activity and accomplishment reports', 72, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(39, NULL, 'SWM Plans', 'swm_plans', 'environment', 'Solid Waste Management plans', 80, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(40, NULL, 'Environmental Reports', 'environmental_reports', 'environment', 'Environmental monitoring and compliance reports', 81, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(41, NULL, 'Cleanup Drive Reports', 'cleanup_drive', 'environment', 'Weekly/monthly cleanup drive documentation', 82, '2026-10-27 12:31:55', '2026-10-27 12:31:55'),
	(42, NULL, 'Barangay Resolutions', 'barangay_resolutions', 'legislative', 'Official barangay resolutions passed by the Sangguniang Barangay', 1, NULL, NULL),
	(43, NULL, 'Barangay Ordinances', 'barangay_ordinances', 'legislative', 'Local ordinances enacted by the barangay', 2, NULL, NULL),
	(44, NULL, 'SK Resolutions', 'sk_resolutions', 'legislative', 'Resolutions passed by the Sangguniang Kabataan', 3, NULL, NULL);

-- Dumping data for table dilg_makati_portal.form_submissions: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.form_templates: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.migrations: ~25 rows (approximately)
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
	(16, '2026_10_13_000001_create_requirements_tables', 1),
	(17, '2026_10_14_000001_create_repository_documents_table', 3),
	(18, '2024_01_15_000001_pdf_architecture_update', 4),
	(19, '2026_10_20_000001_create_form_templates_table', 5),
	(20, '2026_10_20_000002_create_form_submissions_table', 5),
	(21, '2026_10_20_000003_feature_expansion_document_categories', 5),
	(22, '2026_10_14_104042_add_field_to_reports_table', 6),
	(23, '2026_10_18_000001_create_notifications_table', 6),
	(24, '2026_10_20_000002_remove_barangay_rizal', 6),
	(25, '2026_10_22_000001_add_verification_flow_to_users_table', 6),
	(26, '2026_10_22_100001_add_security_features_to_users', 6),
	(27, '2026_10_27_100001_seed_borms_report_categories', 7),
	(28, '2026_10_27_100002_add_form_template_id_to_requirements_table', 8);

-- Dumping data for table dilg_makati_portal.notifications: ~9 rows (approximately)
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `body`, `action_url`, `actor_id`, `read_at`, `created_at`) VALUES
	(17, 2, 'requirement.responded', 'Barangay Bangkal responded', 'Response submitted for "Memo para sayo"', '/borms/requirements', NULL, NULL, '2026-10-20 06:45:35'),
	(24, 2, 'requirement.responded', 'Barangay Bangkal responded', 'Response submitted for "submit ordinance"', '/borms/requirements', NULL, NULL, '2026-10-20 06:53:35'),
	(28, 2, 'requirement.responded', 'Barangay Bangkal responded', 'Response submitted for "submit ordinance"', '/borms/requirements', NULL, NULL, '2026-10-20 06:55:42'),
	(32, 2, 'account.created', 'New account created: Aj Goze', 'A Barangay Representative account was created for reynaldomaramag5@gmail.com.', '/talaghayan/users', 1, NULL, '2026-10-22 05:27:31'),
	(35, 2, 'account.pending_verification', 'Account awaiting verification: Aj Goze', 'Aj Goze (Barangay Representative) has completed activation and is waiting for account verification.', '/talaghayan/users', NULL, NULL, '2026-10-22 05:29:59'),
	(38, 2, 'account.created', 'New account created: Aj Goze', 'A Barangay Representative account was created for reynaldomaramag5@gmail.com.', '/talaghayan/users', 1, NULL, '2026-10-22 06:00:46'),
	(40, 1, 'account.pending_verification', 'Account awaiting verification: Aj Goze', 'Aj Goze (Barangay Representative) has completed activation and is waiting for account verification.', '/talaghayan/users', NULL, '2026-10-22 06:08:56', '2026-10-22 06:08:34'),
	(41, 2, 'account.pending_verification', 'Account awaiting verification: Aj Goze', 'Aj Goze (Barangay Representative) has completed activation and is waiting for account verification.', '/talaghayan/users', NULL, NULL, '2026-10-22 06:08:38'),
	(43, 12, 'account.verified', 'Your account has been verified!', 'Your Talaghayan account has been verified by a DILG administrator. You now have full access to the system.', '/', 1, '2026-10-22 06:13:37', '2026-10-22 06:12:00'),
	(44, 3, 'requirement.new', 'New Report from DILG', '"Barangay Monthly Accomplishment & Verification Report"', '/borms/requirements', 9, '2026-10-29 04:44:50', '2026-10-29 04:44:13');

-- Dumping data for table dilg_makati_portal.password_histories: ~0 rows (approximately)
INSERT INTO `password_histories` (`id`, `user_id`, `password`, `created_at`) VALUES
	(1, 9, '$2y$12$p/itb1ADoHvMDaImEs9lSOw9d7mb8FSGsDFrgj.fggfHQN6.avEES', '2026-10-27 04:35:30'),
	(2, 9, '$2y$12$p/itb1ADoHvMDaImEs9lSOw9d7mb8FSGsDFrgj.fggfHQN6.avEES', '2026-10-27 04:54:03'),
	(3, 3, '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', '2026-10-27 05:18:42');

-- Dumping data for table dilg_makati_portal.report_categories: ~19 rows (approximately)
INSERT INTO `report_categories` (`id`, `name`, `slug`, `cycle`, `description`, `sector`, `scope`, `deadline_description`, `barangay_action`, `supervisor_action`, `sort_order`, `created_at`, `updated_at`) VALUES
	(1, 'Monthly Accomplishment Report', 'monthly-accomplishment', 'monthly', 'Summary of barangay programs, projects and activities accomplished during the month.', 'barangay', NULL, 'Tuwing ika-5 ng sumunod na buwan', 'Submit monthly accomplishment report', 'Review & Endorse', 1, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(2, 'Weekly Peace and Order Situation Report', 'weekly-peace-order', 'weekly', 'Weekly peace and order, blotter and incident summary.', 'peace_order', NULL, 'Tuwing Lunes', 'Submit blotter & patrol summary', 'Review & Consolidate', 2, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(3, 'Quarterly Barangay Financial Report', 'quarterly-financial', 'quarterly', 'Statement of income and expenditures for the quarter.', 'audit_compliance', NULL, 'Ika-10 ng Apr, Jul, Oct, Jan', 'Submit financial statement & receipts', 'Audit & Validate', 3, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(4, 'Semestral Barangay Development Plan Update', 'semestral-bdp', 'semestral', 'Progress update on the Barangay Development Plan.', 'barangay', NULL, 'Kada Semestre (Hunyo & Disyembre)', 'Submit BDP progress update', 'Review & Monitor', 4, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(5, 'Annual Barangay Profile', 'annual-profile', 'annual', 'Yearly update of the barangay profile and demographic data.', 'civil_registry', NULL, 'Katapusan ng Taon (Disyembre)', 'Submit updated demographic profile', 'Validate & Archive', 5, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(6, 'Clean-Up (BARKADA Report)', 'cleanup-barkada', 'weekly', 'Barangay Kalinisan Day — lingguhang paglilinis at clean-up drive sa bawat barangay.', 'barangay', NULL, 'Tuwing Lunes', 'Submit photo docs & attendance', 'Review / Validate', 6, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(7, 'BaRCO (Road Clearing)', 'barco', 'monthly', 'Barangay Road Clearing Operations — buwanang pag-uulat ng paglilinis ng mga kalsada at bangketa.', 'barangay', NULL, 'Tuwing ika-20 ng buwan', 'Submit road clearing form', 'Review / Validate', 7, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(8, 'ECA (Compliance Assessment)', 'eca', 'monthly', 'Enhanced Compliance Assessment — pagsusuri sa pagsunod ng lokal na pamahalaan sa environmental laws at ecological sanitation.', 'barangay', NULL, 'Regular Monthly', 'Submit compliance checklist', 'Review / Validate', 8, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(9, 'VAW Desk Report', 'vaw-desk', 'quarterly', 'Violence Against Women — ulat ng mga kaso at aksyon mula sa Barangay VAW Desk.', 'gad', NULL, 'Ika-5 ng Apr, Jul, Oct, Dec', 'Submit quarterly cases log', 'Review / Validate', 9, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(10, 'VAC Report (Child Protection)', 'vac-report', 'quarterly', 'Violence Against Children — ulat ng mga kasong naaksyunan para sa proteksyon ng kabataan.', 'vulnerable_sectors', NULL, 'Ika-5 ng Apr, Jul, Oct, Dec', 'Submit quarterly cases log', 'Review / Validate', 10, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(11, 'KP Report (Katarungang Pambarangay)', 'kp-report', 'quarterly', 'Katarungang Pambarangay — submit Lupon cases summary.', 'katarungang_pambarangay', NULL, 'Ika-5 ng Apr, Jul, Oct, Dec', 'Submit Lupon cases summary', 'Review / Validate', 11, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(12, 'BFDP (Brgy Full Disclosure Policy)', 'bfdp', 'quarterly', 'Barangay Full Disclosure Policy — upload photos of 3 transparency boards & financial docs.', 'audit_compliance', NULL, 'Ika-10 ng Apr, Jul, Oct, Dec', 'Upload photos of 3 boards & financial docs', 'Review / Audit Compliance', 12, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(13, 'SKFDP (SK Full Disclosure Policy)', 'skfdp', 'quarterly', 'Sangguniang Kabataan Full Disclosure Policy — upload SK financial postings & budget.', 'sk', NULL, 'Ika-10 ng Apr, Jul, Oct, Dec', 'Upload SK financial postings & budget', 'Review / Audit Compliance', 13, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(14, 'Barangay Assembly (BA / SOBA)', 'ba-soba', 'semestral', 'State of the Barangay Address / Barangay Assembly — upload post-assembly docs & minutes.', 'barangay', NULL, 'Pagkatapos ng Assembly (Mar & Oct)', 'Upload post-assembly docs & minutes', 'Review / Validate', 14, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(15, 'RBI (Registry of Inhabitants)', 'rbi', 'semestral', 'Registry of Barangay Inhabitants — upload updated population summary.', 'civil_registry', NULL, 'Kada Semestre', 'Upload updated population summary', 'Review / Validate', 15, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(16, 'KK Assembly (Katipunan ng Kabataan)', 'kk-assembly', 'semestral', 'Katipunan ng Kabataan Assembly — upload youth assembly documentation.', 'sk', NULL, 'Kada Semestre', 'Upload youth assembly documentation', 'Review / Validate', 16, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(17, 'SKMT / SK Concerns', 'skmt-sk-concerns', 'annual', 'Sangguniang Kabataan Mandatory Training — upload SK training completion documents.', 'sk', NULL, 'Depende sa Training/Election Cycle', 'Upload SK training completion', 'Review / Validate', 17, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(18, 'Barangay Accomplishment Report', 'accomplishment-report', 'annual', 'Annual accomplishment report ng barangay.', 'barangay', NULL, 'Katapusan ng Taon', 'Submit annual accomplishment report', 'Review / Final Sign-off', 18, '2026-10-27 05:26:23', '2026-10-27 05:26:23'),
	(19, 'SGLGB Self-Audit Assessment', 'sglgb-self-audit', 'annual', 'Seal of Good Local Governance for Barangay — fill-out self-assessment & attach MOVs.', 'barangay', NULL, 'DILG Audit Period', 'Fill-out self-assessment & attach MOVs', 'Validate & On-site Audit', 19, '2026-10-27 05:26:23', '2026-10-27 05:26:23');

-- Dumping data for table dilg_makati_portal.repository_documents: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.requirements: ~5 rows (approximately)
INSERT INTO `requirements` (`id`, `title`, `kind`, `form_template_id`, `description`, `due_date`, `requires_response`, `audience`, `status`, `created_by`, `closed_at`, `created_at`, `updated_at`) VALUES
	(1, 'Monthly Accomplishment Report Template – October 2026', 'file', NULL, 'Please download the updated template and submit your filled-out report before the deadline.', '2026-10-31', 1, 'all', 'open', 2, NULL, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
	(2, 'Barangay Budget Utilisation Q3 2026', 'report', NULL, 'Submit your Q3 budget utilisation report with supporting receipts.', '2026-10-20', 1, 'all', 'open', 2, NULL, '2026-10-03 01:00:00', '2026-10-03 01:00:00'),
	(3, 'DILG Memorandum Circular No. 2026-45', 'memo', NULL, 'For acknowledgement only. Please confirm receipt.', NULL, 0, 'all', 'open', 2, NULL, '2026-10-05 02:00:00', '2026-10-05 02:00:00'),
	(4, 'Noise Complaint – Brgy. Bangkal Night Market', 'complaint', NULL, 'Several residents have filed noise complaints regarding the weekend night market. Please submit your action report.', '2026-10-15', 1, 'selected', 'open', 2, NULL, '2026-10-07 03:00:00', '2026-10-07 03:00:00'),
	(5, 'Updated BDRRM Plan Submission', 'file', NULL, 'All barangays must submit their updated Barangay Disaster Risk Reduction Management Plan.', '2026-11-15', 1, 'all', 'open', 2, NULL, '2026-10-10 00:00:00', '2026-10-10 00:00:00'),
	(6, 'Barangay Monthly Accomplishment & Verification Report', 'report', NULL, 'Official monthly progress and accomplishment report of programs, projects, and activities implemented by the Barangay Council.', NULL, 1, 'selected', 'open', 9, NULL, '2026-10-29 04:41:42', '2026-10-29 04:41:42'),
	(7, 'Barangay Monthly Accomplishment & Verification Report', 'report', NULL, 'Official monthly progress and accomplishment report of programs, projects, and activities implemented by the Barangay Council.', NULL, 1, 'selected', 'open', 9, NULL, '2026-10-29 04:44:13', '2026-10-29 04:44:13');

-- Dumping data for table dilg_makati_portal.requirement_assignments: ~0 rows (approximately)
INSERT INTO `requirement_assignments` (`id`, `requirement_id`, `barangay_id`, `status`, `received_at`, `submitted_at`, `reviewed_by`, `reviewed_at`, `review_notes`, `created_at`, `updated_at`) VALUES
	(17, 6, 9, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-10-29 04:41:42', '2026-10-29 04:41:42'),
	(18, 7, 1, 'pending', NULL, NULL, NULL, NULL, NULL, '2026-10-29 04:44:13', '2026-10-29 04:44:13');

-- Dumping data for table dilg_makati_portal.requirement_files: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.requirement_responses: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.resources: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.security_incidents: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.sessions: ~20 rows (approximately)
INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
	('6BEXV7d91KSPmNl1ZEtSOVjOFuv1J7faZCdfD8LR', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJpWW9SNDRpZ0hXVkhSZFBzdk9SU0hIQ25WR2sza3Z3QkprTHJVWnZ6IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793277866),
	('7vqq12AFjFtcNhFgQctapN0HyRb60izdxZJsOgu3', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJaYkJRTzQ1U2xUR2liM29EN1U0OVZBWVRyUzU5bmNJWU9NejNWalg3IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3B1YmxpY1wvYW5hbHl0aWNzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793280882),
	('8l4hvY1ga6JZIc3bcBal0sYyZr6JUJJs5wuOmDxA', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJyT1RhaVVxZFFPam9LeU9QeFlpdkk2VGswSUVqVzl3dTNSUk90NHlLIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119LCJfcHJldmlvdXMiOnsidXJsIjoiaHR0cDpcL1wvbG9jYWxob3N0OjgwMDBcL2FwaVwvbm90aWZpY2F0aW9uc1wvdW5yZWFkLWNvdW50Iiwicm91dGUiOm51bGx9LCJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI6MSwicGFzc3dvcmRfaGFzaF93ZWIiOiJhZDlkNTU4NzNiNjRiNjM0ZmFkZjY2Mjg2NTI5YTY4MDBjZWZhNGYyYmI5MTllZmJhMDI2ODZiNWE0ODU2NTlkIn0=', 1793281561),
	('adLn1gvKmV780MMCl2a2R831MFwLJuZNhXW1hL96', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJSc0lCUTQwV0VFU0ZDTm5BdUs2eGtpTmRrZUxYMWgwZEd1VEowVUQ1IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793277704),
	('cGNHinKLXTtc0TETOvJavwEvHoFIcPY1VzJxmpmT', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJuRDBzNjBFY2x1d0NaZzNnUkdMcTQyN2tSNkk4bnduS1M3WHkwYkF1IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL21lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793277587),
	('cgWezXQf2RDbzc7hOJHngPohbYOsXl3MRKIOSTDV', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJCQmp5RW9KRHl6NFNHcDFLcDdrcnA5YVo4V2Y1MHE5aUEyekZUYjN3IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793274131),
	('GAH3hvZi4vyWaurinktaQ0wZNqts6pZKFvfEHdQZ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJRNkg0aTFDWDJKTmNCVVhWTG5NdDUwMTdGd2gyc0JWd0F5UjNjM1dIIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL21lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793280526),
	('OjHJoTNrvE9wyiDB8YS1BfyBPtMviblxUbU0AxYs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJWQk5FYWppeGYzelM3THlEdzAxYjE5UVF0V1l6MW9QV09NdnRBYW5IIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793279119),
	('Q7HDd00KO0SruiNcEAswWQzyi4TdZFGskJVoFxzK', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJ2Q2tqWHZoQXJSMDNaVkdTWldQZlBmQ2xSdHV0azZ4MEg1M2U3cXdTIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3B1YmxpY1wvYmFyYW5nYXlzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793277587),
	('qbw58HdHcctyfyADhwB1nt3lON5g7xUXkhBwpZlb', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJnV3JVZVBFcHV3NzA2N2NIbEpWTklxejMyRWVjcUQyU3FLNTQzY2pRIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1793277825),
	('qcwMhQF4iABHddY0a3hJYad2GsnCs0gaSjLKLp76', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJaa29wUnpzUXEySWlyQlM1c2JZSjd0d2lNcU1lalpWaFNlZ21WVk90IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793274136),
	('ufG1fc2wx8yK2yEpRS1ZlbtBoi2vZgYtNbOL2bYW', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiI1d2pjTzdjVFk3ZTVSZ1JjaVdYR2NYTVFhbnQ4WHE2QUs2TFJqbVhUIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL21lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793277587),
	('vTA4ORcG3BCGQy6h98MHRZdewZ7uFeYlmwc75afb', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJzY2JIRm5iNWFsdmFLUUhYYWh0cFM4UVpsNkdUVkZFMkRBSWVkWE1xIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL21lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793277587),
	('xgIfaKWZ8LHgkjVacLN4YGkZLevutHQHGhPostM0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJZeXUwT2x6Z2I4SXF2YlgycEFaclpvNzh3SkZhOVBRSFFsZU13dWM5IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3B1YmxpY1wvYmFyYW5nYXlzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1793277587);

-- Dumping data for table dilg_makati_portal.submissions: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.submission_files: ~0 rows (approximately)

-- Dumping data for table dilg_makati_portal.users: ~6 rows (approximately)
INSERT INTO `users` (`id`, `name`, `first_name`, `last_name`, `contact_number`, `position`, `email`, `role`, `barangay_id`, `is_active`, `invited_at`, `activated_at`, `activation_token`, `activation_expires_at`, `terms_accepted_at`, `profile_photo_path`, `verification_status`, `verified_at`, `verified_by`, `rejection_reason`, `created_by`, `email_verified_at`, `password`, `password_changed_at`, `remember_token`, `created_at`, `updated_at`, `password_expires_at`, `force_password_change`, `two_factor_enabled`, `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at`) VALUES
	(1, 'DILG Makati Admin', NULL, NULL, NULL, NULL, 'admin@dilg.gov.ph', 'super_admin', NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00', NULL, NULL, NULL, NULL, 'unverified', NULL, NULL, NULL, NULL, '2026-09-30 01:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', NULL, NULL, '2026-09-30 01:00:00', '2026-09-30 01:00:00', NULL, 0, 0, NULL, NULL, NULL),
	(2, 'DILG Makati Supervisor', NULL, NULL, NULL, NULL, 'supervisor@dilg.gov.ph', 'office_supervisor', NULL, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00', NULL, NULL, NULL, NULL, 'unverified', NULL, NULL, NULL, NULL, '2026-09-30 01:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', NULL, NULL, '2026-09-30 01:00:00', '2026-09-30 01:00:00', NULL, 0, 0, NULL, NULL, NULL),
	(3, 'Bangkal Barangay Representative', NULL, NULL, NULL, NULL, 'rep.bangkal@barangay.test', 'barangay_rep', 1, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00', NULL, NULL, NULL, NULL, 'unverified', NULL, NULL, NULL, NULL, '2026-09-30 01:00:00', '$2y$12$eUSC9waGvA.pxf5dq6V8Huzo6VgDTvJYKs0Zw7uoRda/MTUDcM62C', '2026-10-27 05:18:43', NULL, '2026-09-30 01:00:00', '2026-10-27 05:18:43', '2026-11-03 05:18:43', 0, 0, NULL, NULL, NULL),
	(4, 'Poblacion Barangay Representative', NULL, NULL, NULL, NULL, 'rep.poblacion@barangay.test', 'barangay_rep', 20, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00', NULL, NULL, NULL, NULL, 'unverified', NULL, NULL, NULL, NULL, '2026-09-30 01:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', NULL, NULL, '2026-09-30 01:00:00', '2026-09-30 01:00:00', NULL, 0, 0, NULL, NULL, NULL),
	(7, 'San Antonio Barangay Representative', NULL, NULL, NULL, NULL, 'rep.san.antonio@barangay.test', 'barangay_rep', 24, 1, '2026-09-30 01:00:00', '2026-09-30 01:00:00', NULL, NULL, NULL, NULL, 'unverified', NULL, NULL, NULL, NULL, '2026-09-30 01:00:00', '$2y$12$k65lFAfAwNhrHo3MUyW6R.JsI6u0s25IXzyOXy9/swLbKRwUUs4Re', NULL, NULL, '2026-09-30 01:00:00', '2026-09-30 01:00:00', NULL, 0, 0, NULL, NULL, NULL),
	(9, 'Ron Suarez', NULL, NULL, NULL, NULL, 'orangeezz50805@gmail.com', 'office_supervisor', NULL, 1, '2026-10-12 09:00:19', '2026-10-12 09:01:41', NULL, NULL, NULL, NULL, 'unverified', NULL, NULL, NULL, NULL, '2026-10-12 09:01:41', '$2y$12$NiWRoNRy.MnMHIbQT0R8zeSqjpBsp/U3RRo7hEcbrsknqYrDaYdlW', '2026-10-27 04:54:04', NULL, '2026-10-12 09:00:12', '2026-10-29 04:40:53', '2026-11-03 04:54:04', 0, 0, 'eyJpdiI6IlFxVi9DTUF5eUZ0b3EzbitCZi9BR2c9PSIsInZhbHVlIjoiMHhCalA5QkovWjNNeURaMFNpOHgyckhGOUljeno4NjQzSkF1c25mODcvYXpjNnlpYkFNOTRHZjNmR3QwcFltMSIsIm1hYyI6IjIxOGE0MmJjMjA3NDc4ZGQwNWRmNzdiZjM4Y2U4MjNlZjA0M2RmY2M5MjYyNDFlY2IwMzdkZDg0MGZiYjQ0YTIiLCJ0YWciOiIifQ==', 'eyJpdiI6InhXTFkzRXdXcTJ1NVVidHQxUnpRN2c9PSIsInZhbHVlIjoidGMzYm0rRFhzVzV6TzR2cTVHUHRkQ3JLU1dnNm5KNEhTYWtHWlRCSXU2cWh6amMzRmQ3WStsUTB6REVaRlNjNE1kckhjcHJCQ09aY0xDakI2ekptdVU4ZytGWWFFZzh1akZ4blJqaVk5RzVtUFMyNUFKaVMwekNMeVlXa2NmRllVM2g2cjVPS1BBQ0Z3dTRhRzZ5a2g3UW5qTjc3UGhSZHZpNVM0dDd4VjBQU1ZOMjl1Ry90UG5FOEY1U2ZMWmdLdkh4dUF2Wm0yamlsZFBPWHVocjgyTkFLUkZsMEFDY0lzSU9QK3pIejJIM3BxRVJZMmJZU0RsaTkyaXNsNXRVT1Z6UEVtNS95ZVZXNWduWkpwZ3Z5MklzV3JkdTgxZC9BOFAwaUI0Y0ZHVmRVSDJNS2FBcVhBRk5NVEQyaGlPcGt4eVhBWVp3c2E5T25ObEdoYmJwRG95Z1NmOHRrdlhrWnFQL2FteUNmdk9TYUJKMHROZDJqUDdrSVVlKzBiQkFIUTIrV1NJRmxvSzN2ZGRha2liTnVzMmNNdk9EcEYrRkgxVmx0WGdOc1NiYjNZcmdqdEdsdmhqVzlWS0wwdWdOS0RmR1B5b3FXZXNmR1FVZktNZzV6eW10ZE5wNUQ1SHlVK1h1dTJyUHlqbWRiNXBHVEZtalQ2OS9JRHN4L0VLM3AwcWo3SHhwd0dvQU5kUVZTajh2TUxhMjlQWm83NUhUMDhYMmhUY2R0TzhvZG0xdDIvZXdEZGRKdytHRE8wa0srTlRsWFJaMEtUUFg3SG4yV3pXVTV2bGhpMnhhdzM3b0l0bUtBeFE3RGJzMFA3ZkZ4Y2tsUC9ZdFdWcGU1aU5ickdEcS9CYkRDQUt3VVIwNzBhaDM1THZVMGR3QzNOTmZqc2k1VWE0K0NGM0E9IiwibWFjIjoiZjBiYmNjYmYwNmJkODI2NDVmMzAxMWZiZTZhYjY1YzczNTI1YzkxOTUzYjdmYzhiM2QxNmJhMTQ0ODI0NjY3OCIsInRhZyI6IiJ9', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
