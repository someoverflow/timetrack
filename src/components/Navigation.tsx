import LogOutButton from "./LogOutButton";
import prisma from "@/lib/prisma";
import { Home, Shield, ChevronDown, User, History } from "lucide-react";
import { getServerSession } from "next-auth";
import ActiveLink from "./ActiveLink";

export default async function Navigation({
  toggle = false,
  children,
}: {
  toggle?: boolean;
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  const user = await prisma.user.findUnique({
    where: {
      username: session?.user?.name + "",
    },
    select: {
      username: true,
      role: true,
    },
  });

  return (
    <main>
      <div className="flex flex-row">
        <div className={!toggle ? "sm:w-full sm:max-w-[18rem]" : ""}>
          <input
            type="checkbox"
            id="sidebar-mobile-fixed"
            className="sidebar-state"
          />
          <label
            htmlFor="sidebar-mobile-fixed"
            className="sidebar-overlay"
          ></label>
          <aside
            className={`sidebar sidebar-fixed-left sidebar-mobile h-full justify-start ${
              !toggle ? "max-sm:fixed" : "fixed"
            } ${
              !toggle ? "max-sm:-translate-x-full" : "-translate-x-full"
            } font-mono`}
          >
            <section className="sidebar-title items-center p-4">
              <div className="flex flex-col text-xl">
                <span>Time Tracker</span>
                <span className="text-xs font-normal text-content2 first-letter:uppercase">
                  {user?.role}
                </span>
              </div>
            </section>
            <div className="divider my-0"></div>
            <section className="sidebar-content pt-0">
              <nav className="menu rounded-md">
                <section className="menu-section px-4">
                  <ul className="menu-items">
                    <ActiveLink
                      href="/"
                      className="menu-item"
                      activeClassName="menu-active"
                    >
                      <Home className="h-5 w-5 opacity-75" />
                      <span>Home</span>
                    </ActiveLink>

                    <ActiveLink
                      href="/history"
                      className="menu-item"
                      activeClassName="menu-active"
                    >
                      <History className="h-5 w-5 opacity-75" />
                      <span>History</span>
                    </ActiveLink>

                    {user?.role == "admin" && (
                      <li>
                        <input
                          type="checkbox"
                          id="sidebarMenuAdmin"
                          className="menu-toggle"
                          defaultChecked
                        />
                        <label
                          className="menu-item justify-between"
                          htmlFor="sidebarMenuAdmin"
                        >
                          <div className="flex gap-2">
                            <Shield className="h-5 w-5 opacity-75" />
                            <span>Admin</span>
                          </div>

                          <span className="menu-icon">
                            <ChevronDown className="h-5 w-5" />
                          </span>
                        </label>

                        <div className="menu-item-collapse">
                          <div className="min-h-0">
                            <ActiveLink
                              href="/admin/user"
                              className="menu-item ml-6"
                              activeClassName="menu-active"
                            >
                              Users
                            </ActiveLink>
                            <ActiveLink
                              href="/admin/chip"
                              className="menu-item ml-6"
                              activeClassName="menu-active"
                            >
                              Chips
                            </ActiveLink>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </section>
              </nav>
            </section>
            <section className="sidebar-footer justify-end pt-2">
              <div className="divider my-0"></div>
              <div className="z-50 flex h-fit w-full">
                <div className="w-full flex flex-row gap-4 p-4 items-center justify-between">
                  <button className="btn btn-circle">
                    <User className="h-7 w-7 text-content2" />
                  </button>

                  <div className="flex flex-col">
                    <span>{user?.username}</span>
                  </div>

                  <LogOutButton />
                </div>
              </div>
            </section>
          </aside>
        </div>

        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}

/*
<label htmlFor="sidebar-mobile-fixed" className="btn-primary btn sm:hidden">
    Open Sidebar
</label>
*/
