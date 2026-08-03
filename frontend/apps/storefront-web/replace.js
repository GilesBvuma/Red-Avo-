const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

const dir = 'c:\\Users\\Giles Bvuma\\3D Website\\Red Avo\\frontend\\apps\\storefront-web\\src';

walk(dir, function(err, results) {
  if (err) throw err;
  
  results.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
      let content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      
      // Replace font variables
      if (file.endsWith('.css')) {
        newContent = newContent.replace(/var\(--font-bebas\)[^;]*/g, 'var(--font-montserrat), sans-serif');
        newContent = newContent.replace(/var\(--font-inter\)[^;]*/g, 'var(--font-montserrat), sans-serif');
      }
      
      // Replace Red Avo string
      // Be careful not to replace Red Avo when it's already RedAvo Activewear (though here we search 'Red Avo')
      // and for logo alt text maybe just "RedAvo Activewear" is fine.
      newContent = newContent.replace(/Red Avo Sportswear/g, 'RedAvo Activewear');
      newContent = newContent.replace(/Red Avo /g, 'RedAvo Activewear ');
      newContent = newContent.replace(/Red Avo/g, 'RedAvo Activewear');
      
      // fix double RedAvo Activewear Activewear
      newContent = newContent.replace(/RedAvo Activewear Activewear/g, 'RedAvo Activewear');
      
      if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Updated', file);
      }
    }
  });
});
