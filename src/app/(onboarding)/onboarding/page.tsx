import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if they already have an org — redirect to dashboard
  const existing = await prisma.organizationMember.findFirst({ where: { userId: user.id } });
  if (existing) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center mb-4">
            <img src="/logo.svg" alt="Flowfiy" width={130} height={40} />
          </div>
          <h1 className="text-2xl font-semibold">Set up your workspace</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Takes 3 minutes. You&apos;ll get 100 free lead generations to start.
          </p>
        </div>
        <OnboardingWizard userId={user.id} />
      </div>
    </div>
  );
}
