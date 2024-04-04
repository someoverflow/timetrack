// UI
import Navigation from "@/components/navigation";
import ProfileSection from "./profile-section";

// Auth
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Profile() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return redirect("/signin");
  const user = session.user;

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">Profile</p>
          <p className="text-content3 text-md">
            {user.name} aka. {user.tag}
          </p>
        </div>

        <ProfileSection userData={user} />
      </section>
    </Navigation>
  );
}
