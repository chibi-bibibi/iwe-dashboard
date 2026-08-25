import Footer from "../ui/footer";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 flex flex-col">
      <div className="mx-auto max-w-5xl w-full flex-1 pb-2">{children}</div>
    </div>
  );
}
