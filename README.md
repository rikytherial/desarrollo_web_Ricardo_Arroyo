# CC5002 - Desarrollo de Aplicaciones Web - Tarea 2

Ricardo Arroyo Santibáñez

Sitio para registrar avistamientos de aves de la Unión de Ornitólogos de Chile,
hecho con Python, Flask, SQLAlchemy y MySQL. Reutiliza el HTML, CSS y
JavaScript que desarrollé en la Tarea 1.

## Cómo ejecutarlo

Necesita Python 3.10 o superior y MySQL Server 8 corriendo en `localhost:3306`.

1. Crear la base de datos y cargar los datos, en este orden:

```
mysql -u root -p < sql/tarea2.sql
mysql -u root -p tarea2 < sql/region-comuna.sql
mysql -u root -p tarea2 < sql/aves.sql
```

2. Crear el entorno virtual e instalar las dependencias:

```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

3. Levantar la aplicación con `python app.py`. Queda en `http://localhost:5000`.

Usa las credenciales que indica el enunciado: base `tarea2`, usuario `cc5002`,
contraseña `programacionweb`.

## Estructura

```
app.py             rutas de Flask
modelo.py          modelos SQLAlchemy de las seis tablas
validaciones.py    validaciones del lado del servidor
archivos.py        validación y guardado de los archivos subidos
templates/         plantillas Jinja2
static/            CSS, JavaScript y archivos subidos
sql/               scripts de creación y carga de datos
```

## Decisiones que tomé

**1. El tipo de ave lo reemplacé por el catálogo de la base de datos.**
En la Tarea 1 pedía el tipo de ave (rapaz, acuática, etc.) y el nombre como
texto libre. La tabla `ave` solo tiene `id` y `nombre`, sin clasificación por
tipo, y `avistamiento` guarda `ave_id`. Junté los dos campos en un solo
selector con las 585 especies que vienen en `aves.sql`.

**2. Los campos que no tienen columna los valido igual, pero no los guardo.**
Mantuve el formulario completo de la Tarea 1 porque el enunciado lo pide, pero
el modelo no tiene dónde guardar todo. Apliqué la misma regla en los dos
formularios: si el campo no tiene columna, igual se valida en el servidor y
después se descarta. Esto afecta a RUT, fecha de nacimiento, medio de contacto,
calle, motivación y consentimiento en el registro de voluntario, y a cantidad
de aves, región y comuna en el de avistamiento.

**3. Nombre y apellido van juntos, y el teléfono normalizado.**
La tabla `voluntario` tiene una sola columna `nombre`, así que concateno ambos
campos. El celular lo guardo como `+56912345678` porque `telefono` es
`VARCHAR(15)` y el formato que escribe el usuario (`+56 9 1234 5678`) ocupa 17
caracteres. La fecha y la hora del avistamiento también las combino, porque el
formulario las pide por separado y la columna es `DATETIME`.

**4. Las regiones y comunas ahora salen de la base.**
En la Tarea 1 estaban escritas dentro del archivo JavaScript. Ahora Flask las
consulta y se las pasa a la plantilla, que las entrega al JavaScript que arma
los selectores. El `value` de cada opción es el `id` de MySQL, no el nombre,
porque es lo que necesita la llave foránea `comuna_id`.

**5. Repetí todas las validaciones en el servidor.**
El JavaScript de la Tarea 1 quedó igual, pero ahora es solo comodidad para el
usuario: se puede desactivar, o se puede mandar el POST sin pasar por el
formulario. Por eso el servidor vuelve a validar todo desde cero. Si algo
falla, devuelvo el formulario con los datos que la persona ya había escrito y
los mensajes en los mismos elementos que usa el JavaScript, para que se vea
igual venga el error de donde venga.

**6. Hay validaciones que solo puede hacer el servidor.**
El cliente no tiene forma de comprobarlas, así que las agregué: que la comuna
exista y además pertenezca a la región elegida, que el ave exista en el
catálogo, y que el correo del avistamiento corresponda a un voluntario ya
registrado.

**7. Los parámetros de la URL pasan por listas blancas.**
En el listado reviso `ave`, `orden`, `direccion`, `por_pagina` y `pagina`
contra valores permitidos. El criterio de ordenamiento nunca lo meto en el SQL
como texto: lo traduzco con un diccionario a una columna del modelo. Si llega
algo raro, uso el valor por defecto en vez de mostrar un error. El mensaje de
confirmación de la portada funciona igual: la URL solo trae una clave
(`/?ok=avistamiento`) y el texto sale de un diccionario del servidor, así nadie
puede inyectar contenido con un enlace armado a mano.

**8. Los archivos los reviso por contenido, no por extensión.**
Uso la librería `filetype`, que mira los primeros bytes (magic numbers), porque
cualquiera puede renombrar un ejecutable a `.jpg`. Acepto JPEG, PNG, GIF, WebP,
MP4, QuickTime, WebM y AVI, con un máximo de 15 MB por archivo y 5 archivos por
avistamiento. Además configuré `MAX_CONTENT_LENGTH` para que Flask corte las
peticiones demasiado grandes antes de procesarlas.

**9. El nombre del archivo lo genera el servidor.**
En disco quedan con un nombre aleatorio (`secrets.token_hex`) más la extensión
que corresponde al contenido real, y el nombre original del usuario lo guardo
como texto en `nombre_archivo` solo para mostrarlo. Así evito que se
sobrescriban archivos, que entren caracteres raros, o que alguien use algo como
`../../` para escribir fuera de la carpeta.

**10. Primero escribo los archivos, después inserto, y si algo falla borro.**
El avistamiento y todos sus `registro` se insertan en una sola transacción: uso
la relación del modelo para que SQLAlchemy inserte el avistamiento, tome el
`id` que generó MySQL y se lo ponga a cada registro, con un solo `commit`. Si
la inserción falla, hago `rollback` y borro los archivos que ya había escrito.
De esa forma nunca quedan filas apuntando a archivos que no existen, ni
archivos sueltos ocupando espacio. Los guardo en `static/uploads/`, carpeta que
está versionada con un `.gitkeep` pero cuyo contenido no se sube al repo.

**11. El listado pagina en el servidor.**
Uso `LIMIT` y `OFFSET` más una consulta de conteo, en vez de traer todos los
avistamientos al navegador como hacía en la Tarea 1 con los datos de ejemplo.
Los filtros van por GET, así la URL queda compartible y los botones de
paginación son simplemente enlaces que mantienen los filtros. Como ya no hace
falta JavaScript, eliminé `datos.js` y `listado.js`. En el filtro por ave
muestro solo las especies que tienen al menos un avistamiento, no las 585.
Saqué las columnas "Tipo" y "Región y comuna" de la tabla por lo que explico en
la decisión 2. Para entrar al detalle puse un enlace "Ver detalle" en la última
columna en vez de un clic sobre la fila completa, porque así funciona con
teclado y sin JavaScript, y el HTML queda válido.

**12. Los últimos avistamientos de la portada van por `id`, no por fecha.**
El enunciado pide los últimos *agregados a la base*, que no es lo mismo que los
más recientes según la fecha del avistamiento: alguien puede registrar hoy algo
que vio hace meses. Por eso ordeno por `id` descendente.

## Notas

- La opción "Estadísticas" está en el menú y en la portada como pide el
  enunciado, pero al entrar avisa que los indicadores quedan para la siguiente
  tarea.
- A `region-comuna.sql` y `aves.sql` les agregué `USE tarea2;` al comienzo,
  porque los originales no indican a qué base de datos van.
- Las páginas generadas y la hoja de estilos pasan los validadores de HTML y
  CSS de W3C sin errores.
