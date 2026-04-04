const AuthShell = ({
  badge,
  title,
  description,
  panelTitle,
  panelDescription,
  panelContent,
  children,
}) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-[-8%] top-[10%] h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl"
          style={{ animation: 'float-orb 8s ease-in-out infinite' }}
        />
        <div
          className="absolute right-[-6%] top-[22%] h-72 w-72 rounded-full bg-sky-300/30 blur-3xl"
          style={{ animation: 'float-orb 10s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-[-6%] left-[18%] h-60 w-60 rounded-full bg-lime-200/35 blur-3xl"
          style={{ animation: 'float-orb 9s ease-in-out infinite' }}
        />
      </div>

      <div className="glass-panel relative z-10 w-full max-w-6xl overflow-hidden rounded-[2rem] border lg:grid lg:grid-cols-[1.04fr_0.96fr]">
        <div className="relative hidden p-10 text-white lg:block" style={{ background: 'var(--gradient-dark)' }}>
          <div className="absolute inset-0 opacity-90">
            <div className="absolute inset-y-0 left-0 w-24 bg-white/5" />
            <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-white/10 bg-white/5" />
          </div>

          <div className="relative">
            <p className="text-sm uppercase tracking-[0.34em] text-emerald-100/75">{badge}</p>
            <h1 className="mt-6 max-w-lg text-4xl font-semibold leading-tight text-white">
              {panelTitle}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">{panelDescription}</p>
            <div className="mt-10">{panelContent}</div>
          </div>
        </div>

        <div className="relative overflow-hidden p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/60" />
          <div className="relative z-10">
            <div className="status-pill border border-emerald-100 bg-emerald-50 text-emerald-700">
              {badge}
            </div>
            <h2 className="mt-6 text-3xl font-bold text-slate-950">{title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
