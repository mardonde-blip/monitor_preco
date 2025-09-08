'use client';

import { useState } from 'react';

export default function DiagnosticoPage() {
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testarEndpoints = async () => {
    setLoading(true);
    const testes = [];

    // Teste 1: Health check
    try {
      const response = await fetch('/api/health');
      testes.push({
        endpoint: '/api/health',
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      });
    } catch (error) {
      testes.push({
        endpoint: '/api/health',
        status: 'ERROR',
        ok: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    // Teste 2: Test connection
    try {
      const response = await fetch('/api/test-connection');
      testes.push({
        endpoint: '/api/test-connection',
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      });
    } catch (error) {
      testes.push({
        endpoint: '/api/test-connection',
        status: 'ERROR',
        ok: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    // Teste 3: Init DB
    try {
      const response = await fetch('/api/init-db');
      testes.push({
        endpoint: '/api/init-db',
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      });
    } catch (error) {
      testes.push({
        endpoint: '/api/init-db',
        status: 'ERROR',
        ok: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    // Teste 4: Debug DB
    try {
      const response = await fetch('/api/debug-db');
      testes.push({
        endpoint: '/api/debug-db',
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      });
    } catch (error) {
      testes.push({
        endpoint: '/api/debug-db',
        status: 'ERROR',
        ok: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    setResultado({
      timestamp: new Date().toISOString(),
      testes,
      resumo: {
        total: testes.length,
        sucessos: testes.filter(t => t.ok).length,
        erros: testes.filter(t => !t.ok).length
      }
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Diagnóstico do Sistema</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={testarEndpoints}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Testando...' : 'Executar Diagnóstico'}
          </button>
        </div>

        {resultado && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Resultados do Diagnóstico</h2>
            
            <div className="mb-4 p-4 bg-gray-100 rounded">
              <p><strong>Timestamp:</strong> {resultado.timestamp}</p>
              <p><strong>Total de testes:</strong> {resultado.resumo.total}</p>
              <p><strong>Sucessos:</strong> <span className="text-green-600">{resultado.resumo.sucessos}</span></p>
              <p><strong>Erros:</strong> <span className="text-red-600">{resultado.resumo.erros}</span></p>
            </div>

            <div className="space-y-4">
              {resultado.testes.map((teste: any, index: number) => (
                <div key={index} className={`p-4 rounded border-l-4 ${
                  teste.ok ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}>
                  <h3 className="font-semibold">{teste.endpoint}</h3>
                  <p><strong>Status:</strong> {teste.status}</p>
                  <p><strong>OK:</strong> {teste.ok ? 'Sim' : 'Não'}</p>
                  
                  {teste.data && (
                    <div className="mt-2">
                      <strong>Resposta:</strong>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
                        {typeof teste.data === 'string' ? teste.data : JSON.stringify(teste.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {teste.error && (
                    <div className="mt-2">
                      <strong>Erro:</strong>
                      <p className="text-red-600">{teste.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}