import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api-response";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return errorResponse("Email and role are required", 400);
    }

    // Verify user exists in the database with the requested role
    const userResult = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(and(eq(users.email, email.trim().toLowerCase()), eq(users.role, role)))
      .limit(1);

    if (userResult.length === 0) {
      return errorResponse("No account found with this email and role", 404);
    }

    const user = userResult[0];
    const resetToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

    // Check if there's already a pending request for this user and mark it as REJECTED/expired
    await db
      .update(passwordResetRequests)
      .set({ status: "REJECTED" })
      .where(
        and(
          eq(passwordResetRequests.userId, user.id),
          eq(passwordResetRequests.status, "PENDING")
        )
      );

    // Create a new password reset request record
    await db.insert(passwordResetRequests).values({
      userId: user.id,
      email: user.email,
      role: role,
      status: "PENDING",
      resetToken: resetToken,
      tokenExpiry: tokenExpiry,
    });

    // Generate reset password URL link
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const resetLink = `${origin}/reset-password?token=${resetToken}`;

    console.log(`[PASSWORD RESET REQUEST] User: ${user.name} (${user.email}) - Link: ${resetLink}`);

    // Send email via SMTP if configured, otherwise fallback to standard terminal output
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    let emailSent = false;
    let mailError = "";

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: parseInt(smtpPort) === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: `"LMS Support" <${smtpUser}>`,
          to: user.email,
          subject: "Password Reset Request - LMS Portal",
          text: `Hello ${user.name},\n\nYou requested a password reset for your LMS account.\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link is valid for 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nLMS Admin Team`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
              <h2 style="color: #7c3aed;">LMS Portal Password Reset</h2>
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>You requested a password reset for your LMS account. Please click the button below to set a new password:</p>
              <div style="margin: 24px 0;">
                <a href="${resetLink}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p style="font-size: 12px; color: #64748b;">Or copy and paste this link into your browser: <br/> <a href="${resetLink}">${resetLink}</a></p>
              <p style="font-size: 12px; color: #64748b; margin-top: 20px;">This link will expire in 1 hour. If you did not make this request, you can safely ignore this email.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (err: any) {
        console.error("Nodemailer SMTP failed:", err);
        mailError = err.message || "SMTP transmission error";
      }
    }

    return successResponse(
      { 
        emailSent, 
        smtpConfigured: !!(smtpHost && smtpUser),
        message: emailSent 
          ? "A password reset link has been sent to your Gmail." 
          : "Reset request registered. (Mail server is not configured in development, check logs for link)."
      },
      "Password reset request created successfully",
      200
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse("Internal server error", 500);
  }
}
