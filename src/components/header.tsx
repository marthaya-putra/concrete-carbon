import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Concrete Carbon
        </Link>
        <p className="ml-2 hidden text-sm text-muted-foreground sm:inline">
          Low-Carbon Concrete Comparison Tool
        </p>
        <nav className="ml-auto flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Discover
          </Link>
        </nav>
      </div>
    </header>
  );
}
