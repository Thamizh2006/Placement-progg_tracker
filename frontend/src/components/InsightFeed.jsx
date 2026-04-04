import { formatDistanceToNow } from 'date-fns';

const getToneClasses = (priority = 'medium') => {
  if (priority === 'high') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  if (priority === 'low') {
    return 'border-slate-200 bg-slate-50 text-slate-600';
  }

  return 'border-sky-200 bg-sky-50 text-sky-700';
};

const InsightFeed = ({
  title,
  subtitle,
  items = [],
  emptyLabel,
  getPrimaryText,
  getSecondaryText,
  getMetaText,
  getPriority,
}) => (
  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{title}</p>
    <h2 className="mt-2 text-2xl font-semibold text-slate-950">{subtitle}</h2>
    <div className="mt-6 space-y-3">
      {items.length === 0 && (
        <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">{emptyLabel}</div>
      )}
      {items.map((item) => (
        <div key={item._id || item.id || item.createdAt || item.title} className="rounded-3xl border border-slate-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{getPrimaryText(item)}</p>
              <p className="mt-1 text-sm text-slate-600">{getSecondaryText(item)}</p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getToneClasses(
                getPriority?.(item)
              )}`}
            >
              {getMetaText(item)}
            </span>
          </div>
          {item.createdAt && (
            <p className="mt-3 text-xs text-slate-400">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default InsightFeed;
