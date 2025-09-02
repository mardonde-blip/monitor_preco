const { sendEmail, emailTemplates } = require('./src/lib/email');

// Teste do sistema de emails
async function testEmailSystem() {
  console.log('🧪 Iniciando testes do sistema de email...');
  
  try {
    // Teste 1: Email de boas-vindas
    console.log('\n📧 Teste 1: Email de boas-vindas');
    const welcomeEmail = emailTemplates.welcome({
      userName: 'João Silva',
      userEmail: 'joao@teste.com'
    });
    
    await sendEmail({
      to: 'teste@gmail.com', // Substitua pelo seu email para teste
      subject: 'Bem-vindo ao Lucre Na Promo! 🎉',
      html: welcomeEmail
    });
    
    console.log('✅ Email de boas-vindas enviado com sucesso!');
    
    // Teste 2: Email de reset de senha
    console.log('\n🔑 Teste 2: Email de reset de senha');
    const resetEmail = emailTemplates.resetPassword({
      userName: 'João Silva',
      resetLink: 'http://localhost:3000/reset-password?token=abc123'
    });
    
    await sendEmail({
      to: 'teste@gmail.com', // Substitua pelo seu email para teste
      subject: 'Redefinir sua senha - Lucre Na Promo',
      html: resetEmail
    });
    
    console.log('✅ Email de reset de senha enviado com sucesso!');
    
    // Teste 3: Email de alerta de preço
    console.log('\n🚨 Teste 3: Email de alerta de preço');
    const priceAlertEmail = emailTemplates.priceAlert({
      userName: 'João Silva',
      productName: 'Smartphone Samsung Galaxy S23',
      productUrl: 'https://www.amazon.com.br/produto-teste',
      oldPrice: 2499.99,
      newPrice: 1899.99,
      discount: '24.0',
      targetPrice: 2000.00
    });
    
    await sendEmail({
      to: 'teste@gmail.com', // Substitua pelo seu email para teste
      subject: '🚨 Alerta de Preço: Smartphone Samsung Galaxy S23',
      html: priceAlertEmail
    });
    
    console.log('✅ Email de alerta de preço enviado com sucesso!');
    
    console.log('\n🎉 Todos os testes de email foram executados com sucesso!');
    console.log('\n📋 Resumo dos testes:');
    console.log('   ✅ Email de boas-vindas');
    console.log('   ✅ Email de reset de senha');
    console.log('   ✅ Email de alerta de preço');
    console.log('\n💡 Verifique sua caixa de entrada para confirmar o recebimento dos emails.');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔧 Possíveis soluções:');
      console.log('   1. Verifique se EMAIL_USER e EMAIL_PASSWORD estão corretos no .env.local');
      console.log('   2. Certifique-se de que a "Verificação em duas etapas" está ativada no Gmail');
      console.log('   3. Use uma "Senha de app" em vez da senha normal do Gmail');
      console.log('   4. Verifique se o acesso a "Apps menos seguros" está habilitado (se aplicável)');
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n🌐 Problema de conexão:');
      console.log('   1. Verifique sua conexão com a internet');
      console.log('   2. Certifique-se de que não há firewall bloqueando a conexão SMTP');
    }
  }
}

// Executar os testes
testEmailSystem();