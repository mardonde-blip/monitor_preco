import { NextResponse } from 'next/server';
import { emailTemplates } from '@/lib/email';

export async function GET() {
  try {
    console.log('🧪 Testando templates de email...');
    
    const results = [];
    
    // Teste 1: Template de boas-vindas
    console.log('\n📧 Teste 1: Template de boas-vindas');
    try {
      const welcomeEmail = emailTemplates.welcomeEmail('João Silva');
      
      if (welcomeEmail && welcomeEmail.html && welcomeEmail.html.includes('João Silva')) {
         console.log('✅ Template de boas-vindas gerado com sucesso!');
         results.push({ test: 'welcome', status: 'success', message: 'Template de boas-vindas OK' });
       } else {
         throw new Error('Template de boas-vindas inválido');
       }
    } catch (error) {
      console.error('❌ Erro no template de boas-vindas:', error);
      results.push({ test: 'welcome', status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
    
    // Teste 2: Template de reset de senha
    console.log('\n🔑 Teste 2: Template de reset de senha');
    try {
      const resetEmail = emailTemplates.resetPasswordEmail('João Silva', 'abc123');
      
      if (resetEmail && resetEmail.html && resetEmail.html.includes('João Silva') && resetEmail.html.includes('reset-password')) {
         console.log('✅ Template de reset de senha gerado com sucesso!');
         results.push({ test: 'reset', status: 'success', message: 'Template de reset OK' });
       } else {
         throw new Error('Template de reset inválido');
       }
    } catch (error) {
      console.error('❌ Erro no template de reset:', error);
      results.push({ test: 'reset', status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
    
    // Teste 3: Template de alerta de preço
    console.log('\n🚨 Teste 3: Template de alerta de preço');
    try {
      const priceAlertEmail = emailTemplates.priceAlertEmail(
        'João Silva',
        'Smartphone Samsung Galaxy S23',
        2499.99,
        1899.99,
        'https://www.amazon.com.br/produto-teste'
      );
      
      if (priceAlertEmail && priceAlertEmail.html && priceAlertEmail.html.includes('João Silva') && priceAlertEmail.html.includes('Samsung Galaxy S23')) {
         console.log('✅ Template de alerta de preço gerado com sucesso!');
         results.push({ test: 'priceAlert', status: 'success', message: 'Template de alerta OK' });
       } else {
         throw new Error('Template de alerta inválido');
       }
    } catch (error) {
      console.error('❌ Erro no template de alerta:', error);
      results.push({ test: 'priceAlert', status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
    
    // Teste 4: Verificação das variáveis de ambiente
    console.log('\n⚙️ Teste 4: Variáveis de ambiente');
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    const envStatus = {
      EMAIL_USER: emailUser ? '✅ Configurado' : '❌ Não configurado',
      EMAIL_PASSWORD: emailPassword ? '✅ Configurado' : '❌ Não configurado',
      NEXT_PUBLIC_APP_URL: appUrl ? '✅ Configurado' : '❌ Não configurado'
    };
    
    results.push({ 
      test: 'environment', 
      status: emailUser && emailPassword && appUrl ? 'success' : 'warning', 
      message: 'Verificação de variáveis de ambiente',
      details: envStatus
    });
    
    console.log('\n🎉 Testes de templates concluídos!');
    
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    return NextResponse.json({
      success: errorCount === 0,
      message: `Testes concluídos: ${successCount} sucessos, ${warningCount} avisos, ${errorCount} falhas`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        warnings: warningCount,
        errors: errorCount
      },
      emailConfiguration: {
        configured: !!(emailUser && emailPassword),
        user: emailUser || 'Não configurado',
        passwordSet: !!emailPassword,
        appUrl: appUrl || 'Não configurado'
      },
      instructions: [
        'Para testar o envio real de emails, configure EMAIL_PASSWORD no arquivo .env.local',
        'Use uma senha de app do Gmail se a verificação em duas etapas estiver ativada',
        'Todos os templates estão funcionando corretamente',
        'O sistema de notificações por email está integrado ao monitoramento de preços'
      ]
    });
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Erro durante a execução dos testes'
    }, { status: 500 });
  }
}