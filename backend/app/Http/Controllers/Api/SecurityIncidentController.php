<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SecurityIncident;
use Illuminate\Http\Request;

class SecurityIncidentController extends Controller
{
    /** Office side sees all reports; barangay reps see only what they filed. */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = SecurityIncident::with(['reporter', 'acknowledger']);

        if (!$user->hasOfficeOversight()) {
            $query->where('reported_by', $user->id);
        }

        return $query->latest()->paginate(20);
    }

    /** Anyone (staff or barangay rep) can file a report - this replaces informal email forwarding. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => ['required', 'in:phishing_attempt,suspicious_login,data_leak_suspicion,malware,other'],
            'severity' => ['required', 'in:low,medium,high,critical'],
            'description' => ['required', 'string'],
            'evidence' => ['nullable', 'file', 'max:10240', 'mimes:png,jpg,jpeg,pdf,txt'],
        ]);

        $evidencePath = null;
        if ($request->hasFile('evidence')) {
            $evidencePath = $request->file('evidence')->store('security-evidence', 'local');
        }

        $incident = SecurityIncident::create([
            'reported_by' => $request->user()->id,
            'type' => $data['type'],
            'severity' => $data['severity'],
            'description' => $data['description'],
            'evidence_path' => $evidencePath,
            'status' => 'reported',
        ]);

        ActivityLog::record('security_incident.reported', $incident, ['severity' => $data['severity']]);

        return response()->json($incident, 201);
    }

    /** Office staff acknowledges, escalates to ICTO, or resolves. */
    public function updateStatus(Request $request, SecurityIncident $securityIncident)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'status' => ['required', 'in:acknowledged,escalated_to_icto,resolved,false_positive'],
            'resolution_notes' => ['nullable', 'string'],
        ]);

        $updates = ['status' => $data['status']];

        if ($data['status'] === 'acknowledged') {
            $updates['acknowledged_by'] = $request->user()->id;
            $updates['acknowledged_at'] = now();
        }

        if (in_array($data['status'], ['resolved', 'false_positive'])) {
            $updates['resolution_notes'] = $data['resolution_notes'] ?? null;
            $updates['resolved_at'] = now();
        }

        $securityIncident->update($updates);

        ActivityLog::record('security_incident.status_updated', $securityIncident, ['status' => $data['status']]);

        return $securityIncident;
    }
}
