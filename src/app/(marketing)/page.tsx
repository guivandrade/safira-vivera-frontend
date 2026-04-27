import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vívera — Dashboard de Campanhas',
  description: 'Análise integrada de Meta Ads e Google Ads em uma só plataforma.',
  openGraph: {
    title: 'Vívera — Dashboard de Campanhas',
    description: 'Análise integrada de Meta Ads e Google Ads em uma só plataforma.',
    type: 'website',
  },
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-5xl font-bold mb-4 text-gray-900">Vívera</h1>
          <p className="text-xl text-gray-600 mb-2">
            Dashboard de Campanhas
          </p>
          <p className="text-gray-500">
            Análise integrada de Meta Ads e Google Ads
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <Link
            href="/campanhas"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
          >
            Acessar Dashboard →
          </Link>

          <p className="text-sm text-gray-500 pt-4">
            Visualize métricas de campanhas em tempo real
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 pt-12 text-left">
          <div>
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900">Análise Completa</h3>
            <p className="text-sm text-gray-600">Dados unificados de ambas plataformas</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🔄</div>
            <h3 className="font-semibold text-gray-900">Tempo Real</h3>
            <p className="text-sm text-gray-600">Atualização automática dos dados</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🔐</div>
            <h3 className="font-semibold text-gray-900">Seguro</h3>
            <p className="text-sm text-gray-600">Autenticação segura com OAuth</p>
          </div>
        </div>
      </div>
    </main>
  );
}
