import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const bases=['journey-01-scan','journey-02-order','journey-03-kitchen','journey-04-serve'];
const origin=process.argv[2];
let count=0;
for(const base of bases) for(const width of [960,1600]){
 const path='landing/'+base+'-'+width+'.jpg';
 let buffer;
 if(origin){const response=await fetch(new URL(path,origin.endsWith('/')?origin:origin+'/'),{signal:AbortSignal.timeout(20000)});assert.equal(response.status,200,path+' HTTP');assert.match(response.headers.get('content-type')||'',/^image\/jpeg(?:;|$)/i,path+' MIME');buffer=Buffer.from(await response.arrayBuffer());}
 else buffer=await fs.readFile(new URL('../public/'+path,import.meta.url));
 assert(buffer.length>10000,path+' unexpectedly small');assert.equal(buffer.readUInt16BE(0),0xffd8,path+' JPEG SOI');assert.equal(buffer.readUInt16BE(buffer.length-2),0xffd9,path+' JPEG EOI');
 let found=false;
 for(let offset=2;offset<buffer.length-9;){assert.equal(buffer[offset],255,path+' marker');let marker=buffer[offset+1];offset+=2;if(marker===0xda)break;let size=buffer.readUInt16BE(offset);assert(size>=2,path+' segment');if([0xc0,0xc1,0xc2].includes(marker)){assert.equal(buffer.readUInt16BE(offset+5),width,path+' width');assert.equal(buffer.readUInt16BE(offset+3),width*9/16,path+' height');found=true;break;}offset+=size;}
 assert(found,path+' frame missing');count++;
}
console.log('Verified '+count+' JPEG assets'+(origin?' at '+origin:' before build'));
