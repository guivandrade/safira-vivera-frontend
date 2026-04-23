import { ReactNode } from 'react';
import Link from 'next/link';

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <header className="border-b">
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold">
            Safira
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
}
