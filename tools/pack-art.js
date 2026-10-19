// Optional build-time dependency only: SHARP_MODULE=/absolute/path/to/sharp node tools/pack-art.js
// Lossless encoding: original PNGs remain the source of truth and WeChat fallback.
const sharp=require(process.env.SHARP_MODULE||'sharp');
const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../assets');
const files=['filter-v2','fishery-v2','eel-v2','ocean-v2','dock-v2','raft-v4','tower-v4','shark-v4','cast-v4','puffer-v5','manatee-v5','rooms-v8','mixer-v8','diver-v8','octopus-v9','author-v10','decor-v10'];
(async()=>{await fs.mkdir(path.join(root,'webp'),{recursive:true});let source=0,output=0;
 for(const name of files){const src=path.join(root,name+'.png'),dst=path.join(root,'webp',name+'.webp');await sharp(src).webp({lossless:true,effort:6}).toFile(dst);source+=(await fs.stat(src)).size;output+=(await fs.stat(dst)).size;}
 console.log(JSON.stringify({files:files.length,sourceBytes:source,webpBytes:output,savedPercent:Math.round((1-output/source)*100)}));
})().catch(e=>{console.error(e);process.exitCode=1});
