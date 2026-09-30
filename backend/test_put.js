const r = await fetch('http://127.0.0.1:8080/api/collections/3/products', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productIds: [4, 7] })
});
console.log(r.status);
r.text().then(console.log);
