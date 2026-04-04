const PageLoader = ({ label = 'Loading workspace...' }) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-panel flex flex-col items-center gap-5 rounded-[1.75rem] border px-10 py-8">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border border-emerald-200/70 bg-white/80 shadow-lg" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-lime-300 opacity-80 blur-[1px]" />
        </div>
        <p className="text-center text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
