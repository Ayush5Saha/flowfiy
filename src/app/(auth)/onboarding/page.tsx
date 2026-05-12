import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Set up your workspace — Flowfiy",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If already has an org, skip onboarding
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
  });

  if (membership) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Flowfiy</h1>
          <p className="text-muted-foreground">
            Let&apos;s set up your workspace in a few quick steps
          </p>
        </div>
        <OnboardingWizard userId={user.id} />
      </div>
    </div>
  );
}
