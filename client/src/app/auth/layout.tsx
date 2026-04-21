export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-1 relative overflow-hidden">
      {/* Subtle noise */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay animate-grain"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.25'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5">
        {/* LEFT: Creative panel (60%) */}
        <aside className="relative lg:col-span-3 min-h-[420px] lg:min-h-screen overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
          {/* Animated gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#060614] via-[#070a1c] to-[#050511]" />
          <div className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full bg-primary/20 blur-3xl animate-floaty" />
          <div
            className="absolute -bottom-28 -right-28 w-[560px] h-[560px] rounded-full bg-info/10 blur-3xl animate-floaty"
            style={{ animationDelay: '1.25s' }}
          />

          {/* Glowing grid */}
          <div className="absolute inset-0 opacity-[0.22]">
            <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(99,102,241,.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,.12)_1px,transparent_1px)] [background-size:56px_56px] animate-grid" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
          </div>

          {/* Floating micro elements */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-20 left-10 text-ink-3/60 font-mono text-xs animate-floaty">
              {'<'}bug{' />'}
            </div>
            <div
              className="absolute top-36 left-28 text-ink-3/50 font-mono text-xs animate-floaty"
              style={{ animationDelay: '.8s' }}
            >
              {'{'} qa: true {'}'}
              <span className="inline-block w-[6px] h-[12px] bg-primary/80 align-[-2px] ml-1 rounded-sm animate-cursor" />
            </div>
            <div
              className="absolute bottom-24 left-16 text-ink-3/50 font-mono text-xs animate-floaty"
              style={{ animationDelay: '1.6s' }}
            >
              console.log("ship it")
            </div>
            <div
              className="absolute bottom-16 left-40 text-ink-3/50 font-mono text-xs animate-floaty"
              style={{ animationDelay: '2.1s' }}
            >
              [ ] reproduce
            </div>
          </div>

          <div className="relative h-full p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L4 7v5c0 5.25 3.4 10.15 8 11.35C16.6 22.15 20 17.25 20 12V7L12 2z"
                    fill="rgb(var(--primary))"
                    fillOpacity=".18"
                    stroke="rgb(var(--primary))"
                    strokeWidth="1.5"
                  />
                  <circle cx="12" cy="12" r="3" fill="rgb(var(--primary))" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">BugHive</div>
                <div className="text-[11px] text-ink-3">Quality, quantified.</div>
              </div>
            </div>

            {/* Quote */}
            <div className="max-w-xl mt-10 lg:mt-0">
              <p className="text-[11px] tracking-widest uppercase text-ink-3 mb-4">A friendly reminder</p>
              <blockquote className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.08] tracking-tight text-ink-1">
                “Every bug is a story.
                <br />
                Great teams make sure it has a happy ending.”
              </blockquote>
              <p className="text-sm sm:text-base text-ink-2 mt-5 leading-7">
                Ship with confidence: trace issues, share context, and turn “works on my machine” into a reproducible fix.
              </p>

              {/* Abstract illustration */}
              <div className="mt-8 card-inner p-4 bg-surface-2/40 backdrop-blur border border-border/70">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold">Signal over noise</p>
                    <p className="text-[11px] text-ink-3 mt-1">
                      Stack traces, screenshots, and one very brave “Steps to reproduce”.
                    </p>
                  </div>
                  <svg width="120" height="44" viewBox="0 0 240 88" fill="none" className="opacity-90">
                    <path
                      d="M10 60C35 42 50 44 72 28C94 12 120 14 142 30C164 46 185 46 230 18"
                      stroke="rgb(var(--primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity=".8"
                    />
                    <path
                      d="M10 72C42 52 60 58 88 44C116 30 140 30 160 46C180 62 200 62 230 40"
                      stroke="rgb(var(--info))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity=".55"
                    />
                    <circle cx="72" cy="28" r="6" fill="rgb(var(--primary))" />
                    <circle cx="160" cy="46" r="6" fill="rgb(var(--info))" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="pt-10 text-[11px] text-ink-3 flex items-center justify-between">
              <span>Deep blue → purple → black.</span>
              <span className="font-mono">v1.0</span>
            </div>
          </div>
        </aside>

        {/* RIGHT: Login panel (40%) */}
        <main className="lg:col-span-2 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  )
}
