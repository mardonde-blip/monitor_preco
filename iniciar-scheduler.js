const http = require('http');

// Função para fazer requisição POST
function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function iniciarScheduler() {
  console.log('🚀 Iniciando o scheduler automático...\n');
  
  try {
    // Iniciar o scheduler
    const response = await makePostRequest('http://localhost:3000/api/scheduler', {
      action: 'start'
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Scheduler iniciado com sucesso!');
      console.log(`Resposta: ${JSON.stringify(response.data, null, 2)}`);
      
      // Aguardar um pouco e verificar o status
      console.log('\n⏳ Aguardando 3 segundos para verificar status...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar status do scheduler
      const statusResponse = await new Promise((resolve, reject) => {
        const req = http.request('http://localhost:3000/api/scheduler', (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve({ status: res.statusCode, data: jsonData });
            } catch (e) {
              resolve({ status: res.statusCode, data: data });
            }
          });
        });
        
        req.on('error', (error) => reject(error));
        req.end();
      });
      
      console.log('\n📊 Status atual do scheduler:');
      console.log(`Status: ${statusResponse.status}`);
      
      if (statusResponse.status === 200) {
        console.log(`Rodando: ${statusResponse.data.running ? '✅ SIM' : '❌ NÃO'}`);
        if (statusResponse.data.interval) {
          console.log(`Intervalo: ${statusResponse.data.interval}ms`);
        }
        if (statusResponse.data.lastRun) {
          console.log(`Última execução: ${statusResponse.data.lastRun}`);
        }
        if (statusResponse.data.nextRun) {
          console.log(`Próxima execução: ${statusResponse.data.nextRun}`);
        }
      }
      
    } else {
      console.log('❌ Erro ao iniciar scheduler');
      console.log(`Resposta: ${JSON.stringify(response.data, null, 2)}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor local está rodando:');
    console.log('   npm run dev');
  }
}

// Executar
iniciarScheduler();