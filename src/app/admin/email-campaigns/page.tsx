import { requireAdmin } from "@/lib/admin-guard";
import { EmailCampaignClient } from "@/components/admin/EmailCampaignClient";
import { SEGMENTS } from "@/lib/admin/email-recipients";

export const dynamic = "force-dynamic";

export default async function AdminEmailCampaignsPage() {
  await requireAdmin();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-2xl font-bold text-white">Email Campaigns</h1>
          <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20">
            Bulk send
          </span>
        </div>
        <p className="text-zinc-400 text-sm">
          Compose a message, pick a condition (e.g. users without a subscription), preview the audience, then send.
        </p>
      </div>

      <EmailCampaignClient
        segments={SEGMENTS}
        resendConfigured={!!process.env.RESEND_API_KEY}
        fromEmail={process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}
      />
    </div>
  );
}
