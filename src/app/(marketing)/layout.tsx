import { ReactNode } from 'react';

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <header className="border-b">
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <a href="/" className="text-2xl font-bold">
            Safira
          </a>
        </nav>
      </header>
      {children}
    </>
  );
}
