import fs from 'fs';
import path from 'path';

const root = process.cwd();
const targets = [path.join(root,'backend'), path.join(root,'frontend','src')];
const ignored = new Set(['node_modules','.next','.git']);
const textExtensions = new Set(['.js','.ts','.tsx','.css','.md','.json']);
const errors=[];

function walk(dir){
  if(!fs.existsSync(dir)) return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignored.has(entry.name)) continue;
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(p);
    else if(textExtensions.has(path.extname(entry.name))) check(p);
  }
}
function check(file){
  const text=fs.readFileSync(file,'utf8');
  const mojibake=['â‚¹','Â©','Â·','â€”','â€¦','â†','Â '].some((needle)=>text.includes(needle));
  if(mojibake) errors.push(`Mojibake text: ${path.relative(root,file)}`);
  if(file.endsWith('backend/test-upload.js')) errors.push('Unsafe legacy test-upload.js still exists.');
  if(file.endsWith('backend/middleware/uploadMiddleware.js') && /fs\.(unlinkSync|existsSync|readFileSync|writeFileSync|rmSync|renameSync)\b/.test(text)) errors.push('Synchronous filesystem operation remains in upload middleware.');
  if(file.endsWith('backend/utils/cashfree.js') && /2023-08-01/.test(text)) errors.push('Old Cashfree API version still hard-coded.');
}
walk(targets[0]); walk(targets[1]);

const prismaInstances=[];
function scanPrisma(dir){
  if(!fs.existsSync(dir)) return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignored.has(entry.name)) continue;
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) scanPrisma(p);
    else if(p.endsWith('.js')){
      const text=fs.readFileSync(p,'utf8');
      if(text.includes('new PrismaClient(') && !p.endsWith(path.join('prisma','seed.js')) && !p.endsWith(path.join('lib','prisma.js'))) prismaInstances.push(path.relative(root,p));
    }
  }
}
scanPrisma(path.join(root,'backend'));
if(prismaInstances.length) errors.push(`Runtime PrismaClient instances found: ${prismaInstances.join(', ')}`);

for(const dead of ['src/app/portfolio/edit/[id]/page.tsx','src/app/portfolio/edit/[id]/editor.module.css','frontend/src/context/OfferContext.tsx','frontend/src/hooks/useActiveOffer.ts','frontend/src/utils/price.ts','backend/utils/catchAsync.js']) if(fs.existsSync(path.join(root,dead))) errors.push(`Dead legacy file still present: ${dead}`);

for(const required of [
  'backend/services/pricingService.js','backend/config/validateEnvironment.js','frontend/src/app/privacy/page.tsx','frontend/src/app/terms/page.tsx','frontend/src/app/refund-policy/page.tsx','frontend/src/app/contact/page.tsx','frontend/src/app/global-error.tsx'
]) if(!fs.existsSync(path.join(root,required))) errors.push(`Missing required final file: ${required}`);

if(errors.length){ console.error('PLUTEN FINAL AUDIT FAILED'); for(const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log('PLUTEN FINAL AUDIT PASSED');
