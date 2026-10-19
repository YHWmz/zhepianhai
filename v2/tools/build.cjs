// CREATOR points at the official CocosCreator executable; exit code 36 means success.
const {spawnSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const project=path.resolve(__dirname,'..'),target=process.argv[2]||'web';
if(!['web','wechat'].includes(target))throw Error('Use web or wechat');
const editor=process.env.CREATOR;if(!editor||!fs.existsSync(editor))throw Error('Set CREATOR to Cocos Creator 3.8.7 executable.');
const result=spawnSync(editor,['--project',project,'--build',`configPath=${path.join(project,'build-'+target+'.json')}`],{stdio:'inherit'});
if(result.error)throw result.error;if(result.status!==36)process.exit(result.status||1);
if(target==='wechat'){for(const step of ['optimize-wechat.cjs','check-wechat.cjs']){const r=spawnSync(process.execPath,[path.join(__dirname,step)],{stdio:'inherit',env:process.env});if(r.status!==0)process.exit(r.status||1);}}
process.exit(0);
