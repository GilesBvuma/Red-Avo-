const fs = require('fs');

async function run() {
  const listRes = await fetch('http://127.0.0.1:8080/api/collections');
  const collections = await listRes.json();
  if (collections.length === 0) {
    console.log("No collections found.");
    return;
  }
  const targetId = collections[0].id;
  console.log("Uploading to collection:", targetId);

  const filePath = 'C:\\Users\\Giles Bvuma\\3D Website\\Red Avo\\frontend\\apps\\storefront-web\\public\\images\\DSC07424.jpg';
  const fileBlob = new Blob([fs.readFileSync(filePath)], { type: 'image/jpeg' });
  
  const fd = new FormData();
  fd.append('file', fileBlob, 'DSC07424.jpg');

  try {
    const r = await fetch(`http://127.0.0.1:8080/api/collections/${targetId}/cover-image`, {
      method: 'POST',
      body: fd,
    });
    console.log("Status:", r.status);
    console.log("Text:", await r.text());
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
