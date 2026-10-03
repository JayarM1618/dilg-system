<?php

return [
    /*
    | How many days after a period ends the report is due, per cycle.
    | These match the due dates already in your data (monthly = 5th of next month,
    | quarterly = 15th after quarter end). Change them to match DILG Makati policy.
    */
    'due_after_period_end_days' => [
        'weekly' => 3,
        'monthly' => 5,
        'quarterly' => 15,
        'semestral' => 30,
        'annual' => 31,
    ],

    // Barangay report uploads (Repository)
    'submission_mimes' => 'pdf,doc,docx,xls,xlsx',

    // Templates, guidelines, SOPs (Resources)
    'resource_mimes' => 'pdf,doc,docx,xls,xlsx,ppt,pptx',

    'resource_types' => ['template', 'guideline', 'sop', 'security_advisory', 'other'],

    'max_upload_kb' => 10240,
];
