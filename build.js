#!/usr/bin/env node
// FAUNWILD build — concatenates src/*.js (filename order) into one playable HTML file.
// Zero dependencies. Outputs: dist/faunwild.html, dist/index.html (GitHub Pages), dist/game.js (tests).
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=__dirname;
const files=fs.readdirSync(path.join(ROOT,'src')).filter(f=>f.endsWith('.js')).sort();
const js=files.map(f=>fs.readFileSync(path.join(ROOT,'src',f),'utf8')).join('');
const tpl=fs.readFileSync(path.join(ROOT,'template.html'),'utf8');
if(!tpl.includes('/*__GAME_JS__*/'))throw new Error('template.html is missing the /*__GAME_JS__*/ placeholder');
const html=tpl.replace('/*__GAME_JS__*/',()=>js);
fs.mkdirSync(path.join(ROOT,'dist'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'dist','game.js'),js);
fs.writeFileSync(path.join(ROOT,'dist','faunwild.html'),html);
fs.writeFileSync(path.join(ROOT,'dist','index.html'),html);
console.log('built dist/faunwild.html ('+html.length+' bytes) from '+files.length+' modules: '+files.join(', '));
