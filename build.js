const NodeBuild = require('@voliware/node-build');
const version = require('./package.json').version;

// js
const jsInput = [
    './node_modules/@voliware/template2/dist/template2-bundle.min.js',
    './node_modules/@voliware/node-user/public/js/nodeuser.min.js',
    './public/js/cookie.min.js',
    './public/js/anime.min.js',
    './public/js/piklor.min.js',
    './public/js/router.js',
    './public/js/todo.js',
    './public/js/todoTemplate.js',
    './public/js/todoTemplateManager.js',
    './public/js/todoApp.js'
];
const jsOutput = "./public/js/todo.min.js"
const jsConfig = {
    name: "node-todo JS",
    version: version, 
    input: jsInput,
    output: jsOutput,
    minify: true
};

// css
const cssInput = [
    './node_modules/@voliware/template2/dist/template2.min.css',
    './node_modules/@voliware/node-user/public/css/nodeuser.min.css',
    './public/css/fontawesome.min.css',
    './public/css/style.css'
];
const cssOutput = "./public/css/todo.min.css";
const cssConfig = {
    name: "node-todo CSS",
    version: version,
    input: cssInput,
    output: cssOutput,
    minify: true
};

const htmlInput = [
    './public/html/index.html',
];
const htmlOutput = './public/index.html';
const htmlConfig = {
    name: "node-todo HTML",
    version: version,
    input: htmlInput,
    output: htmlOutput,
    minify: true,
    // find the match and replace it with the contents of the file
    modifiers: {
        replace: [
            {
                match: '<!-- userapp -->', 
                contents: {
                    file: './node_modules/@voliware/node-user/public/html/nodeuser.html'
                }
            }
        ]
    }
};

// build
const configs = [jsConfig, cssConfig, htmlConfig];
new NodeBuild.Build(configs).run();