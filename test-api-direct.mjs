import https from 'https';

console.log('[TEST] Testando chamada direta à API Nacional (sem mTLS)...\n');

const url = 'https://adn.nfse.gov.br/contribuintes/DFe/1?cnpjConsulta=44298894000113&lote=true';

console.log('[TEST] URL:', url);
console.log('[TEST] Aguardando resposta...\n');

const req = https.get(url, {
  headers: { 
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0'
  }
}, (res) => {
  console.log('[TEST] ✓ Status HTTP:', res.statusCode);
  console.log('[TEST] Content-Type:', res.headers['content-type']);
  console.log('[TEST] Content-Length:', res.headers['content-length']);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n[TEST] Resposta (primeiros 1000 chars):');
    console.log('---');
    console.log(data.substring(0, 1000));
    console.log('---\n');
    
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log('[TEST] ✓ JSON válido');
        console.log('[TEST] StatusProcessamento:', json.StatusProcessamento);
        console.log('[TEST] Documentos:', json.LoteDFe?.length || 0);
      } catch (e) {
        console.log('[TEST] ✗ Não é JSON válido');
      }
    }
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('[TEST] ✗ Erro na requisição:', err.message);
  console.error('[TEST] Code:', err.code);
  process.exit(1);
});

req.setTimeout(15000, () => {
  console.error('[TEST] ✗ Timeout na requisição (15s)');
  process.exit(1);
});
