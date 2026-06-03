import { resend } from "@/lib/resend";
import InviteEmail from "@/email_template/inviteEmailTemplate";

export async function sendInvitationEmail(email, role, inviteLink, message) {
  try {
   
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Adarsh Stationery | Team Invitation',
      react: <InviteEmail email={email} role={role} inviteLink={inviteLink} message={message} />
    });

    return { success: true, message: "Invitation email sent successfully" };
     
  } catch (emailError) {
    console.error("Error sending Invitation email:", emailError);
    return { success: false, message: "Failed to send invitation email" };
  }
}