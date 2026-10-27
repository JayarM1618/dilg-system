<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f8f5ff; font-family: 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; padding:40px 20px;">
    <tr>
      <td style="background-color:#ffffff; border-radius:16px; padding:40px 32px; box-shadow:0 4px 24px rgba(91,24,201,0.08);">
        <div style="text-align:center; margin-bottom:24px;">
          <div style="display:inline-block; background-color:#FFF8E6; border-radius:50%; width:56px; height:56px; line-height:56px; text-align:center;">
            <span style="font-size:28px;">🔒</span>
          </div>
        </div>

        <h1 style="margin:0 0 8px; font-size:22px; font-weight:700; color:#1B1235; text-align:center;">
          Password Expired
        </h1>

        <p style="margin:0 0 20px; font-size:14px; color:#64748b; text-align:center; line-height:1.6;">
          Hi <strong style="color:#1B1235;">{{ $user->name }}</strong>,
        </p>

        <p style="margin:0 0 20px; font-size:14px; color:#475569; line-height:1.7;">
          Your Talaghayan Portal password has expired as part of our 7-day security rotation policy.
          You will be asked to create a new password the next time you sign in.
        </p>

        <div style="background-color:#FFF8E6; border:1px solid #F5D980; border-radius:12px; padding:16px; margin-bottom:24px;">
          <p style="margin:0; font-size:13px; color:#7A5B00; line-height:1.6;">
            <strong>Important:</strong> Your new password cannot be the same as any of your last 5 passwords.
          </p>
        </div>

        <div style="text-align:center; margin-bottom:24px;">
          <a href="{{ rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/') }}/login"
             style="display:inline-block; background-color:#7B4DFF; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:12px; font-size:14px; font-weight:700;">
            Sign In & Change Password →
          </a>
        </div>

        <hr style="border:none; border-top:1px solid #EDE7FA; margin:24px 0;">

        <p style="margin:0; font-size:11px; color:#94a3b8; text-align:center; line-height:1.5;">
          Department of the Interior and Local Government — Makati City Field Office<br>
          This is an automated security notification.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
