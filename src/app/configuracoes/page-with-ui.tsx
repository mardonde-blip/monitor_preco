'use client';

import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, TestTube, Shield, CheckCircle, XCircle, MessageCircle, Info } from 'lucide-react';

interface TelegramConfig {
  hasToken: boolean;
  hasChatId: boolean;
  enabled: boolean;
  tokenPreview?: string;
}

export default function ConfiguracoesPage() {
  // TODO: Implementar autenticação real
  // const { data: session, status } = useSession();
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    botToken: '',
    chatId: '',
    enabled: false
  });

  // Carregar configurações atuais
  useEffect(() => {
    // TODO: Implementar verificação de autenticação real
    // if (loading) return;
    // if (!session) {
    //   router.push('/login');
    //   return;
    // }
    
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/user/telegram');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setFormData(prev => ({
          ...prev,
          enabled: data.enabled
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setConfig(data);
        // Limpar campos após salvar
        setFormData(prev => ({
          botToken: '',
          chatId: '',
          enabled: prev.enabled
        }));
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!formData.botToken || !formData.chatId) {
      setMessage({ type: 'error', text: 'Preencha o Bot Token e Chat ID para testar' });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          enabled: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Teste enviado! Verifique seu Telegram.' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao testar configuração' });
    } finally {
      setTesting(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Tem certeza que deseja remover as configurações do Telegram?')) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/telegram', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setConfig({ hasToken: false, hasChatId: false, enabled: false });
        setFormData({ botToken: '', chatId: '', enabled: false });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao remover configurações' });
    } finally {
      setSaving(false);
    }
  };

  // TODO: Implementar verificação de autenticação real
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   );
  // }

  // if (!session) {
  //   return (
  //     <div className="container mx-auto p-6">
  //       <Alert>
  //         <Shield className="h-4 w-4" />
  //         <AlertDescription>
  //           Você precisa estar logado para acessar as configurações.
  //         </AlertDescription>
  //       </Alert>
  //     </div>
  //   );
  // }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências de notificação e configurações pessoais.
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Notificações do Telegram
          </CardTitle>
          <CardDescription>
            Configure seu bot pessoal do Telegram para receber notificações de preços.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status atual */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Status Atual</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {config?.hasToken ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Bot Token: {config?.hasToken ? `Configurado ${config.tokenPreview}` : 'Não configurado'}</span>
              </div>
              <div className="flex items-center gap-2">
                {config?.hasChatId ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Chat ID: {config?.hasChatId ? 'Configurado' : 'Não configurado'}</span>
              </div>
              <div className="flex items-center gap-2">
                {config?.enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span>Notificações: {config?.enabled ? 'Habilitadas' : 'Desabilitadas'}</span>
              </div>
            </div>
          </div>

          {/* Configuração */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled" className="text-base font-medium">
                Habilitar notificações do Telegram
              </Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {formData.enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="botToken">Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={formData.botToken}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, botToken: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chatId">Chat ID</Label>
                  <Input
                    id="chatId"
                    placeholder="123456789"
                    value={formData.chatId}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, chatId: e.target.value }))
                    }
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Como obter suas credenciais:</strong><br />
                    1. Abra o Telegram e procure por @BotFather<br />
                    2. Digite /newbot e siga as instruções<br />
                    3. Copie o token fornecido<br />
                    4. Envie uma mensagem para seu bot<br />
                    5. Acesse: https://api.telegram.org/bot&lt;SEU_TOKEN&gt;/getUpdates<br />
                    6. Procure pelo &quot;chat&quot;:&#123;&quot;id&quot;: NUMERO&#125; e use esse número como Chat ID
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    onClick={handleTest}
                    disabled={testing || !formData.botToken || !formData.chatId}
                    variant="outline"
                  >
                    {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Testar Configuração
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>

            {(config?.hasToken || config?.hasChatId) && (
              <Button
                onClick={handleRemove}
                disabled={saving}
                variant="destructive"
              >
                Remover Configurações
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}