import junta from './junta.js';
import abonados from './abonados.js';
import facturacion from './facturacion.js';
import pagos from './pagos.js';
import mantenimiento from './mantenimiento.js';
import historiales from './historiales.js';
import catalogos from './catalogos.js';
import seguridad from './seguridad.js';
import { respaldos, dataWarehouse, baseDatos } from './administracion.js';

export const PAGINAS = [junta, abonados, facturacion, pagos, mantenimiento, historiales, catalogos, seguridad, dataWarehouse, respaldos, baseDatos];
export const INICIO = { id: 'inicio', titulo: 'Inicio', icono: 'inicio' };
