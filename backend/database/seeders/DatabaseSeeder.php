<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * DILG Makati Portal seeder.
 * Run with:  php artisan migrate:fresh --seed
 * Every account below uses the password: password123
 *
 * Set SEED_SAMPLE_DATA=false in your shell/.env to skip the demo submissions/incidents.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $now = now();

        // 1) 33 barangays of Makati
        DB::table('barangays')->insert(array_map(fn ($r) => $r + ['is_active' => true, 'created_at' => $now, 'updated_at' => $now], [
            ['id' => 1, 'name' => 'Bangkal', 'code' => 'BGY-001', 'contact_person' => 'Punong Barangay of Bangkal', 'contact_number' => '0917-000-0001', 'contact_email' => 'bangkal@barangay.test'],
            ['id' => 2, 'name' => 'Bel-Air', 'code' => 'BGY-002', 'contact_person' => 'Punong Barangay of Bel-Air', 'contact_number' => '0917-000-0002', 'contact_email' => 'bel-air@barangay.test'],
            ['id' => 3, 'name' => 'Carmona', 'code' => 'BGY-003', 'contact_person' => 'Punong Barangay of Carmona', 'contact_number' => '0917-000-0003', 'contact_email' => 'carmona@barangay.test'],
            ['id' => 4, 'name' => 'Cembo', 'code' => 'BGY-004', 'contact_person' => 'Punong Barangay of Cembo', 'contact_number' => '0917-000-0004', 'contact_email' => 'cembo@barangay.test'],
            ['id' => 5, 'name' => 'Comembo', 'code' => 'BGY-005', 'contact_person' => 'Punong Barangay of Comembo', 'contact_number' => '0917-000-0005', 'contact_email' => 'comembo@barangay.test'],
            ['id' => 6, 'name' => 'Dasmariñas', 'code' => 'BGY-006', 'contact_person' => 'Punong Barangay of Dasmariñas', 'contact_number' => '0917-000-0006', 'contact_email' => 'dasmarinas@barangay.test'],
            ['id' => 7, 'name' => 'East Rembo', 'code' => 'BGY-007', 'contact_person' => 'Punong Barangay of East Rembo', 'contact_number' => '0917-000-0007', 'contact_email' => 'east.rembo@barangay.test'],
            ['id' => 8, 'name' => 'Forbes Park', 'code' => 'BGY-008', 'contact_person' => 'Punong Barangay of Forbes Park', 'contact_number' => '0917-000-0008', 'contact_email' => 'forbes.park@barangay.test'],
            ['id' => 9, 'name' => 'Guadalupe Nuevo', 'code' => 'BGY-009', 'contact_person' => 'Punong Barangay of Guadalupe Nuevo', 'contact_number' => '0917-000-0009', 'contact_email' => 'guadalupe.nuevo@barangay.test'],
            ['id' => 10, 'name' => 'Guadalupe Viejo', 'code' => 'BGY-010', 'contact_person' => 'Punong Barangay of Guadalupe Viejo', 'contact_number' => '0917-000-0010', 'contact_email' => 'guadalupe.viejo@barangay.test'],
            ['id' => 11, 'name' => 'Kasilawan', 'code' => 'BGY-011', 'contact_person' => 'Punong Barangay of Kasilawan', 'contact_number' => '0917-000-0011', 'contact_email' => 'kasilawan@barangay.test'],
            ['id' => 12, 'name' => 'La Paz', 'code' => 'BGY-012', 'contact_person' => 'Punong Barangay of La Paz', 'contact_number' => '0917-000-0012', 'contact_email' => 'la.paz@barangay.test'],
            ['id' => 13, 'name' => 'Magallanes', 'code' => 'BGY-013', 'contact_person' => 'Punong Barangay of Magallanes', 'contact_number' => '0917-000-0013', 'contact_email' => 'magallanes@barangay.test'],
            ['id' => 14, 'name' => 'Olympia', 'code' => 'BGY-014', 'contact_person' => 'Punong Barangay of Olympia', 'contact_number' => '0917-000-0014', 'contact_email' => 'olympia@barangay.test'],
            ['id' => 15, 'name' => 'Palanan', 'code' => 'BGY-015', 'contact_person' => 'Punong Barangay of Palanan', 'contact_number' => '0917-000-0015', 'contact_email' => 'palanan@barangay.test'],
            ['id' => 16, 'name' => 'Pembo', 'code' => 'BGY-016', 'contact_person' => 'Punong Barangay of Pembo', 'contact_number' => '0917-000-0016', 'contact_email' => 'pembo@barangay.test'],
            ['id' => 17, 'name' => 'Pinagkaisahan', 'code' => 'BGY-017', 'contact_person' => 'Punong Barangay of Pinagkaisahan', 'contact_number' => '0917-000-0017', 'contact_email' => 'pinagkaisahan@barangay.test'],
            ['id' => 18, 'name' => 'Pio del Pilar', 'code' => 'BGY-018', 'contact_person' => 'Punong Barangay of Pio del Pilar', 'contact_number' => '0917-000-0018', 'contact_email' => 'pio.del.pilar@barangay.test'],
            ['id' => 19, 'name' => 'Pitogo', 'code' => 'BGY-019', 'contact_person' => 'Punong Barangay of Pitogo', 'contact_number' => '0917-000-0019', 'contact_email' => 'pitogo@barangay.test'],
            ['id' => 20, 'name' => 'Poblacion', 'code' => 'BGY-020', 'contact_person' => 'Punong Barangay of Poblacion', 'contact_number' => '0917-000-0020', 'contact_email' => 'poblacion@barangay.test'],
            ['id' => 21, 'name' => 'Post Proper Northside', 'code' => 'BGY-021', 'contact_person' => 'Punong Barangay of Post Proper Northside', 'contact_number' => '0917-000-0021', 'contact_email' => 'post.proper.northside@barangay.test'],
            ['id' => 22, 'name' => 'Post Proper Southside', 'code' => 'BGY-022', 'contact_person' => 'Punong Barangay of Post Proper Southside', 'contact_number' => '0917-000-0022', 'contact_email' => 'post.proper.southside@barangay.test'],
            ['id' => 23, 'name' => 'Rizal', 'code' => 'BGY-023', 'contact_person' => 'Punong Barangay of Rizal', 'contact_number' => '0917-000-0023', 'contact_email' => 'rizal@barangay.test'],
            ['id' => 24, 'name' => 'San Antonio', 'code' => 'BGY-024', 'contact_person' => 'Punong Barangay of San Antonio', 'contact_number' => '0917-000-0024', 'contact_email' => 'san.antonio@barangay.test'],
            ['id' => 25, 'name' => 'San Isidro', 'code' => 'BGY-025', 'contact_person' => 'Punong Barangay of San Isidro', 'contact_number' => '0917-000-0025', 'contact_email' => 'san.isidro@barangay.test'],
            ['id' => 26, 'name' => 'San Lorenzo', 'code' => 'BGY-026', 'contact_person' => 'Punong Barangay of San Lorenzo', 'contact_number' => '0917-000-0026', 'contact_email' => 'san.lorenzo@barangay.test'],
            ['id' => 27, 'name' => 'Santa Cruz', 'code' => 'BGY-027', 'contact_person' => 'Punong Barangay of Santa Cruz', 'contact_number' => '0917-000-0027', 'contact_email' => 'santa.cruz@barangay.test'],
            ['id' => 28, 'name' => 'Singkamas', 'code' => 'BGY-028', 'contact_person' => 'Punong Barangay of Singkamas', 'contact_number' => '0917-000-0028', 'contact_email' => 'singkamas@barangay.test'],
            ['id' => 29, 'name' => 'South Cembo', 'code' => 'BGY-029', 'contact_person' => 'Punong Barangay of South Cembo', 'contact_number' => '0917-000-0029', 'contact_email' => 'south.cembo@barangay.test'],
            ['id' => 30, 'name' => 'Tejeros', 'code' => 'BGY-030', 'contact_person' => 'Punong Barangay of Tejeros', 'contact_number' => '0917-000-0030', 'contact_email' => 'tejeros@barangay.test'],
            ['id' => 31, 'name' => 'Urdaneta', 'code' => 'BGY-031', 'contact_person' => 'Punong Barangay of Urdaneta', 'contact_number' => '0917-000-0031', 'contact_email' => 'urdaneta@barangay.test'],
            ['id' => 32, 'name' => 'Valenzuela', 'code' => 'BGY-032', 'contact_person' => 'Punong Barangay of Valenzuela', 'contact_number' => '0917-000-0032', 'contact_email' => 'valenzuela@barangay.test'],
            ['id' => 33, 'name' => 'West Rembo', 'code' => 'BGY-033', 'contact_person' => 'Punong Barangay of West Rembo', 'contact_number' => '0917-000-0033', 'contact_email' => 'west.rembo@barangay.test'],
        ]));

        // 2) Report categories
        DB::table('report_categories')->insert(array_map(fn ($r) => $r + ['created_at' => $now, 'updated_at' => $now], [
            ['id' => 1, 'name' => 'Monthly Accomplishment Report', 'cycle' => 'monthly', 'description' => 'Summary of barangay programs, projects and activities accomplished during the month.'],
            ['id' => 2, 'name' => 'Weekly Peace and Order Situation Report', 'cycle' => 'weekly', 'description' => 'Weekly peace and order, blotter and incident summary.'],
            ['id' => 3, 'name' => 'Quarterly Barangay Financial Report', 'cycle' => 'quarterly', 'description' => 'Statement of income and expenditures for the quarter.'],
            ['id' => 4, 'name' => 'Semestral Barangay Development Plan Update', 'cycle' => 'semestral', 'description' => 'Progress update on the Barangay Development Plan.'],
            ['id' => 5, 'name' => 'Annual Barangay Profile', 'cycle' => 'annual', 'description' => 'Yearly update of the barangay profile and demographic data.'],
        ]));

        // 3) Users (password is hashed automatically by the User model cast)
        foreach ([
            ['id' => 1, 'name' => 'DILG Makati Admin', 'email' => 'admin@dilg.gov.ph', 'role' => 'super_admin', 'barangay_id' => null],
            ['id' => 2, 'name' => 'DILG Makati Supervisor', 'email' => 'supervisor@dilg.gov.ph', 'role' => 'office_supervisor', 'barangay_id' => null],
            ['id' => 3, 'name' => 'Bangkal Barangay Representative', 'email' => 'rep.bangkal@barangay.test', 'role' => 'barangay_rep', 'barangay_id' => 1],
            ['id' => 4, 'name' => 'Poblacion Barangay Representative', 'email' => 'rep.poblacion@barangay.test', 'role' => 'barangay_rep', 'barangay_id' => 20],
            ['id' => 5, 'name' => 'Rizal Barangay Representative', 'email' => 'rep.rizal@barangay.test', 'role' => 'barangay_rep', 'barangay_id' => 23],
            ['id' => 6, 'name' => 'Pitogo Barangay Representative', 'email' => 'rep.pitogo@barangay.test', 'role' => 'barangay_rep', 'barangay_id' => 19],
            ['id' => 7, 'name' => 'San Antonio Barangay Representative', 'email' => 'rep.san.antonio@barangay.test', 'role' => 'barangay_rep', 'barangay_id' => 24],
        ] as $u) {
            $user = new User($u + ['password' => 'password123', 'is_active' => true]);
            $user->id = $u['id'];
            $user->email_verified_at = $now;
            $user->save();
        }

        if (filter_var(env('SEED_SAMPLE_DATA', true), FILTER_VALIDATE_BOOLEAN)) {
            $this->seedSampleData($now);
        }
    }

    private function seedSampleData($now): void
    {
        $cols = ['id','barangay_id','report_category_id','period_label','period_start','period_end','due_date','status','submitted_by','submitted_at','reviewed_by','reviewed_at','review_remarks'];
        $rows = [
            [1, 1, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', 3, '2026-09-01 09:56:00', 1, '2026-09-03 09:56:00', null],
            [2, 2, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'under_review', null, '2026-09-01 17:35:00', 2, '2026-09-03 17:35:00', null],
            [3, 3, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'non_compliant', null, '2026-09-01 08:39:00', 1, '2026-09-03 08:39:00', 'Missing signature of the Punong Barangay.'],
            [4, 4, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-05 15:43:00', 2, '2026-09-07 15:43:00', null],
            [5, 5, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-03 13:51:00', 2, '2026-09-05 13:51:00', null],
            [6, 6, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'pending', null, null, null, null, null],
            [7, 7, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-05 09:35:00', 2, '2026-09-07 09:35:00', null],
            [8, 8, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-04 17:19:00', 1, '2026-09-06 17:19:00', null],
            [9, 9, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'non_compliant', null, '2026-09-03 14:05:00', 2, '2026-09-05 14:05:00', 'Incomplete attachments.'],
            [10, 10, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'under_review', null, '2026-09-02 17:56:00', 2, '2026-09-04 17:56:00', null],
            [11, 11, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-01 14:36:00', 2, '2026-09-03 14:36:00', null],
            [12, 12, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-05 10:52:00', 1, '2026-09-07 10:52:00', null],
            [13, 13, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'pending', null, null, null, null, null],
            [14, 14, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-05 14:30:00', 1, '2026-09-07 14:30:00', null],
            [15, 15, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-04 09:40:00', 2, '2026-09-06 09:40:00', null],
            [16, 16, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-01 14:42:00', 2, '2026-09-03 14:42:00', null],
            [17, 17, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-01 14:27:00', 1, '2026-09-03 14:27:00', null],
            [18, 18, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-06 10:41:00', 2, '2026-09-08 10:41:00', null],
            [19, 19, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'non_compliant', 6, '2026-09-02 11:16:00', 2, '2026-09-04 11:16:00', 'Incomplete attachments.'],
            [20, 20, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', 4, '2026-09-02 16:42:00', 1, '2026-09-04 16:42:00', null],
            [21, 21, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'non_compliant', null, '2026-09-03 09:28:00', 2, '2026-09-05 09:28:00', 'Incomplete attachments.'],
            [22, 22, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'submitted', null, '2026-09-04 15:04:00', null, null, null],
            [23, 23, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', 5, '2026-09-02 11:47:00', 2, '2026-09-04 11:47:00', null],
            [24, 24, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', 7, '2026-09-08 15:37:00', 1, '2026-09-10 15:37:00', null],
            [25, 25, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-04 17:02:00', 2, '2026-09-06 17:02:00', null],
            [26, 26, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-03 13:42:00', 2, '2026-09-05 13:42:00', null],
            [27, 27, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-04 15:37:00', 1, '2026-09-06 15:37:00', null],
            [28, 28, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'pending', null, null, null, null, null],
            [29, 29, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'under_review', null, '2026-09-01 14:42:00', 1, '2026-09-03 14:42:00', null],
            [30, 30, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'submitted', null, '2026-09-01 14:24:00', null, null, null],
            [31, 31, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'non_compliant', null, '2026-09-01 14:00:00', 1, '2026-09-03 14:00:00', 'Incomplete attachments.'],
            [32, 32, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'under_review', null, '2026-09-05 13:59:00', 1, '2026-09-07 13:59:00', null],
            [33, 33, 1, '2026-08', '2026-08-01', '2026-08-31', '2026-09-05', 'compliant', null, '2026-09-02 12:28:00', 2, '2026-09-04 12:28:00', null],
            [34, 1, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', null, null, null, null, null],
            [35, 2, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-22 17:39:00', null, null, null],
            [36, 3, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', null, null, null, null, null],
            [37, 4, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'compliant', null, '2026-09-23 11:27:00', 2, '2026-09-25 11:27:00', null],
            [38, 5, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-18 09:35:00', null, null, null],
            [39, 6, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-18 10:02:00', null, null, null],
            [40, 7, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-29 08:28:00', null, null, null],
            [41, 8, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', null, null, null, null, null],
            [42, 9, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-22 08:08:00', null, null, null],
            [43, 10, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-18 16:57:00', null, null, null],
            [44, 11, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', null, null, null, null, null],
            [45, 12, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'compliant', null, '2026-09-28 10:24:00', 2, '2026-09-30 10:00:00', null],
            [46, 13, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-21 09:24:00', null, null, null],
            [47, 14, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'under_review', null, '2026-09-20 10:16:00', 2, '2026-09-22 10:16:00', null],
            [48, 15, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-27 14:18:00', null, null, null],
            [49, 16, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-20 16:30:00', null, null, null],
            [50, 17, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-23 16:50:00', null, null, null],
            [51, 18, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'under_review', null, '2026-09-16 11:14:00', 1, '2026-09-18 11:14:00', null],
            [52, 19, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', null, null, null, null, null],
            [53, 20, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', null, null, null, null, null],
            [54, 21, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-21 16:50:00', null, null, null],
            [55, 22, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', null, null, null, null, null],
            [56, 23, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', null, null, null, null, null],
            [57, 24, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'compliant', 7, '2026-09-15 13:54:00', 1, '2026-09-17 13:54:00', null],
            [58, 25, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-25 17:50:00', null, null, null],
            [59, 26, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-16 17:45:00', null, null, null],
            [60, 27, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'under_review', null, '2026-09-27 17:46:00', 1, '2026-09-29 17:46:00', null],
            [61, 28, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-24 12:42:00', null, null, null],
            [62, 29, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'submitted', null, '2026-09-16 12:06:00', null, null, null],
            [63, 30, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', null, null, null, null, null],
            [64, 31, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'compliant', null, '2026-09-25 08:48:00', 2, '2026-09-27 08:48:00', null],
            [65, 32, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'pending', null, null, null, null, null],
            [66, 33, 1, '2026-09', '2026-09-01', '2026-09-30', '2026-10-05', 'compliant', null, '2026-09-25 09:32:00', 2, '2026-09-27 09:32:00', null],
            [67, 1, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', 3, '2026-09-28 09:18:00', null, null, null],
            [68, 2, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [69, 3, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'under_review', null, '2026-09-19 09:00:00', 2, '2026-09-21 09:00:00', null],
            [70, 4, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [71, 5, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [72, 6, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-15 08:06:00', null, null, null],
            [73, 7, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'under_review', null, '2026-09-19 09:06:00', 2, '2026-09-21 09:06:00', null],
            [74, 8, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-22 17:40:00', null, null, null],
            [75, 9, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [76, 10, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [77, 11, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [78, 12, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-18 17:29:00', null, null, null],
            [79, 13, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-25 09:43:00', null, null, null],
            [80, 14, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-23 12:24:00', null, null, null],
            [81, 15, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-28 13:03:00', null, null, null],
            [82, 16, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [83, 17, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-15 12:44:00', null, null, null],
            [84, 18, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-26 09:19:00', null, null, null],
            [85, 19, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [86, 20, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', 4, '2026-09-29 08:34:00', null, null, null],
            [87, 21, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [88, 22, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'under_review', null, '2026-09-15 09:10:00', 1, '2026-09-17 09:10:00', null],
            [89, 23, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'compliant', 5, '2026-09-17 16:22:00', 2, '2026-09-19 16:22:00', null],
            [90, 24, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'compliant', 7, '2026-09-24 10:22:00', 2, '2026-09-26 10:22:00', null],
            [91, 25, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-18 14:42:00', null, null, null],
            [92, 26, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'under_review', null, '2026-09-17 10:34:00', 1, '2026-09-19 10:34:00', null],
            [93, 27, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [94, 28, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [95, 29, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
            [96, 30, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-19 10:14:00', null, null, null],
            [97, 31, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'compliant', null, '2026-09-19 16:30:00', 2, '2026-09-21 16:30:00', null],
            [98, 32, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'submitted', null, '2026-09-20 10:40:00', null, null, null],
            [99, 33, 3, '2026-Q3', '2026-07-01', '2026-09-30', '2026-10-15', 'pending', null, null, null, null, null],
        ];
        foreach (array_chunk($rows, 50) as $chunk) {
            DB::table('submissions')->insert(array_map(
                fn ($r) => array_combine($cols, $r) + ['created_at' => $now, 'updated_at' => $now],
                $chunk
            ));
        }

        $cols = ['id','reported_by','type','severity','description','status','acknowledged_by','acknowledged_at','resolution_notes','resolved_at'];
        $rows = [
            [1, 3, 'phishing_attempt', 'medium', 'Received an email pretending to be from DILG asking for our portal password.', 'acknowledged', 1, '2026-09-28 10:15:00', null, null],
            [2, 5, 'suspicious_login', 'high', 'Login notification from an unknown location on the barangay shared account.', 'escalated_to_icto', 2, '2026-09-29 08:40:00', null, null],
            [3, 4, 'malware', 'critical', 'Barangay hall PC flagged by antivirus after opening a .xls attachment.', 'reported', null, null, null, null],
            [4, 6, 'other', 'low', 'Portal was slow during upload of the monthly report.', 'resolved', 1, '2026-09-25 14:00:00', 'Network issue on the barangay side; resolved after router restart.', '2026-09-26 09:00:00'],
        ];
        DB::table('security_incidents')->insert(array_map(
            fn ($r) => array_combine($cols, $r) + ['created_at' => $now, 'updated_at' => $now],
            $rows
        ));
    }
}
