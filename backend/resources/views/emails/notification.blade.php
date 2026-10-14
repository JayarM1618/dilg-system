<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $notifTitle }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f0fb;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0fb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(91,60,200,0.08);">

{{-- Header --}}
<tr>
<td style="background:linear-gradient(135deg,#5A18C9,#7B4DFF);padding:24px 32px;text-align:center;">
    <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">DILG Makati &middot; Talaghayan</h1>
</td>
</tr>

{{-- Body --}}
<tr>
<td style="padding:28px 32px 24px;">
    <p style="margin:0 0 14px;font-size:15px;color:#1B1235;">Hello <strong>{{ $recipientName }}</strong>,</p>

    <div style="margin:0 0 20px;padding:16px 20px;background:#f8f5ff;border-left:4px solid #7B4DFF;border-radius:8px;">
        <p style="margin:0 0 6px;font-size:16px;font-weight:600;color:#1B1235;">{{ $notifTitle }}</p>
        <p style="margin:0;font-size:14px;line-height:1.5;color:#555;">{{ $notifBody }}</p>
        @if($actorName)
        <p style="margin:8px 0 0;font-size:13px;color:#888;">By: {{ $actorName }}</p>
        @endif
    </div>

    @if($actionUrl)
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto;">
    <tr>
    <td style="border-radius:28px;background:#7B4DFF;">
        <a href="{{ $actionUrl }}" target="_blank"
           style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:28px;">
            View in Talaghayan
        </a>
    </td>
    </tr>
    </table>
    @endif
</td>
</tr>

{{-- Footer --}}
<tr>
<td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #f0ecf7;">
    <p style="margin:0;font-size:12px;color:#aaa;">
        &copy; {{ date('Y') }} DILG Makati &middot; Talaghayan Portal<br>
        This is an automated notification. Please do not reply to this email.
    </p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>
