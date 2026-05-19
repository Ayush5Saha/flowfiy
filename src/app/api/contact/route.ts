import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: "Flowfiy Contact <onboarding@resend.dev>",
      to: ["sahaayush6000@gmail.com"],
      replyTo: email,
      subject: `[${subject}] from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#09090f;color:#e4e4e7;border-radius:12px;">
          <h2 style="color:#a855f7;margin-top:0;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#a1a1aa;width:100px;">Name</td>
              <td style="padding:8px 0;color:#ffffff;font-weight:500;">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#a1a1aa;">Email</td>
              <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#a855f7;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#a1a1aa;">Subject</td>
              <td style="padding:8px 0;color:#ffffff;">${subject}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #27272a;margin:16px 0;" />
          <p style="color:#a1a1aa;margin-bottom:8px;">Message:</p>
          <p style="color:#ffffff;white-space:pre-wrap;background:#18181b;padding:16px;border-radius:8px;border:1px solid #27272a;">${message}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
