<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Activate your Talaghayan account</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f0fb;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0fb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(91,60,200,0.08);">

{{-- Header --}}
<tr>
<td style="background:linear-gradient(135deg,#5A18C9,#7B4DFF);padding:28px 32px;text-align:center;">
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">DILG Makati &middot; Talaghayan</h1>
</td>
</tr>

{{-- Body --}}
<tr>
<td style="padding:32px 32px 24px;">
    <p style="margin:0 0 16px;font-size:16px;color:#1B1235;">Hello <strong>{{ $userName }}</strong>,</p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
        The DILG Makati office created your <strong>Talaghayan</strong> portal account for <strong>{{ $where }}</strong>.
        Click the button below to activate your account and set your password.
    </p>

    {{-- CTA button --}}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr>
    <td style="border-radius:28px;background:#7B4DFF;">
        <a href="{{ $link }}" target="_blank"
           style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:28px;">
            Activate my account
        </a>
    </td>
    </tr>
    </table>

    <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#777;">
        This link is valid for <strong>{{ $days }} days</strong>. If it expires, ask the DILG office to send a new one.
    </p>

    <p style="margin:0 0 12px;font-size:13px;color:#777;">
        Your sign-in email: <strong>{{ $userEmail }}</strong>
    </p>

    {{-- Fallback URL --}}
    <p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #ede7fa;font-size:12px;color:#999;word-break:break-all;">
        If the button doesn&rsquo;t work, copy and paste this URL into your browser:<br>
        <a href="{{ $link }}" style="color:#5A18C9;">{{ $link }}</a>
    </p>
</td>
</tr>

{{-- Footer --}}
<tr>
<td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #f0ecf7;">
    <p style="margin:0;font-size:12px;color:#aaa;">
        &copy; {{ date('Y') }} DILG Makati &middot; Talaghayan Portal<br>
        If you did not expect this email, you can safely ignore it.
    </p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>
