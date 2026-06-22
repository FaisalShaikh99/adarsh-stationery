import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-brand-gradient opacity-7" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_18%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.12),transparent_18%)]" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-24 lg:px-12">
        <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center rounded-full border border-brand-purple/20 bg-brand-purple/10 px-4 py-1.5 text-sm font-medium text-brand-purple dark:text-brand-secondary">
              Premium stationery system
            </span>
            <h1 className="text-5xl font-semibold tracking-tight text-black dark:text-white sm:text-6xl">
              Build your <span className="bg-brand-gradient bg-clip-text text-transparent">cinematic</span> brand experience.
            </h1>
            <p className="text-lg leading-8 text-black/75 dark:text-white/80">
              Manage inventory, team access, and customer operations with a clean dashboard that feels fast, premium, and visually focused.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/admin/sign-in"
                className="inline-flex items-center justify-center rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-purple/20 transition hover:scale-[1.01]"
              >
                Get Started
              </Link>
              <Link
                href="#"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-semibold text-black transition hover:bg-white dark:border-white/10 dark:bg-black/40 dark:text-white"
              >
                Explore Features
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-brand-gradient opacity-15 blur-2xl" />
            <div className="relative rounded-3xl border border-black/5 bg-white/80 p-6 shadow-2xl shadow-brand-purple/10 backdrop-blur-xl dark:border-white/10 dark:bg-black/50">
              <div className="flex items-center justify-between border-b border-black/5 pb-4 dark:border-white/10">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/50 dark:text-white/50">Overview</p>
                  <h2 className="mt-1 text-2xl font-semibold text-black dark:text-white">Sales Pulse</h2>
                </div>
                <span className="rounded-full bg-brand-gradient px-3 py-1 text-sm font-medium text-white">
                  +12.4%
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">
                  <p className="text-sm text-black/60 dark:text-white/60">Revenue</p>
                  <p className="mt-2 text-2xl font-semibold text-black dark:text-white">₹2.4L</p>
                </div>
                <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">
                  <p className="text-sm text-black/60 dark:text-white/60">Orders</p>
                  <p className="mt-2 text-2xl font-semibold text-black dark:text-white">1,284</p>
                </div>
                <div className="rounded-2xl bg-brand-gradient p-4 text-white">
                  <p className="text-sm text-white/80">Growth</p>
                  <p className="mt-2 text-2xl font-semibold">89%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
