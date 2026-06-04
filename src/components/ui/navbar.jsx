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
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl rounded-full border border-gray-200 dark:border-[#2A2A2A] bg-white/70 dark:bg-[#121212]/70 backdrop-blur-md shadow-sm transition-colors">
      <div className="mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
        
        {/* Logo Section */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#EDAE48] to-[#D1495B] text-white transition-transform duration-300 group-hover:-rotate-3 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-[#EAEAEA]">
              True Feedback
            </h1>
          </div>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {session ? (
            <>
              {/* Welcome Text */}
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-[#8A8A8A]">
                  Signed in as
                </span>
                <h2 className="text-sm font-medium text-gray-900 dark:text-[#D1D1D1]">
                  {user.username || user.email}
                </h2>
              </div>
              <ModeToggle />
              {/* Logout Button */}
              <Button
                onClick={() => signOut({ callbackUrl: '/' })}
                variant="outline"
                className="
                  h-9 px-4 rounded-full border border-gray-200 dark:border-[#2A2A2A] bg-transparent text-gray-900 dark:text-[#EAEAEA]
                  hover:border-[#D1495B] hover:text-[#D1495B] hover:bg-transparent
                  transition-colors duration-200
                "
              >
                <LogOut className="h-4 w-4 mr-2 md:mr-0 lg:mr-2" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <ModeToggle />
              <Link href="/sign-in">
                <Button
                  className="
                    h-9 px-6 rounded-full border-0 
                    bg-gradient-to-r from-[#EDAE48] to-[#D1495B] text-white font-medium
                    hover:opacity-90 transition-opacity duration-200
                  "
                >
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