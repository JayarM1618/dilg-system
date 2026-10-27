<?php

return [
    /*
    | How many days after a period ends the report is due, per cycle.
    | Adjusted to match DILG Makati PDF architecture deadlines.
    */
    'due_after_period_end_days' => [
        'weekly'    => 1,   // BARKADA: due every Monday (1 day after week ends Sunday)
        'monthly'   => 20,  // BaRCO: ika-20 ng buwan; ECA: regular monthly
        'quarterly' => 10,  // BFDP/SKFDP: ika-10; VAW/VAC/KP: ika-5 (use lower)
        'semestral' => 30,
        'annual'    => 31,
    ],

    // Barangay report uploads (Reports pillar)
    'submission_mimes' => 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png',

    // Templates, guidelines, SOPs (Resources pillar)
    'resource_mimes' => 'pdf,doc,docx,xls,xlsx,ppt,pptx',

    // Files DILG sends out, and the files barangays send back (Requirements)
    'requirement_mimes' => 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,zip',

    'requirement_kinds' => ['file', 'report', 'complaint', 'memo', 'other'],

    'resource_types' => ['template', 'guideline', 'sop', 'toolkit', 'citizen_chart', 'drive_link', 'security_advisory', 'other'],

    'resource_groups' => [
        'standard_formats'   => 'Standard Formats & Templates',
        'sectoral_toolkits'  => 'Sectoral Toolkits & Reference Manuals',
        'citizen_charts'     => 'Makati Citizen Charts',
        'drive_links'        => 'Google Drive Files Link',
    ],

    'max_upload_kb' => 10240,
];
