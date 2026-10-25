# Frontend — Interfaz web del Sistema de Gestión para una ASADA

SPA en React (Vite). Las pantallas se describen en `src/paginas/` y un motor común las convierte en pestañas, tablas y formularios. La API de `../backend` sirve el build de `dist/` en el mismo origen, así que no hace falta configurar CORS.

## Cómo usarlo

**Producción / uso diario** (la API sirve el build):

```bash
cd frontend
npm install
npm run build
cd ../backend
npm run dev
```

O ejecute `INSTALAR.bat` y luego `INICIAR.bat`. Abra **http://localhost:3000/**.

**Desarrollo** (Vite con recarga en caliente; proxy de `/api` hacia el backend):

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Abra **http://localhost:5173/**. Los usuarios iniciales son `admin` / `Asada#2026` y `dba` / `AsadaDBA#2026`.

## Qué ve cada rol

El menú y las pestañas se arman con los permisos que devuelve `/api/auth/perfil`. Ese perfil se vuelve a leer cada vez que se abre la aplicación. Ocultar algo en el front es solo comodidad: la API vuelve a verificar cada permiso en la base.

| Módulo | Contenido |
|---|---|
| Inicio | Indicadores según el rol (facturas por cobrar, morosos, alertas, incidencias, respaldos, ETL…) |
| Abonados y conexiones | Abonados físicos y jurídicos, conexiones (estado, tarifa, medidor), conexiones no activas, medidores |
| Lecturas y facturación | Ruta de lectura, registro y corrección de lecturas, facturas, facturación mensual, alertas de consumo |
| Pagos y morosidad | Facturas por cobrar, pagos y anulaciones, prórrogas, morosidad, recargos, recaudación por método |
| Mantenimiento e incidencias | Mis mantenimientos (fontanero), incidencias, programación y cierre de mantenimientos |
| Catálogos | Tarifas (con historial y simulador), métodos de pago, tipos de trabajo e incidencia, niveles y reglas de consumo |
| Seguridad | Usuarios, empleados, roles y permisos, bitácora y actividad por usuario |
| Reportes y Data Warehouse | Consumo, facturación, morosidad y mantenimientos con gráficos; ETL, validación y conciliación |
| Respaldos | Políticas, ejecución, verificación, restauración a un punto en el tiempo e historial |
| Base de datos | Monitoreo, índices, DBCC CHECKDB y datos de prueba |

Todas las tablas permiten buscar, ordenar por columna y exportar a CSV.

## Estructura

| Archivo | Qué hace |
|---|---|
| `src/main.jsx` · `src/App.jsx` | Arranque React, sesión y rutas (`#/modulo`) |
| `src/api.js` | Llamadas a la API, token en `localStorage`, caché de catálogos |
| `src/contexto/Sesion.jsx` | Perfil, permisos y cierre al vencer el token |
| `src/ui/` | Formularios, tablas, modales, avisos, gráficos y formato (colones, fechas, estados) |
| `src/motor/MotorPagina.jsx` | Convierte las definiciones de `paginas/` en pestañas, filtros, tablas y acciones |
| `src/paginas/*.js` | Un archivo por módulo: secciones, campos y la ruta de la API que usa cada uno |
| `src/permisos.js` | Nombres de permisos (iguales a `dbo.Permiso`) |
| `src/layout/` | Login, marco (menú) y panel de inicio |
| `js/` | Frontend anterior (HTML/JS sin React), solo como referencia |

### Agregar una pantalla

Agregue una sección a la página que corresponda en `src/paginas/`. Por ejemplo, para una consulta con una acción por fila:

```js
{
  titulo: 'Facturas',
  permisos: [P.CONSULTAR_FACTURAS],
  ruta: '/facturas',                       // GET a la API; los filtros van como query string
  filtros: [{ nombre: 'estado', opciones: ['Pendiente', 'Pagada', 'Vencida'] }],
  acciones: [{
    texto: 'Prórroga', permisos: [P.GESTIONAR_PAGOS], metodo: 'PATCH',
    ruta: (f) => `/facturas/${f.id_factura}/prorroga`,
    campos: [{ nombre: 'nueva_fecha_vencimiento', tipo: 'date', requerido: true }],
  }],
}
```

El nombre de cada campo es el parámetro del procedimiento sin la `@`, igual que en la API. Los campos vacíos no se envían, así que el procedimiento usa su valor por defecto.

## Notas

- **Fechas.** SQL Server devuelve fechas sin zona horaria y el driver las marca como UTC. El front las muestra en UTC para que coincidan con lo que guarda la base.
- **Errores.** Los mensajes de los `THROW 5xxxx` aparecen tal cual dentro del formulario, por ejemplo "El monto pagado excede el saldo pendiente de la factura."
- **Sesión.** Si el token vence o se desactiva al usuario, la siguiente petición vuelve a la pantalla de inicio de sesión.
