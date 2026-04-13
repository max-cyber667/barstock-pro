import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { Role } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "staff") as Role;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <TopBar profile={profile} />
      <main className="lg:ml-64 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
      </main>
      <BottomNav role={role} />
    </div>
  );
}
