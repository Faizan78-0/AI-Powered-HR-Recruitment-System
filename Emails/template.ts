export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Account</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
</head>

<body style="margin:0; padding:0; background:#f5f7fa; font-family:'Inter', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 10px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(90deg,#4f46e5,#6366f1); padding:32px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:26px; font-weight:600;">Verify Your Email</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px; color:#333;">
              <p style="margin:0 0 16px;">Hello,</p>
              <p style="margin:0 0 18px;">
                Thanks for joining our AI-Powered Recruitment System. Please confirm your email using the verification code below:
              </p>

              <div style="text-align:center; margin:30px 0;">
                <span style="display:inline-block; background:#4f46e5; color:#fff; padding:16px 32px; font-size:28px; font-weight:600; border-radius:10px; letter-spacing:4px;">
                  {verificationCode}
                </span>
              </div>

              <p style="margin:0 0 16px;">This code will expire in 15 minutes.</p>
              <p style="margin:0 0 16px;">If you did not request this, please disregard this message.</p>

              <p style="margin:24px 0 0;">Regards,<br/>AI Recruitment System</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f0f0; padding:14px; text-align:center; font-size:12px; color:#888;">
              This is an automated message. Please do not reply.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;


export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome Aboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
</head>

<body style="margin:0; padding:0; background:#f5f7fa; font-family:'Inter', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 10px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(90deg,#10b981,#059669); padding:32px; text-align:center;">
              <h1 style="color:#fff; margin:0; font-size:26px;">Welcome to the AI HR Recruitment System</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px; color:#333;">
              <p style="margin:0 0 16px;">Hello,</p>
              <p style="margin:0 0 16px;">
                Your account has been successfully created. You now have access to a modern, AI-powered talent acquisition platform designed to streamline hiring workflows.
              </p>

              <p style="margin:0 0 12px;">You can now:</p>
              <ul style="margin:0 0 18px; padding-left:20px;">
                <li>Manage job postings and candidate pipelines</li>
                <li>Review AI-generated candidate insights</li>
                <li>Schedule interviews and manage communication</li>
              </ul>

              <p style="margin:0;">We’re excited to support your recruitment operations.<br/>AI Recruitment System Team</p>
            </td>
          </tr>

          <tr>
            <td style="background:#f0f0f0; padding:14px; text-align:center; font-size:12px; color:#888;">
              You are receiving this email because you created an account.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;


export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
</head>

<body style="margin:0; padding:0; background:#f5f7fa; font-family:'Inter', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 10px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(90deg,#4caf50,#45a049); padding:32px; text-align:center;">
              <h1 style="color:white; margin:0; font-size:26px;">Reset Your Password</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px; color:#333;">
              <p>Hello,</p>
              <p>We received a password reset request for your account. If you did not request this, please ignore this message.</p>

              <div style="text-align:center; margin:32px 0;">
                <a href="{resetURL}" style="background:#4caf50; color:white; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:600;">
                  Reset Password
                </a>
              </div>

              <p>This link will expire in 1 hour for security reasons.</p>

              <p style="margin:24px 0 0;">Regards,<br/>AI Recruitment System</p>
            </td>
          </tr>

          <tr>
            <td style="background:#f0f0f0; padding:14px; text-align:center; font-size:12px; color:#888;">
              Automated message — please do not reply.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

export const PASSWORD_UPDATE_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Updated</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
</head>

<body style="margin:0; padding:0; background:#f5f7fa; font-family:'Inter', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 10px;">

        <table width="600" cellpadding="0" cellspacing="0" 
          style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(90deg,#22c55e,#16a34a); padding:32px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:26px; font-weight:600;">
                Password Updated Successfully
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px; color:#333;">
              <p style="margin:0 0 16px;">Hello,</p>
              <p style="margin:0 0 16px;">
                This message is to confirm that your account password has been updated successfully.
              </p>

              <div style="text-align:center; margin:30px 0;">
                <div style="
                  width:64px;
                  height:64px;
                  background:#22c55e;
                  color:#ffffff;
                  border-radius:50%;
                  display:inline-flex;
                  align-items:center;
                  justify-content:center;
                  font-size:32px;
                  font-weight:600;">
                  ✓
                </div>
              </div>

              <p style="margin:20px 0 12px; font-weight:600;">Security Recommendations:</p>
              <ul style="margin:0 0 16px; padding-left:20px;">
                <li>Use a strong and unique password not used elsewhere</li>
                <li>Enable two-factor authentication when available</li>
                <li>Avoid sharing your login credentials with anyone</li>
              </ul>

              <p style="margin:0;">Your security is important to us.  
              If you did not make this change, please contact support immediately.</p>

              <p style="margin:24px 0 0;">Regards,<br/>AI Recruitment System</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f0f0; padding:14px; text-align:center; font-size:12px; color:#888;">
              This is an automated notification. Please do not reply.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;



export const APPLICATION_STATUS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Update</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
</head>

<body style="margin:0; padding:0; background:#f5f7fa; font-family:'Inter', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 10px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(90deg,#3b82f6,#2563eb); padding:32px; text-align:center;">
              <h1 style="color:#fff; margin:0; font-size:26px;">Application Status Update</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px; color:#333;">
              <p style="margin:0 0 16px;">Hello {candidateName},</p>
              <p style="margin:0 0 18px;">
                We wanted to update you regarding your application for the role of <strong>{jobTitle}</strong>.
              </p>

              <p style="margin:0 0 18px;">
                Current status: <strong>{status}</strong>
              </p>

              <p style="margin:0 0 16px;">We will notify you as soon as the next step becomes available.</p>

              <p style="margin:24px 0 0;">Regards,<br/>AI Recruitment System</p>
            </td>
          </tr>

          <tr>
            <td style="background:#f0f0f0; padding:14px; text-align:center; font-size:12px; color:#888;">
              You are receiving this because you applied for a job through our platform.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;


export const INTERVIEW_INVITE_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Interview Invitation</title>
</head>

<body style="margin:0; padding:0; background:#f5f7fa; font-family:'Inter', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 10px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(90deg,#9333ea,#7e22ce); padding:32px; text-align:center;">
              <h1 style="color:white; margin:0; font-size:26px;">Interview Invitation</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px; color:#333;">
              <p>Hello {candidateName},</p>
              <p>
                We are pleased to invite you to an interview for the position of <strong>{jobTitle}</strong>.
              </p>

              <p style="margin:18px 0;"><strong>Date:</strong> {date}</p>
              <p style="margin:0 0 18px;"><strong>Time:</strong> {time}</p>
              <p style="margin:0 0 18px;"><strong>Format:</strong> {interviewMode}</p>

              <p>Please confirm your availability using the link below:</p>

              <div style="text-align:center; margin:32px 0;">
                <a href="{confirmationURL}" style="background:#9333ea; color:white; padding:14px 28px; text-decoration:none; border-radius:8px; font-weight:600;">
                  Confirm Interview
                </a>
              </div>

              <p>We look forward to speaking with you.</p>

              <p style="margin:24px 0 0;">Regards,<br/>AI Recruitment System</p>
            </td>
          </tr>

          <tr>
            <td style="background:#f0f0f0; padding:14px; text-align:center; font-size:12px; color:#888;">
              Automated message — please do not reply.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;


