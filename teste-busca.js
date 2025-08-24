// Usando fetch nativo do Node.js 18+

async function testarBusca() {
  console.log('🔍 Testando API de busca de produtos...');
  
  try {
    const response = await fetch('http://localhost:3001/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'smartphone samsung'
      })
    });
    
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('\n📊 Resposta da API:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.results && data.results.length > 0) {
      console.log(`\n✅ Busca realizada com sucesso!`);
      console.log(`📦 Total de produtos encontrados: ${data.results.length}`);
      
      // Mostrar resumo por site
      const porSite = {};
      data.results.forEach(result => {
        porSite[result.site] = (porSite[result.site] || 0) + 1;
      });
      
      console.log('\n🏪 Produtos por site:');
      Object.entries(porSite).forEach(([site, count]) => {
        console.log(`  ${site}: ${count} produtos`);
      });
      
      // Mostrar os 3 produtos mais baratos
      const maisBaratos = data.results
        .sort((a, b) => a.price - b.price)
        .slice(0, 3);
      
      console.log('\n💰 3 produtos mais baratos:');
      maisBaratos.forEach((produto, index) => {
        console.log(`  ${index + 1}. ${produto.title.substring(0, 50)}...`);
        console.log(`     💵 R$ ${produto.price.toFixed(2)} - ${produto.site}`);
        console.log(`     🔗 ${produto.url}`);
        console.log('');
      });
      
    } else if (data.error) {
      console.log('❌ Erro na busca:', data.error);
    } else {
      console.log('⚠️ Nenhum produto encontrado para a busca.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar busca:', error.message);
  }
}

testarBusca();