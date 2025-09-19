import { randomBytes } from 'crypto'

export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex')
}

export function generateInvitationLink(token: string, baseUrl: string = process.env.NEXTAUTH_URL || 'http://localhost:3000'): string {
  return `${baseUrl}/auth/accept-invitation?token=${token}`
}

export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

export function getInvitationExpirationTime(hours: number = 48): Date {
  const expiration = new Date()
  expiration.setHours(expiration.getHours() + hours)
  return expiration
}

// Email template for invitations
export function getInvitationEmailTemplate(
  name: string,
  inviterName: string,
  invitationLink: string,
  role: string,
  department?: string
): { subject: string; html: string; text: string } {
  const subject = `You've been invited to join the Inventory Management System`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invitation to Join Inventory Management System</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { padding: 20px 0; }
        .button { 
          display: inline-block; 
          background: #007bff; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 4px; 
          margin: 20px 0;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p><strong>${inviterName}</strong> has invited you to join the Inventory Management System.</p>
          
          <h3>Your Account Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Role:</strong> ${role}</li>
            ${department ? `<li><strong>Department:</strong> ${department}</li>` : ''}
          </ul>
          
          <p>To complete your registration and set up your account, please click the button below:</p>
          
          <a href="${invitationLink}" class="button">Accept Invitation</a>
          
          <p><strong>Important:</strong> This invitation will expire in 48 hours. If you don't accept it by then, you'll need to request a new invitation.</p>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${invitationLink}</p>
        </div>
        <div class="footer">
          <p>If you didn't expect this invitation, please ignore this email.</p>
          <p>This is an automated message from the Inventory Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    You've been invited to join the Inventory Management System
    
    Hello ${name},
    
    ${inviterName} has invited you to join the Inventory Management System.
    
    Your Account Details:
    - Name: ${name}
    - Role: ${role}
    ${department ? `- Department: ${department}` : ''}
    
    To complete your registration, visit this link:
    ${invitationLink}
    
    Important: This invitation will expire in 48 hours.
    
    If you didn't expect this invitation, please ignore this email.
  `

  return { subject, html, text }
}
