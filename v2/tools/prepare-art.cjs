// Derive individual Cocos sprites from the versioned v1 atlases. No runtime atlas guessing.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'../..'),dest=path.join(root,'v2/assets/resources/art');fs.mkdirSync(dest,{recursive:true});
async function crop(name,file,rect){const src=path.join(root,'assets',file+'.png'),m=await sharp(src).metadata();let im=sharp(src);if(rect){const [x,y,w,h]=rect;im=im.extract({left:Math.round(x*m.width),top:Math.round(y*m.height),width:Math.min(Math.round(w*m.width),m.width-Math.round(x*m.width)),height:Math.min(Math.round(h*m.height),m.height-Math.round(y*m.height))});}await im.resize({width:Object.keys({filter:1,fishery:1,eel:1,puffer:1,manatee:1,mixer:1}).includes(name)?160:name==='ocean'?768:name==='island'?850:/^(room|sky)/.test(name)?448:512,withoutEnlargement:true}).png({palette:true,colours:128}).toFile(path.join(dest,name+'.png'));}
(async()=>{
 await crop('ocean','ocean-v2');await crop('island','island-v132');await crop('shark','shark-v4',[0,.56,1,.44]);
 await crop('chief','chief-v13',[0,0,.5,1]);await crop('author','author-v10',[0,0,.5,.5]);await crop('boss','cast-v4',[0,829/1254,.5,425/1254]);
 for(let i=0;i<6;i++)await crop('room'+i,'rooms-v8',[(i%2)/2,Math.floor(i/2)/3,.5,1/3]);
 const q=[[20,0,605,336],[640,15,595,321],[20,337,590,306],[640,337,595,306],[20,644,590,293],[640,644,595,293],[20,940,610,300]];
 for(let i=0;i<q.length;i++)await crop('sky'+i,'skyrooms-v12',q[i].map(v=>v/1254));
 for(const [name,file] of Object.entries({filter:'filter-v2',fishery:'fishery-v2',eel:'eel-v2',puffer:'puffer-v5',manatee:'manatee-v5',mixer:'mixer-v8'}))await crop(name,file);
 console.log('25 sprite assets prepared');
})();
