import campo from './campo.js';
import junta from './junta.js';
import abonados from './abonados.js';
import facturacion from './facturacion.js';
import pagos from './pagos.js';
import mantenimiento from './mantenimiento.js';
import seguridad from './seguridad.js';
import catalogos from './catalogos.js';
import { respaldos, dataWarehouse, baseDatos } from './administracion.js';

export const PAGINAS = [campo, junta, abonados, facturacion, pagos, mantenimiento, catalogos, seguridad, dataWarehouse, respaldos, baseDatos];
export const INICIO = { id: 'inicio', titulo: 'Inicio', icono: 'inicio' };
