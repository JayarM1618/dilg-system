<?php

namespace Database\Seeders;

use App\Models\BagwisPpa;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BagwisPpaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ppas = [
            [
                'name' => 'Barangay Anti-Drug Abuse Council (BADAC)',
                'slug' => 'badac',
                'frequency' => 'Quarterly',
                'responsible_office' => 'CADAC / DILG Makati / PNP',
                'description' => 'Makati City anti-illegal drug advocacy, community-based drug rehabilitation program (CBDRP), reporting of drug-clearing parameters, and BADAC committee functionality.',
                'deadline_description' => 'Tuwing ika-5 ng sumunod na buwan ng bawat quarter (Q1: Apr 5, Q2: Jul 5, Q3: Oct 5, Q4: Jan 5)',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Barangay Council for the Protection of Children (BCPC)',
                'slug' => 'bcpc',
                'frequency' => 'Quarterly',
                'responsible_office' => 'Makati CSWD / DILG Makati',
                'description' => 'Comprehensive child protection programs, monitoring children at risk (CAR) and children in conflict with the law (CICL), daycare facility assistance, and child rights advocacy.',
                'deadline_description' => 'Quarterly ulat pagsapit ng ika-5 ng susunod na quarter',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Violence Against Women and Children (VAWC)',
                'slug' => 'vawc',
                'frequency' => 'Quarterly',
                'responsible_office' => 'Makati GAD Council / DILG Makati',
                'description' => 'Barangay VAW Desk operations, logging of domestic and gender violence complaints, issuance of Barangay Protection Orders (BPO), and referral protocols to city medical/legal units.',
                'deadline_description' => 'Tuwing ika-5 ng Apr, Jul, Oct, at Jan',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Barangay Peace and Order Council (BPOC)',
                'slug' => 'bpoc',
                'frequency' => 'Monthly',
                'responsible_office' => 'Makati Police Department / POC / DILG Makati',
                'description' => 'City-wide peace and order monitoring, Tanod patrol logs, crime blotter consolidation, community dispute reduction, and security coordination with Makati Police.',
                'deadline_description' => 'Buwan-buwan tuwing ika-10 ng buwan',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Barangay Disaster Risk Reduction & Management (BDRRMC)',
                'slug' => 'bdrrmc',
                'frequency' => 'Quarterly',
                'responsible_office' => 'Makati DRRMO / DILG Makati',
                'description' => 'Disaster preparedness drills, hazard mapping, calamity fund utilization, contingency planning, and emergency equipment readiness per barangay.',
                'deadline_description' => 'Quarterly progress report at taunang BDRRM Plan update',
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'Gender and Development Focal Point System (GAD)',
                'slug' => 'gad',
                'frequency' => 'Annual',
                'responsible_office' => 'City GAD Council / DILG Makati',
                'description' => 'Mandatory 5% GAD budget utilization tracking, gender-responsive barangay programs, gender sensitivity orientations, and annual accomplishment reporting.',
                'deadline_description' => 'Annual GAD Plan & Accomplishment Report (Tuwing Disyembre / Enero)',
                'is_active' => true,
                'sort_order' => 6,
            ],
        ];

        foreach ($ppas as $data) {
            BagwisPpa::firstOrCreate(
                ['slug' => $data['slug']],
                $data
            );
        }
    }
}

