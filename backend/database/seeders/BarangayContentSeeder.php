<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Sample announcements, events and programs for the Citizens View.
 * Dates are relative to today, so the calendar always has upcoming events.
 *
 * Run on its own (keeps every other table):  php artisan db:seed --class=BarangayContentSeeder
 */
class BarangayContentSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $today = $now->copy()->startOfDay();
        $creators = [1 => 3, 20 => 4, 23 => 5, 24 => 7];

        // Start clean so running this seeder twice does not duplicate rows.
        DB::table('barangay_programs')->delete();
        DB::table('barangay_announcements')->delete();

        // Public profiles
        foreach ([
            1 => ['A residential and commercial barangay in the heart of Makati. The barangay hall serves residents with certificates, clearances and community programs.', 'Barangay Hall, Bangkal, Makati City'],
            2 => ['A residential barangay known for its tree-lined streets. The barangay focuses on safety, cleanliness and neighbourhood programs.', 'Barangay Hall, Bel-Air, Makati City'],
            20 => ['A busy mixed-use barangay with shops, restaurants and homes. The barangay supports small businesses and keeps the community safe.', 'Barangay Hall, Poblacion, Makati City'],
            23 => ['A residential barangay with a close-knit community. Programs focus on senior citizens, youth and the environment.', 'Barangay Hall, Rizal, Makati City'],
            24 => ['A residential barangay offering skills training and disaster preparedness for its families.', 'Barangay Hall, San Antonio, Makati City'],
        ] as $id => [$about, $address]) {
            DB::table('barangays')->where('id', $id)->update([
                'about' => $about,
                'hall_address' => $address,
                'office_hours' => 'Monday to Friday, 8:00 AM to 5:00 PM',
            ]);
        }

        // Announcements: [barangay_id, title, body, pinned, days ago]
        foreach ([
            [1, 'Barangay Assembly this month', 'All residents are invited to the quarterly Barangay Assembly. Please bring a valid ID. Updates on projects and the barangay budget will be presented.', true, 2],
            [1, 'Water interruption notice', 'Scheduled pipe maintenance may cause low water pressure in some puroks. Please store water ahead of time.', false, 5],
            [2, 'Free anti-rabies vaccination for pets', 'Bring your dog or cat to the barangay hall. Pets must be on a leash or inside a carrier.', true, 3],
            [2, 'Clean-up drive volunteers needed', 'Join your neighbours in keeping Bel-Air clean. Gloves and bags will be provided.', false, 8],
            [20, 'Business permit renewal reminder', 'Business owners are reminded to renew their barangay clearance before the deadline to avoid penalties.', true, 1],
            [20, 'Night market schedule', 'The weekend night market runs on its regular schedule. Vendors, please coordinate with the barangay hall for stall assignments.', false, 6],
            [23, 'Senior citizen pension orientation', 'Senior citizens and their families are invited to an orientation on pension and benefits.', true, 4],
            [23, 'Declogging of canals this week', 'Barangay crews will be declogging canals. Please avoid throwing garbage into drainage.', false, 7],
            [24, 'Livelihood training slots open', 'Slots are open for the food processing livelihood training. Register at the barangay hall.', true, 2],
            [24, 'Typhoon preparedness reminder', 'Prepare a go-bag, charge your phones and know your evacuation center. Follow barangay announcements.', false, 9],
        ] as [$bid, $title, $body, $pinned, $daysAgo]) {
            DB::table('barangay_announcements')->insert([
                'barangay_id' => $bid, 'title' => $title, 'body' => $body, 'is_pinned' => $pinned,
                'published_at' => $now->copy()->subDays($daysAgo), 'created_by' => $creators[$bid] ?? null,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // Events (on the calendar): [barangay_id, title, category, venue, days ahead, hour (PH time), hours long, description]
        foreach ([
            [1, 'Quarterly Barangay Assembly', 'social_services', 'Bangkal Barangay Hall', 6, 14, 2, 'Open to all residents. Reports on projects and the budget.'],
            [1, 'Medical and Dental Mission', 'health', 'Bangkal Covered Court', 14, 8, 6, 'Free check-ups, dental cleaning and medicines while supplies last.'],
            [1, 'Youth Basketball League Opening', 'sports_youth', 'Bangkal Covered Court', 27, 15, 3, 'Opening ceremony and first games of the barangay league.'],
            [2, 'Pet Anti-Rabies Vaccination', 'health', 'Bel-Air Barangay Hall', 9, 9, 4, 'Free vaccination for dogs and cats.'],
            [2, 'Community Clean-Up Drive', 'environment', 'Bel-Air Plaza', 16, 6, 3, 'Bring gloves if you have them. Bags and refreshments provided.'],
            [20, 'Business Permit Renewal Desk', 'social_services', 'Poblacion Barangay Hall', 5, 9, 8, 'Extended desk for business clearance renewals.'],
            [20, 'Peace and Order Dialogue', 'peace_and_order', 'Poblacion Barangay Hall', 18, 15, 2, 'Residents and tanod meet to discuss safety concerns.'],
            [20, 'Christmas Tree Lighting', 'other', 'Poblacion Plaza', 52, 18, 3, 'Community program with music and food stalls.'],
            [23, 'Senior Citizens Pension Orientation', 'social_services', 'Rizal Barangay Hall', 8, 10, 3, 'Learn how to claim pension and other benefits.'],
            [23, 'Tree Planting Activity', 'environment', 'Rizal Riverside', 21, 7, 4, 'Volunteers welcome. Seedlings provided.'],
            [24, 'Livelihood Training: Food Processing', 'livelihood', 'San Antonio Barangay Hall', 11, 9, 6, 'Hands-on training. Limited slots, register early.'],
            [24, 'Disaster Preparedness Drill', 'peace_and_order', 'San Antonio Covered Court', 25, 9, 3, 'Earthquake and fire drill for all households.'],
        ] as [$bid, $title, $category, $venue, $daysAhead, $hourPh, $hours, $description]) {
            // The database stores UTC; Philippine time is UTC+8.
            $start = $today->copy()->addDays($daysAhead)->addHours($hourPh - 8);
            DB::table('barangay_programs')->insert([
                'barangay_id' => $bid, 'kind' => 'event', 'title' => $title, 'description' => $description,
                'category' => $category, 'venue' => $venue,
                'starts_at' => $start, 'ends_at' => $start->copy()->addHours($hours),
                'created_by' => $creators[$bid] ?? null, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // Ongoing programs: [barangay_id, title, category, schedule, description]
        foreach ([
            [1, 'Feeding Program', 'health', 'Every Saturday, 8 AM to 11 AM', 'Weekly supplemental feeding for children of the barangay.'],
            [1, 'Scholarship Assistance', 'education', 'Applications open each semester', 'Help with school fees for qualified students.'],
            [2, 'Senior Citizen Wellness Hour', 'health', 'Every Tuesday, 9 AM', 'Light exercise and blood pressure checks for seniors.'],
            [20, 'Livelihood Bazaar', 'livelihood', 'Every Friday, 3 PM', 'A place for residents to sell homemade products.'],
            [20, 'Barangay Legal Aid Desk', 'social_services', 'Monday to Friday, 1 PM to 4 PM', 'Free legal advice for residents.'],
            [23, 'Youth Tutorial Sessions', 'education', 'Every Wednesday, 4 PM', 'Free tutoring for elementary and high school students.'],
            [23, 'Zumba for Health', 'sports_youth', 'Monday, Wednesday and Friday, 5:30 AM', 'Free community exercise session.'],
            [24, 'Skills Training Center', 'livelihood', 'Weekdays, 9 AM to 3 PM', 'Short courses in cooking, sewing and basic electrical work.'],
            [24, 'Solid Waste Segregation Drive', 'environment', 'Collection every Thursday', 'Sort your waste to keep San Antonio clean.'],
        ] as [$bid, $title, $category, $schedule, $description]) {
            DB::table('barangay_programs')->insert([
                'barangay_id' => $bid, 'kind' => 'program', 'title' => $title, 'description' => $description,
                'category' => $category, 'schedule_note' => $schedule,
                'created_by' => $creators[$bid] ?? null, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }
}
