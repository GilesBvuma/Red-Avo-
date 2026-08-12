const http = require('http');

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    const products = await fetchJson('http://localhost:8080/api/products');
    const dbColors = await fetchJson('http://localhost:8080/api/colors');
    
    // Normalize db colors for case-insensitive lookup
    const dbColorNames = new Set(dbColors.map(c => c.name.toLowerCase().trim()));
    
    // Find all distinct colors in variants
    const variantColors = new Set();
    products.forEach(p => {
      if (p.variants) {
        p.variants.forEach(v => {
          if (v.color && typeof v.color === 'string' && v.color.trim() !== '' && v.color !== 'null' && v.color !== 'Default' && !v.color.startsWith('$')) {
            variantColors.add(v.color.trim());
          }
        });
      }
    });
    
    const missingColors = [];
    for (const vc of variantColors) {
      if (!dbColorNames.has(vc.toLowerCase())) {
        missingColors.push(vc);
      }
    }
    
    console.log(`Found ${missingColors.length} missing colors:`);
    missingColors.forEach(mc => console.log(` - ${mc}`));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
