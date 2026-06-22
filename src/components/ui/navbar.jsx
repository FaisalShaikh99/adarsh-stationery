'use client'

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { Button } from "./button"
import { Sparkles, LogOut } from "lucide-react"
import { ModeToggle } from "./theme-provider"
import { usePathname } from "next/navigation"

const Navbar = () => {
  const { data: session } = useSession()
  const user = session?.user
  const pathname = usePathname()

  if (
    pathname.startsWith('/verify') || 
    pathname.startsWith('/sign-in') || 
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/u/')
  ) {
    return null;
  }

  return (
    <nav className="fixed top-4 left-1/2 z-50 w-[95%] max-w-5xl -translate-x-1/2 rounded-full border border-black/5 bg-white/75 backdrop-blur-xl shadow-sm transition-colors dark:border-white/10 dark:bg-black/60">
      <div className="mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-lg shadow-brand-purple/15 transition-transform duration-300 group-hover:-rotate-3">
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-black dark:text-white">
              Adarsh Stationery
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <div className="mr-2 hidden flex-col items-end md:flex">
                <span className="text-[10px] uppercase tracking-wider text-black/55 dark:text-white/55">
                  Signed in as
                </span>
                <h2 className="text-sm font-medium text-black dark:text-white">
                  {user.username || user.email}
                </h2>
              </div>
              <ModeToggle />
              <Button
                onClick={() => signOut({ callbackUrl: '/' })}
                variant="outline"
                className="h-9 rounded-full border border-black/10 bg-transparent text-black hover:border-brand-purple hover:text-brand-purple dark:border-white/10 dark:text-white dark:hover:border-brand-purple"
              >
                <LogOut className="mr-2 h-4 w-4 md:mr-0 lg:mr-2" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <ModeToggle />
              <Link href="/sign-in">
                <Button className="h-9 rounded-full bg-brand-gradient px-6 text-white hover:opacity-90">
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar