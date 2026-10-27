<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Account Verified</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f0fb;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0fb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(91,60,200,0.08);">

{{-- Header --}}
<tr>
<td style="background:linear-gradient(135deg,#0B6B52,#06D6A0);padding:28px 32px;text-align:center;">
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">Account Verified</h1>
</td>
</tr>

{{-- Body --}}
<tr>
<td style="padding:32px 32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:50%;background-color:#E6FBF3;text-align:center;font-size:32px;">
            &#x2713;
        </div>
    </div>

    <p style="margin:0 0 16px;font-size:16px;color:#1B1235;">Hello <strong>{{ $userName }}</strong>,</p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
        Great news! Your <strong>Talaghayan</strong> portal account has been verified by a DILG administrator.
        You now have <strong>full access</strong> to the system.
    </p>

    {{-- CTA button --}}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr>
    <td style="border-radius:28px;background:#0B6B52;">
        <a href="{{ $loginUrl }}" target="_blank"
           style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:28px;">
            Sign in to Talaghayan
        </a>
    </td>
    </tr>
    </table>

    <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#777;">
        You can now submit reports, access resources, and use all features available to your account type.
    </p>
</td>
</tr>

{{-- Footer --}}
<tr>
<td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #f0ecf7;">
    <p style="margin:0;font-size:12px;color:#aaa;">
        &copy; {{ date('Y') }} DILG Makati &middot; Talaghayan Portal
    </p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>
