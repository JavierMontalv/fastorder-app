import test from 'node:test';import assert from 'node:assert/strict';
import {validarReserva,prepararReserva,toLocalInput,RESERVA_ESTADOS,RESERVA_ORIGENES} from '../src/utils/reservas.mjs';
const form={clienteNombre:' Ana Pérez ',clienteTelefono:'3000000000',clienteEmail:'ana@example.com ',mesaId:'2',numeroPersonas:'4',fechaHoraInicio:'2026-10-25T18:00',fechaHoraFin:'2026-10-25T19:30',estado:'confirmada',origen:'whatsapp',notas:'Ventana'};
test('reservation validation rejects reversed times, fractional guests and table overcapacity',()=>{
 assert.deepEqual(validarReserva(form,[{id:2,numero:2,capacidad:4}]),{});
 assert.ok(validarReserva({...form,fechaHoraFin:form.fechaHoraInicio}).fechaHoraFin);
 assert.ok(validarReserva({...form,numeroPersonas:'2.5'}).numeroPersonas);
 assert.ok(validarReserva(form,[{id:2,numero:2,capacidad:2}]).mesaId);
 assert.ok(validarReserva({...form,clienteNombre:' '}).clienteNombre);
});
test('payload preserves states, origin, notes and optional assignment without changing endpoint fields',()=>{
 const p=prepararReserva(form);assert.equal(p.mesaId,2);assert.equal(p.numeroPersonas,4);assert.equal(p.clienteNombre,'Ana Pérez');assert.equal(p.clienteEmail,'ana@example.com');assert.equal(p.estado,'confirmada');assert.equal(p.origen,'whatsapp');assert.equal(p.notas,'Ventana');assert.ok(p.fechaHoraInicio.endsWith('Z'));assert.equal(prepararReserva({...form,mesaId:''}).mesaId,null);
});
test('local date inputs round-trip the selected instant and tolerate invalid stored dates',()=>{
 const instant='2026-10-25T23:00:00.000Z';assert.equal(new Date(toLocalInput(instant)).toISOString(),instant);assert.equal(toLocalInput('invalid'),'');
});
test('all original reservation states and origins remain selectable',()=>{
 assert.deepEqual(Object.keys(RESERVA_ESTADOS),['pendiente','confirmada','sentada','completada','cancelada','no_asistio']);assert.deepEqual(Object.keys(RESERVA_ORIGENES),['telefono','whatsapp','instagram','presencial','otro']);
});
