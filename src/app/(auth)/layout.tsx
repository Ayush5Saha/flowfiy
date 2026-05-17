import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <Image src="/logo.svg" alt="Flowfiy" width={120} height={36} priority />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
