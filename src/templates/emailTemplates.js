export const assessmentInviteTemplate = (assessment, inviteLink) => ({
  subject: `You've been invited to take an assessment: ${assessment.title}`,
  html: `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://yourdomain.com/logo.png" alt="Assessly Logo" style="height: 50px;"/>
      </div>
      <h2 style="color: #2d3748;">Assessment Invitation</h2>
      <p>You've been invited to complete the assessment:</p>
      <h3 style="color: #556cd6;">${assessment.title}</h3>
      ${assessment.description ? `<p>${assessment.description}</p>` : ''}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" 
           style="background-color: #556cd6; color: white; 
                  padding: 12px 24px; border-radius: 8px; 
                  text-decoration: none; font-weight: 600;">
          Start Assessment
        </a>
      </div>
      <p style="font-size: 14px; color: #718096;">
        This link will expire in 7 days. If you didn't request this, please ignore this email.
      </p>
    </div>
  `,
  text: `You've been invited to take the assessment "${assessment.title}". 
  Click here to begin: ${inviteLink}`
});

export const resetPasswordTemplate = (resetLink) => ({
  subject: 'Reset Your Assessly Password',
  html: `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://yourdomain.com/logo.png" alt="Assessly Logo" style="height: 50px;"/>
      </div>
      <h2 style="color: #2d3748;">Password Reset</h2>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #556cd6; color: white; 
                  padding: 12px 24px; border-radius: 8px; 
                  text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 14px; color: #718096;">
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
      </p>
    </div>
  `,
  text: `Click here to reset your password: ${resetLink}`
});
