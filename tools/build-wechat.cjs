// Build a small, isolated upload project; keep source artwork untouched.
const fs=require('node:fs'),path=require('node:path');
const sharp=require(process.env.SHARP_MODULE || 'sharp');
(async()=>{
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist','wechat');
fs.mkdirSync(path.join(out,'src'),{recursive:true});fs.mkdirSync(path.join(out,'assets'),{recursive:true});
for(const file of ['game.js','game.json',...['app','core','platform','view'].map(n=>'src/'+n+'.js')])fs.copyFileSync(path.join(root,file),path.join(out,file));
const names=['filter-v2','fishery-v2','eel-v2','ocean-v2','dock-v2','raft-v4','tower-v4','shark-v4','cast-v4','puffer-v5','manatee-v5','rooms-v8','mixer-v8','diver-v8','octopus-v9','author-v10','decor-v10','skyrooms-v12','chief-v13'];
for(const name of names)await sharp(path.join(root,'assets',name+'.png')).resize({width:name==='chief-v13'?640:name==='ocean-v2'?512:['raft-v4','tower-v4'].includes(name)?640:768,height:name==='chief-v13'?640:name==='ocean-v2'?512:['raft-v4','tower-v4'].includes(name)?640:768,fit:'inside',withoutEnlargement:true}).png({palette:true,colours:128,dither:0.5,compressionLevel:9}).toFile(path.join(out,'assets',name+'.png'));
const config=JSON.parse(fs.readFileSync(path.join(root,'project.config.json')));config.projectname='这片海我包了';config.description='v1.3.0 海上经营小游戏';config.packOptions={ignore:[],include:[]};fs.writeFileSync(path.join(out,'project.config.json'),JSON.stringify(config,null,2));
function size(dir){return fs.readdirSync(dir,{withFileTypes:true}).reduce((n,f)=>n+(f.isDirectory()?size(path.join(dir,f.name)):fs.statSync(path.join(dir,f.name)).size),0)}
const bytes=size(out);console.log(JSON.stringify({out,bytes,MiB:bytes/1048576,images:names.length}));if(bytes>4*1024*1024)throw new Error('Build exceeds conservative 4 MiB budget');
})().catch(e=>{console.error(e);process.exitCode=1});
