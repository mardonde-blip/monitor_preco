'use client';

import { useState, useEffect } from 'react';

interface SchedulerStatus {
  isRunning: boolean;
  message: string;
}

export default function SchedulerControl() {
  const [status, setStatus] = useState<SchedulerStatus>({ isRunning: false, message: '' });
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');

  // Verifica o status do scheduler ao carregar o componente
  useEffect(() => {
    checkSchedulerStatus();
  }, []);

  const checkSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/scheduler');
      const data = await response.json();
      
      if (data.success) {
        setStatus({ isRunning: data.isRunning, message: data.message });
      }
    } catch (error) {
      console.error('Erro ao verificar status do scheduler:', error);
    }
  };

  const controlScheduler = async (action: 'start' | 'stop' | 'manual') => {
    setLoading(true);
    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action, 
          intervalMinutes: action === 'start' ? intervalMinutes : undefined 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus({ isRunning: data.isRunning, message: data.message });
        if (action === 'manual') {
          setLastCheck(new Date().toLocaleString('pt-BR'));
        }
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao controlar scheduler:', error);
      alert('Erro ao controlar scheduler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        🤖 Monitoramento Automático
      </h2>
      
      {/* Status do Scheduler */}
      <div className="mb-4 p-3 rounded-md bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            status.isRunning ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="font-medium">
            Status: {status.isRunning ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <p className="text-sm text-gray-600">{status.message}</p>
        {lastCheck && (
          <p className="text-xs text-gray-500 mt-1">
            Última verificação manual: {lastCheck}
          </p>
        )}
      </div>

      {/* Configuração de Intervalo */}
      {!status.isRunning && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Intervalo de Verificação (minutos)
          </label>
          <input
            type="number"
            min="5"
            max="1440"
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 60)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="60"
          />
          <p className="text-xs text-gray-500 mt-1">
            Recomendado: 60 minutos (1 hora) para evitar sobrecarga nos sites
          </p>
        </div>
      )}

      {/* Botões de Controle */}
      <div className="flex gap-3 flex-wrap">
        {!status.isRunning ? (
          <button
            onClick={() => controlScheduler('start')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              '▶️'
            )}
            Iniciar Monitoramento
          </button>
        ) : (
          <button
            onClick={() => controlScheduler('stop')}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              '⏹️'
            )}
            Parar Monitoramento
          </button>
        )}
        
        <button
          onClick={() => controlScheduler('manual')}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            '🔄'
          )}
          Verificar Agora
        </button>
        
        <button
          onClick={checkSchedulerStatus}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            '📊'
          )}
          Atualizar Status
        </button>
      </div>

      {/* Informações Importantes */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Informações Importantes:</h3>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• O monitoramento automático funciona apenas enquanto a aplicação estiver rodando</li>
          <li>• Intervalos muito baixos podem sobrecarregar os sites e causar bloqueios</li>
          <li>• Certifique-se de configurar o Telegram antes de iniciar o monitoramento</li>
          <li>• Para monitoramento 24/7, considere fazer deploy em um servidor</li>
        </ul>
      </div>
    </div>
  );
}