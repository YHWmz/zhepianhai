// Cocos re-encodes imported PNGs. Reapply indexed PNG compression without changing dimensions.
const fs=require('node:fs/promises'),path=require('node:path'),sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'../build/wechatgame');
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())await walk(file);else if(e.name.endsWith('.png')){const old=await fs.readFile(file);const next=await sharp(old).png({palette:true,colours:128,dither:.5}).toBuffer();if(next.length<old.length)await fs.writeFile(file,next);}}}
walk(root).catch(e=>{console.error(e);process.exitCode=1;});
