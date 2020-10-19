const NodeBuild = require('@voliware/node-build');
const Version = require('./package.json').version;

/******************************************************************************
 * JS
 *****************************************************************************/

const jsConfig = {
    name: "node-todo JS",
    version: Version, 
    input: [
        './node_modules/@voliware/template2/dist/template2-bundle.min.js',
        './node_modules/@voliware/node-user/public/js/nodeuser.min.js',
        './src/js/cookie.min.js',
        './src/js/anime.min.js',
        './src/js/piklor.min.js',
        './src/js/router.js',
        './src/js/todo.js',
        './src/js/todoManager.js',
        './src/js/todoApp.js'
    ],
    output: "./public/js/app.min.js",
    minify: true
};

/******************************************************************************
 * CSS
 *****************************************************************************/

const cssConfig = {
    name: "node-todo CSS",
    version: Version,
    input: [
        './node_modules/@voliware/template2/dist/template2.min.css',
        './node_modules/@voliware/node-user/public/css/nodeuser.min.css',
        './src/css/fontawesome.min.css',
        './src/css/todo.css',
        './src/css/style.css'
    ],
    output: "./public/css/style.min.css",
    minify: true
};

/******************************************************************************
 * HTML
 *****************************************************************************/

const htmlConfig = {
    name: "node-todo HTML",
    version: Version,
    input: [
        './src/html/index.html',
    ],
    output: './public/index.html',
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

/******************************************************************************
 * Build 
 *****************************************************************************/

const configs = [jsConfig, cssConfig, htmlConfig];
new NodeBuild.Build(configs).run();