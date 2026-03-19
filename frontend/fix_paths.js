const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace css path
    content = content.replace(/href="style\.css"/g, 'href="css/style.css"');
    content = content.replace(/href="\.\/style\.css"/g, 'href="css/style.css"');
    
    // Replace js path
    content = content.replace(/src="app\.js"/g, 'src="js/app.js"');
    content = content.replace(/src="\.\/app\.js"/g, 'src="js/app.js"');
    
    // Replace image paths if any
    content = content.replace(/url\('login_hero\.png'\)/g, "url('assets/login_hero.png')");
    content = content.replace(/url\('\.\/login_hero\.png'\)/g, "url('assets/login_hero.png')");
    
    fs.writeFileSync(p, content);
});
console.log("Updated HTML file paths.");
