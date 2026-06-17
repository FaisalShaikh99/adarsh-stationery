
export async function sendInvitationEmail(email, role, inviteLink, message) {
  try {
    const emailJSData = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        role: role,
        message: message || "No custom message attached.",
        invite_link: inviteLink,
      },
    };

    const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailJSData),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("EmailJS Service Error:", errorText);
      return { success: false, message: "Failed to deliver email via EmailJS" };
    }

    return { success: true, message: "Invitation email sent successfully" };
      
  } catch (emailError) {
    console.error("Error sending Invitation email:", emailError);
    return { success: false, message: "Failed to send invitation email" };
  }
}