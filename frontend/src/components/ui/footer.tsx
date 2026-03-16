import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
              OBP
            </span>
            <span>OpenBooking Protocol</span>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/search" className="hover:text-foreground transition-colors">
              Search
            </Link>
            <Link
              href="https://github.com/openbooking-protocol/obp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
            <Link href="/dashboard/login" className="hover:text-foreground transition-colors">
              Providers
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            Open source · AGPL-3.0
          </p>
        </div>
      </div>
    </footer>
  );
}
