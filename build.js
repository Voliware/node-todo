const uglify = require('uglify-es');
const fs = require('fs');

const src = [
    './node_modules/@voliware/template2/dist/template2-bundle.min.js',
    './public/js/anime.min.js',
    './public/js/cookie.min.js',
    './public/js/piklor.min.js',
    './public/js/app.js'
];
const out = "./public/js/app.min.js"

function readCode(files){
    let code = "";
    for(let i = 0; i < files.length; i++){
        code += fs.readFileSync(files[i])
        if(!code){
            console.error("Failed to read file");
        }
    }
    return code;
}

function printFiles(files){
    let text = "";
    for(let i = 0; i < files.length; i++){
        text += `  ${files[i]}`
        if(i + 1 !== files.length){
            text += "\n";
        }
    }
    return text;
}

let code = readCode(src);
let result = uglify.minify(code.toString());
fs.writeFile(out, result.code, function(err){
    let status = "OK";
    if(err){
        status = "ERR";
        console.error(err);
    } 
    console.log(`\r\n\\\\     \/\/ \/\/\/\/\/\/ \/\/     \/\/ \\\\           \/\/ \/\/\\ \\\\\\\\\\\\ \\\\\\\\\\\\\\\r\n \\\\   \/\/ \/\/  \/\/ \/\/     \/\/   \\\\   \/\/\\   \/\/ \/\/ \\\\ \\\\  \\\\ \\\\___\r\n  \\\\ \/\/ \/\/  \/\/ \/\/     \/\/     \\\\ \/\/ \\\\ \/\/ \/\/   \\\\ \\\\\\\\\\  \\\\\r\n   \\\\\/ \/\/\/\/\/\/ \/\/\/\/\/\/ \/\/       \\\\\/   \\\\\/ \/\/     \\\\ \\\\  \\\\ \\\\\\\\\\\\`);
    console.log('\r\n');
    console.log('NODE-TODO - V1.0.0');
    console.log('\r\n');
    console.log(`- ${(new Date()).toLocaleString()}`)
    console.log('- INPUT');
    console.log(`${printFiles(src)}`);
    console.log(`- OUTPUT: ${out}`);
    console.log(`- STATUS: ${status}`);
});