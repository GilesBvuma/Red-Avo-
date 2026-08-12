const http = require('http');

http.get('http://localhost:8080/api/products', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      let totalVariants = 0;
      let flippedVariants = 0;
      let correctVariants = 0;
      let unknownVariants = 0;
      
      const KNOWN_SIZE_TOKENS = new Set([
        'XS','S','M','L','XL','XXL','2XL','3XL','4XL','XXXL',
        'ONE SIZE','ONESIZE','STANDARD','FREE SIZE','FREESIZE'
      ]);

      const unknownVariantsList = [];

      const sizeInColorField = new Map();
      const colorInColorField = new Map();

      products.forEach(p => {
        if (p.variants) {
          p.variants.forEach(v => {
            totalVariants++;
            const colorFieldUpper = (v.color || '').trim().toUpperCase();
            const sizeFieldUpper = (v.size || '').trim().toUpperCase();

            if (KNOWN_SIZE_TOKENS.has(colorFieldUpper)) {
              flippedVariants++;
              sizeInColorField.set(colorFieldUpper, (sizeInColorField.get(colorFieldUpper) || 0) + 1);
            } else if (KNOWN_SIZE_TOKENS.has(sizeFieldUpper)) {
              correctVariants++;
              colorInColorField.set(colorFieldUpper, (colorInColorField.get(colorFieldUpper) || 0) + 1);
            } else {
              unknownVariants++;
              unknownVariantsList.push({
                productName: p.name,
                sku: v.sku,
                color: v.color,
                size: v.size
              });
            }
          });
        }
      });

      console.log('--- SCOPE BREAKDOWN ---');
      console.log(`Total Variants: ${totalVariants}`);
      console.log(`Flipped (Size in Color column): ${flippedVariants}`);
      console.log(`Correct (Size in Size column): ${correctVariants}`);
      console.log(`Unknown (Neither field matches known size): ${unknownVariants}`);
      
      console.log('\nTop 5 values in flipped Color column:');
      const sortedFlipped = [...sizeInColorField.entries()].sort((a,b) => b[1] - a[1]).slice(0,5);
      sortedFlipped.forEach(([val, count]) => console.log(` - ${val}: ${count} rows`));

      console.log('\nTop 5 values in correct Color column:');
      const sortedCorrect = [...colorInColorField.entries()].sort((a,b) => b[1] - a[1]).slice(0,5);
      sortedCorrect.forEach(([val, count]) => console.log(` - ${val}: ${count} rows`));
      
      console.log('\n--- THE 9 UNKNOWN VARIANTS ---');
      unknownVariantsList.forEach(u => {
        console.log(`Product: ${u.productName} | SKU: ${u.sku} | Color: "${u.color}" | Size: "${u.size}"`);
      });

    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
