<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure columns exist (for fresh databases where pdf_architecture_update ran before table was created)
        if (Schema::hasTable('document_categories')) {
            Schema::table('document_categories', function (Blueprint $table) {
                if (!Schema::hasColumn('document_categories', 'parent_id')) {
                    $table->unsignedBigInteger('parent_id')->nullable()->after('id');
                    $table->foreign('parent_id')
                          ->references('id')
                          ->on('document_categories')
                          ->nullOnDelete();
                }
                if (!Schema::hasColumn('document_categories', 'group_slug')) {
                    $table->string('group_slug', 60)->nullable()->after('slug');
                }
            });
        }

        $now = now();

        $categories = [
            // Standard general categories
            ['id' => 1, 'name' => 'Policies & Guidelines', 'slug' => 'policies', 'group_slug' => null, 'description' => 'Official DILG policies, memorandums, and guidelines', 'sort_order' => 1],
            ['id' => 2, 'name' => 'Compliance Records', 'slug' => 'compliance', 'group_slug' => null, 'description' => 'Compliance certificates, inspection reports, and verification records', 'sort_order' => 2],
            ['id' => 3, 'name' => 'Barangay Documents', 'slug' => 'barangay-docs', 'group_slug' => null, 'description' => 'Official barangay records, resolutions, and certifications', 'sort_order' => 3],
            ['id' => 4, 'name' => 'Administrative Records', 'slug' => 'admin-records', 'group_slug' => null, 'description' => 'Internal administrative documents, meeting minutes, and correspondence', 'sort_order' => 4],
            ['id' => 5, 'name' => 'Cybersecurity & IT', 'slug' => 'cybersecurity', 'group_slug' => null, 'description' => 'Network documentation, security audits, and IT policies', 'sort_order' => 5],
            ['id' => 6, 'name' => 'Reports & Analytics', 'slug' => 'reports', 'group_slug' => null, 'description' => 'Consolidated reports, statistical data, and analytics outputs', 'sort_order' => 6],

            // PDF Architecture: Repository parent categories
            ['id' => 7, 'name' => 'Legislative Archives', 'slug' => 'legislative-archives', 'group_slug' => 'legislative', 'description' => 'Mambabatas — Resolutions, Ordinances, SK Resolutions', 'sort_order' => 1],
            ['id' => 8, 'name' => 'Civil Registry Records', 'slug' => 'civil-registry', 'group_slug' => 'civil_registry', 'description' => 'RBI Masterlist, KK Directory', 'sort_order' => 2],
            ['id' => 9, 'name' => 'Audit & Compliance Requirements', 'slug' => 'audit-compliance', 'group_slug' => 'audit_compliance', 'description' => 'MOVs / Means of Verification', 'sort_order' => 3],

            // Child categories under Legislative Archives (parent_id 7)
            ['id' => 10, 'parent_id' => 7, 'name' => 'Barangay Resolutions', 'slug' => 'brgy-resolutions', 'group_slug' => 'legislative', 'description' => 'Mga pinagtibay na Barangay Resolutions', 'sort_order' => 1],
            ['id' => 11, 'parent_id' => 7, 'name' => 'Barangay Ordinances', 'slug' => 'brgy-ordinances', 'group_slug' => 'legislative', 'description' => 'Mga naipasang Barangay Ordinances', 'sort_order' => 2],
            ['id' => 12, 'parent_id' => 7, 'name' => 'SK Resolutions & Ordinances', 'slug' => 'sk-resolutions', 'group_slug' => 'legislative', 'description' => 'Sub-folder para sa SK Resolutions & Ordinances', 'sort_order' => 3],

            // Child categories under Civil Registry (parent_id 8)
            ['id' => 13, 'parent_id' => 8, 'name' => 'RBI Masterlist', 'slug' => 'rbi-masterlist', 'group_slug' => 'civil_registry', 'description' => 'Registry of Barangay Inhabitants — protektadong talaan', 'sort_order' => 1],
            ['id' => 14, 'parent_id' => 8, 'name' => 'KK Directory', 'slug' => 'kk-directory', 'group_slug' => 'civil_registry', 'description' => 'Katipunan ng Kabataan Directory — edad 15-30', 'sort_order' => 2],

            // Child categories under Audit & Compliance (parent_id 9)
            ['id' => 15, 'parent_id' => 9, 'name' => 'BFDP / SKFDP MOVs', 'slug' => 'fdp-movs', 'group_slug' => 'audit_compliance', 'description' => 'Scanned copies ng financial disclosure boards', 'sort_order' => 1],
            ['id' => 16, 'parent_id' => 9, 'name' => 'Project Documentation', 'slug' => 'project-docs', 'group_slug' => 'audit_compliance', 'description' => 'Project photos, liquidation attachments, attendance sheets', 'sort_order' => 2],
            ['id' => 17, 'parent_id' => 9, 'name' => 'SGLGB Compliance Evidence', 'slug' => 'sglgb-evidence', 'group_slug' => 'audit_compliance', 'description' => 'Folders ng compliance evidence para sa SGLGB', 'sort_order' => 3],

            // Sectoral categories
            ['id' => 18, 'name' => 'Birth Certificates', 'slug' => 'birth_certificates', 'group_slug' => 'civil_registry', 'description' => 'Barangay-certified birth records', 'sort_order' => 10],
            ['id' => 19, 'name' => 'Death Certificates', 'slug' => 'death_certificates', 'group_slug' => 'civil_registry', 'description' => 'Barangay-certified death records', 'sort_order' => 11],
            ['id' => 20, 'name' => 'Barangay Clearances', 'slug' => 'barangay_clearances', 'group_slug' => 'civil_registry', 'description' => 'Barangay clearance documents', 'sort_order' => 12],
            ['id' => 21, 'name' => 'Certificates of Indigency', 'slug' => 'certificates_of_indigency', 'group_slug' => 'civil_registry', 'description' => 'Certificates of indigency', 'sort_order' => 13],
            ['id' => 22, 'name' => 'COA Audit Reports', 'slug' => 'coa_audit', 'group_slug' => 'audit_compliance', 'description' => 'Commission on Audit reports', 'sort_order' => 20],
            ['id' => 23, 'name' => 'Financial Statements', 'slug' => 'financial_statements', 'group_slug' => 'audit_compliance', 'description' => 'Barangay financial statements', 'sort_order' => 21],
            ['id' => 24, 'name' => 'Annual Budget', 'slug' => 'annual_budget', 'group_slug' => 'audit_compliance', 'description' => 'Approved annual budget documents', 'sort_order' => 22],
            ['id' => 25, 'name' => 'KP Case Records', 'slug' => 'kp_case_records', 'group_slug' => 'katarungang_pambarangay', 'description' => 'Katarungang Pambarangay case files and settlements', 'sort_order' => 30],
            ['id' => 26, 'name' => 'Mediation Agreements', 'slug' => 'mediation_agreements', 'group_slug' => 'katarungang_pambarangay', 'description' => 'Mediation and conciliation agreements', 'sort_order' => 31],
            ['id' => 27, 'name' => 'Certificates to File Action', 'slug' => 'cfa', 'group_slug' => 'katarungang_pambarangay', 'description' => 'Certificates to File Action issued by Lupong Tagapamayapa', 'sort_order' => 32],
            ['id' => 28, 'name' => 'Peace & Order Reports', 'slug' => 'peace_order', 'group_slug' => 'peace_order', 'description' => 'Barangay peace and order situational reports', 'sort_order' => 40],
            ['id' => 29, 'name' => 'Anti-Illegal Drugs Reports', 'slug' => 'anti_drugs', 'group_slug' => 'peace_order', 'description' => 'BADAC reports and anti-illegal drugs campaign records', 'sort_order' => 41],
            ['id' => 30, 'name' => 'Tanod Duty Reports', 'slug' => 'tanod_reports', 'group_slug' => 'peace_order', 'description' => 'Barangay tanod deployment and duty reports', 'sort_order' => 42],
            ['id' => 31, 'name' => 'GAD Plan & Budget', 'slug' => 'gad_plan', 'group_slug' => 'gad', 'description' => 'Gender and Development plan and budget', 'sort_order' => 50],
            ['id' => 32, 'name' => 'GAD Accomplishment Reports', 'slug' => 'gad_accomplishment', 'group_slug' => 'gad', 'description' => 'GAD accomplishment and activity reports', 'sort_order' => 51],
            ['id' => 33, 'name' => 'PWD Records', 'slug' => 'pwd_records', 'group_slug' => 'vulnerable_sectors', 'description' => 'Persons with Disability registry and services', 'sort_order' => 60],
            ['id' => 34, 'name' => 'Senior Citizens Records', 'slug' => 'senior_citizens', 'group_slug' => 'vulnerable_sectors', 'description' => 'Senior citizen registry and services', 'sort_order' => 61],
            ['id' => 35, 'name' => 'Solo Parent Records', 'slug' => 'solo_parent', 'group_slug' => 'vulnerable_sectors', 'description' => 'Solo parent registry and services', 'sort_order' => 62],
            ['id' => 36, 'name' => 'SK Plans & Programs', 'slug' => 'sk_plans', 'group_slug' => 'sk', 'description' => 'SK development plans and programs', 'sort_order' => 70],
            ['id' => 37, 'name' => 'SK Financial Reports', 'slug' => 'sk_financial', 'group_slug' => 'sk', 'description' => 'SK financial reports and budget utilization', 'sort_order' => 71],
            ['id' => 38, 'name' => 'SK Activity Reports', 'slug' => 'sk_activity', 'group_slug' => 'sk', 'description' => 'SK activity and accomplishment reports', 'sort_order' => 72],
            ['id' => 39, 'name' => 'SWM Plans', 'slug' => 'swm_plans', 'group_slug' => 'environment', 'description' => 'Solid Waste Management plans', 'sort_order' => 80],
            ['id' => 40, 'name' => 'Environmental Reports', 'slug' => 'environmental_reports', 'group_slug' => 'environment', 'description' => 'Environmental monitoring and compliance reports', 'sort_order' => 81],
            ['id' => 41, 'name' => 'Cleanup Drive Reports', 'slug' => 'cleanup_drive', 'group_slug' => 'environment', 'description' => 'Weekly/monthly cleanup drive documentation', 'sort_order' => 82],
        ];

        foreach ($categories as $cat) {
            $catId = $cat['id'];
            unset($cat['id']);
            DB::table('document_categories')->updateOrInsert(
                ['slug' => $cat['slug']],
                array_merge($cat, [
                    'id' => $catId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
            );
        }
    }

    public function down(): void
    {
    }
};
