const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../build/wechatgame'),game=JSON.parse(fs.readFileSync(path.join(root,'game.json')));
const packs=game.subpackages||game.subPackages||[];
function bytes(dir){return fs.readdirSync(dir,{withFileTypes:true}).reduce((sum,e)=>sum+(e.isDirectory()?bytes(path.join(dir,e.name)):fs.statSync(path.join(dir,e.name)).size),0);}
const total=bytes(root),parts=packs.map(p=>({name:p.name,root:p.root,bytes:bytes(path.join(root,p.root))}));const main=total-parts.reduce((n,p)=>n+p.bytes,0);
console.log(JSON.stringify({mainBytes:main,totalBytes:total,subpackages:parts},null,2));
if(main>4*1024*1024||parts.some(p=>p.bytes>4*1024*1024))throw Error('A package exceeds the project 4 MiB budget. Do not upload this build.');
