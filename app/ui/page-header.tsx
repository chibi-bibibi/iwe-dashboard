export default function PageHeader({
  root,
  parent,
  title,
  className,
}: {
  root?: string;
  parent?: string;
  title: string;
  className?: string;
}) {
  const breadcrumb = [root, parent].filter(Boolean).join(" / ");

  return (
    <div
      className={`mb-8 flex flex-col gap-1${className ? ` ${className}` : ""}`}
    >
      {breadcrumb && (
        <p className="hidden sm:block text-xs font-medium tracking-widest uppercase text-muted-foreground">
          {breadcrumb}
        </p>
      )}
      <h1 className="hidden sm:block text-2xl font-bold leading-tight text-foreground">
        {title}
      </h1>
    </div>
  );
}
