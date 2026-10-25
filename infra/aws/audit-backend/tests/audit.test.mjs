import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedMetadata, compact, parseQuery, shouldCapture } from '../utils/auditPolicy.mjs';
test('protege credenciales anidadas y datos personales', () => {
  const data = compact({ PASSWORD: 'a', nested: { refreshToken:'b', email:'x', precio:10 } });
  assert.equal(data.PASSWORD,'[protegido]'); assert.equal(data.nested.refreshToken,'[protegido]');
  assert.equal(data.nested.email,'[protegido]'); assert.equal(data.nested.precio,10);
});
test('limita metadatos sin cortar JSON', () => {
  const value = boundedMetadata(Object.fromEntries(Array.from({length:30},(_,i)=>[i,'x'.repeat(500)])));
  assert.ok(Buffer.byteLength(JSON.stringify(value)) <= 6000); assert.equal(value.truncado,true);
});
test('no registra lecturas ni atribuye al tenant enviado por cliente', () => {
  assert.equal(shouldCapture({method:'GET',usuario:{restauranteId:1}}),false);
  assert.equal(shouldCapture({method:'POST',body:{restauranteId:1}}),false);
  assert.equal(shouldCapture({method:'PATCH',usuario:{restauranteId:1}}),true);
});
test('paginación acotada rechaza rangos y cursores arbitrarios', () => {
  assert.throws(()=>parseQuery({cursor:'1 OR 1=1'})); assert.throws(()=>parseQuery({days:999}));
  assert.equal(parseQuery({limit:10000}).limit,30);
});
import { readFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
const policy = await import('../utils/auditPolicy.mjs');
const source = (await readFile(new URL('../middlewares/auditarAccion.js',import.meta.url),'utf8'))
 .replace(/^import .*;\r?\n/gm,'');
const factory = new Function('boundedMetadata','requestContext','shouldCapture','routeCategory','Auditoria','sequelize','logger',source.replace('export default function','return function'));
function fixture(method='PATCH'){
 const rows=[];const middleware=factory(policy.boundedMetadata,policy.requestContext,policy.shouldCapture,policy.routeCategory,{create:async value=>{rows.push(value);return{id:1};}},{query:async()=>{}},{error:()=>{}});
 const req={method,originalUrl:'/api/productos/7',usuario:{id:4,restauranteId:8,nombre:'Ana',rol:'admin'},ip:'127.0.0.1'};
 const res=new EventEmitter();res.statusCode=200;middleware(req,res,()=>{});return{req,res,rows};
}
test('registra una mutación sin controlador específico con actor y sede del servidor',async()=>{
 const {req,res,rows}=fixture();req.body={restauranteId:999};res.emit('finish');await new Promise(setImmediate);
 assert.equal(rows.length,1);assert.equal(rows[0].entidadId,8);assert.equal(rows[0].actorId,4);assert.equal(rows[0].metadata.resultado,'correcto');
});
test('no duplica el registro explícito del controlador',async()=>{
 const {req,res,rows}=fixture();await req.auditar({entidad:'restaurante',entidadId:8,accion:'producto_actualizado',metadata:{cambios:{precio:{antes:10,despues:20}}}});res.emit('finish');await new Promise(setImmediate);assert.equal(rows.length,1);assert.equal(rows[0].metadata.cambios.precio.despues,20);
});
test('no escribe GET y distingue rechazos HTTP',async()=>{
 const get=fixture('GET');get.res.emit('finish');assert.equal(get.rows.length,0);
 const rejected=fixture();rejected.res.statusCode=403;rejected.res.emit('finish');await new Promise(setImmediate);assert.equal(rejected.rows[0].metadata.resultado,'rechazado');
});
const routeSource=(await readFile(new URL('../routes/auditRoutes.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace('export default router;','return router;');
function routeFixture(){let handler,options;const router={use(){},get(path,fn){handler=fn;}};const Op={gte:Symbol('gte'),lt:Symbol('lt')};new Function('Router','Op','auth','Auditoria','parseQuery','boundedMetadata','routeCategory',routeSource)(()=>router,Op,()=>{},{findAll:async value=>{options=value;return[];}},policy.parseQuery,policy.boundedMetadata,policy.routeCategory);return{handler,options:()=>options,Op};}
function response(){return{statusCode:200,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;},set(){return this;}};}
test('lectura exige identidad y rol administrativo',async()=>{const f=routeFixture();const res=response();await f.handler({query:{}},res);assert.equal(res.statusCode,401);const denied=response();await f.handler({query:{},usuario:{rol:'staff',restauranteId:8}},denied);assert.equal(denied.statusCode,403);assert.equal(f.options(),undefined);});
test('consulta aislada por sede autenticada y cursor sin COUNT ni OFFSET',async()=>{const f=routeFixture();const res=response();await f.handler({query:{cursor:'71',restauranteId:999},usuario:{rol:'admin',restauranteId:8}},res);assert.equal(res.statusCode,200);assert.equal(f.options().where.entidadId,8);assert.equal(f.options().limit,31);assert.equal(f.options().where.id[f.Op.lt],'71');assert.equal(f.options().offset,undefined);});
