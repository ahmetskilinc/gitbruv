import { BrandMark } from "@/components/brand-mark"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-[400px] flex-col items-center">
        <BrandMark className="mb-10 [&>span]:text-xl" />
        {children}
      </div>
    </div>
  )
}
