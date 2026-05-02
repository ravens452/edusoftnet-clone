export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-[var(--border)]">
      <div className="space-y-1.5 min-w-0">
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight"
          style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
