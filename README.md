# CC5002 - Desarrollo de Aplicaciones Web - Tarea 3

Ricardo Arroyo Santibáñez

Continuación de la Tarea 2. Agrega comentarios a los avistamientos y la
pantalla de estadísticas con tres gráficos, ambos mediante llamadas asíncronas
desde el navegador.

## Cómo ejecutarlo

Necesita Python 3.10 o superior y MySQL Server 8 corriendo en `localhost:3306`.

1. Crear la base de datos y cargar los datos, en este orden:

```
mysql -u root -p < sql/tarea2.sql
mysql -u root -p tarea2 < sql/region-comuna.sql
mysql -u root -p tarea2 < sql/aves.sql
mysql -u root -p tarea2 < sql/tabla-comentario.sql
```
El cuarto script es el que viene con el enunciado de esta tarea y agrega la
tabla `comentario`. Los otros tres son los mismos de la Tarea 2.

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
app.py                      rutas de Flask y endpoints JSON
modelo.py                   modelos SQLAlchemy de las siete tablas
validaciones.py             validaciones del lado del servidor
archivos.py                 validación y guardado de los archivos subidos
templates/                  plantillas Jinja2
static/css/estilos.css      hoja de estilos
static/js/                  validaciones y llamadas asíncronas del cliente
static/uploads/             archivos subidos (carpeta versionada, contenido ignorado)
sql/                        scripts de creación y carga de datos
```

## Librería externa

Los gráficos usan **Highcharts 12.1.2**, cargada desde su CDN oficial en
`templates/estadisticas.html`. Highcharts no es software libre, es gratuita
para trabajo académico de estudiantes, por esa misma razón **no incluí el
archivo en el repositorio**, ya que redistribuirlo no está cubierto por esa
licencia. Tampoco desactivé la marca de agua "Highcharts.com" de cada gráfico.

La elegí sobre Flot porque trae los tres tipos que pide el enunciado (líneas,
torta y columnas) en un solo archivo, mientras que Flot necesita jQuery más el
plugin `jquery.flot.pie.js` aparte.

## Decisiones que tomé

**1. La fecha del comentario la pone el servidor.**
La columna `fecha` es `TIMESTAMP NOT NULL` sin `DEFAULT`. Verifiqué que en mi
instalación `explicit_defaults_for_timestamp` vale 1, lo que significa que la
columna no recibe `DEFAULT CURRENT_TIMESTAMP` automático y que asignarle NULL
no guarda la hora actual. Por eso la escribo explícitamente con
`datetime.now()` al insertar, igual que ya hacía con `fecha_registro` del
voluntario. Así el código funciona sin depender de cómo esté configurado el
servidor donde se corrija.

**2. El largo máximo del texto lo impone la tabla, no el enunciado.**
El enunciado solo fija un mínimo de 5 caracteres para el comentario. Agregué un
máximo de 300 porque la columna es `VARCHAR(300)`, sin ese tope, un comentario
más largo rompería el INSERT o MySQL lo truncaría de manera silenciosa. El nombre lo
validé a 50 por el enunciado, aunque la columna admita 80.

**3. Una sola URL para los comentarios, con dos métodos.**
`/avistamientos/<id>/comentarios` responde `GET` para listar y `POST` para
agregar. Preferí eso a inventar una URL tipo `/agregar-comentario`, porque el
recurso es el mismo y lo que cambia es la operación.

**4. Esa URL responde JSON, no HTML.**
Como el enunciado pide que agregar y listar comentarios sean llamadas
asíncronas, la respuesta la consume JavaScript, no el navegador directamente.
Devuelvo `201` con el comentario creado, `400` con un diccionario de errores
por campo, `404` si el avistamiento no existe y `500` si falla la inserción.

**5. El XSS lo neutralizo al mostrar, no al guardar.**
Los comentarios se guardan tal como los escribe el usuario, sin filtrar
caracteres. Esto debido a que armo cada `<li>` con `createElement` y `textContent`,
nunca con `innerHTML`. Así el navegador escapa el contenido solo.
Lo comprobé con `<img src=x onerror="...">`, que queda
visible como texto y no se ejecuta.

**6. Valido dos veces y muestro todos los errores juntos.**
El JavaScript valida antes de enviar y el servidor vuelve a validar desde cero,
porque el cliente se puede desactivar o saltar. Las dos validaciones acumulan
los errores en vez de detenerse en el primero, para que la persona vea todos
los problemas de una vez. En el cliente reutilicé `validarTextoObligatorio` de
la Tarea 1, que ya hace trim y revisa mínimo y máximo.

**7. El botón se desactiva mientras viaja la petición.**
Sin eso, un doble clic inserta el mismo comentario dos veces.

**8. Los tres gráficos piden sus datos a una sola URL.**
`/estadisticas/datos` devuelve los tres conjuntos en una respuesta. Los tres
gráficos se muestran siempre juntos, así que tres llamadas separadas serían
tres viajes al servidor para la misma pantalla.

**9. Las agregaciones las hace MySQL.**
Los tres totales salen de consultas con `GROUP BY`. La alternativa era traer
todos los avistamientos y contarlos en Python, que no escala.

**10. En el gráfico de líneas relleno con cero los días sin avistamientos.**
Mis avistamientos están repartidos en varios meses. Si graficara solo los días
con registros, la línea uniría dos fechas distantes con una recta y daría a
entender que hubo actividad constante en el medio. Rellenando, la línea baja a
cero donde corresponde. Además el eje X va como `datetime` y no como
categorías de texto: con categorías todos los días ocupan el mismo ancho y el
eje queda ilegible, mientras que así Highcharts rotula por mes y cada punto
queda en su posición temporal real.

**11. "Tipo de ave" es la especie del catálogo.**
Misma decisión de la Tarea 2: la tabla `ave` solo tiene `id` y `nombre`, sin
columna de clasificación por tipo, así que el gráfico de torta agrupa por
especie.

**12. El gráfico de comunas usa `column` y no `bar`.**
En Highcharts `bar` son barras horizontales. El enunciado pide las comunas en
el eje X y el total en el eje Y, que corresponde a `column`.

## Notas

- Si un gráfico no tiene datos, se muestra un aviso en su lugar en vez de un
  recuadro vacío.
- Las páginas nuevas (detalle con comentarios y estadísticas) y la hoja de
  estilos pasan los validadores de HTML y CSS de W3C sin errores.
- Pensando en entradas maliciosas, los parámetros de URL siguen pasando por las
  listas blancas de la Tarea 2, el identificador del avistamiento va como
  `<int:...>` en la ruta (Flask rechaza cualquier otra cosa antes de ejecutar
  mi código), y las consultas van siempre parametrizadas por SQLAlchemy.