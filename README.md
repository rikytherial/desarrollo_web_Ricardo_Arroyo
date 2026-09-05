# Desarrollo De Aplicaciones Web — Tarea 1 

Prototipo del sistema de gestión de avistamientos de aves para la Unión de
Ornitólogos de Chile.

- **Autor:** Ricardo Arroyo
- **Curso:** CC5002 — Desarrollo de Aplicaciones Web
- **Profesor:** José Urzúa
- **Rama de entrega:** `Tarea_1`

---

## Cómo ejecutar

No requiere servidor web. Abrir `index.html` directamente en el navegador. Las
páginas están enlazadas entre sí mediante rutas relativas.

---

## Nombre de la rama

El enunciado solicita una rama llamada `Tarea 1`. Pero me fije que Git no admite espacios en los
nombres de referencia, por lo que el comando falla y finalmente la rama se nombró **`Tarea_1`**.

---

## Estructura del proyecto

```
├── index.html                      Portada
├── registro-voluntario.html        Formulario de registro de voluntario/a
├── reportar-avistamiento.html      Formulario de reporte de avistamiento
├── avistamientos.html              Listado con filtro, orden y paginación
├── estadisticas.html               Indicadores y gráficos
├── css/
│   └── estilos.css                 Hoja de estilos única
├── js/
│   ├── datos.js                    Datos de ejemplo
│   ├── regiones-comunas.js         Regiones y comunas, selectores encadenados
│   ├── validaciones.js             Reglas de validación reutilizables
│   ├── validacion-voluntario.js    Conector del formulario de registro
│   ├── validacion-avistamiento.js  Conector del formulario de reporte
│   ├── listado.js                  Filtro, ordenamiento y paginación
│   └── estadisticas.js             Cálculo de indicadores y gráficos
└── img/
```

Se usa una sola hoja de estilos porque el encabezado, la navegación y el pie son
idénticos en las cinco páginas. Los scripts, en cambio, están separados por
responsabilidad y cada página enlaza solo los que necesita.

---

## Decisiones a tener en cuenta para la corrección

### Cinco páginas separadas

Un archivo HTML por cada objetivo del enunciado, más una portada. El enunciado
indica desarrollar archivos HTML y enlazarlos entre ellos, lo que apunta a
navegación entre documentos. El registro de voluntario y el reporte de
avistamiento se mantienen separados porque corresponden a acciones distintas en
el tiempo: el registro ocurre una vez, el reporte se repite por cada
avistamiento.

### Separación entre reglas de validación y su aplicación

`js/validaciones.js` contiene las reglas como funciones puras: reciben un valor
y devuelven un mensaje de error, o cadena vacía si es válido. No acceden al DOM.
Los archivos `validacion-voluntario.js` y `validacion-avistamiento.js` leen el
formulario, invocan estas reglas y muestran los mensajes.

Esta separación evita duplicar reglas que ambos formularios comparten, como la
del correo electrónico.

### Las validaciones son todas en JavaScript

Los formularios llevan el atributo `novalidate`. Sin él, el navegador validaría
por su cuenta los campos con `type="email"` y mostraría sus propias burbujas
antes de ejecutar el código propio. Dado que el enunciado descarta `required`
como validación y exige que se hagan en JavaScript, `novalidate` garantiza que
el control de los datos pase efectivamente por el código escrito.

Los formularios validan todos sus campos antes de informar, en lugar de
detenerse en el primer error, de modo que el usuario vea todos los problemas de
una vez.

### Región y comuna son selectores encadenados

Las comunas disponibles dependen de la región seleccionada. Se prefirió esta
solución sobre un campo de texto libre porque impide por construcción que se
ingrese una comuna inexistente o que no corresponda a la región elegida, en
lugar de tener que detectarlo mediante validación.

Ambos `<select>` se declaran en el HTML solo con su opción vacía inicial; las
regiones y comunas se definen en `js/regiones-comunas.js` y se insertan al
cargar la página. Esto evita duplicar los datos en los dos formularios que los
necesitan.

Se incluye una selección de comunas por región y no la totalidad del país, por
tratarse de un prototipo. En un sistema real este listado provendría de la base
de datos.

### El reporte de avistamiento identifica al voluntario

El enunciado señala que son "los voluntarios registrados" quienes informan
avistamientos, por lo que el formulario pide el correo de la persona que
reporta. En un sistema real este dato provendría de la sesión iniciada.

### Tipo de ave con `<select>`, nombre del ave con `<datalist>`

El tipo de ave es un conjunto cerrado de seis categorías definidas por el
sistema, por lo que corresponde un `<select>`. El nombre del ave, en cambio, no
puede restringirse: en Chile hay cientos de especies y una lista cerrada dejaría
fuera avistamientos válidos. Se usó `<datalist>`, que sugiere las especies más
comunes sin impedir escribir cualquier otro nombre.

### El archivo de evidencia se valida en JavaScript

El atributo `accept` del `<input type="file">` solo filtra el diálogo de
selección: el usuario puede cambiar el filtro y elegir cualquier archivo. Por
eso el tipo se verifica en el código. El tamaño, además, no tiene ningún
atributo HTML que lo limite, por lo que solo puede comprobarse
programáticamente.

### La tabla del listado contiene datos tabulares

El listado de avistamientos usa `<table>` porque cada fila es un avistamiento y
cada columna un atributo del mismo tipo en todas las filas. No se usaron tablas
para maquetar en ninguna otra parte del sitio: los formularios y la disposición
de las páginas se resuelven con CSS.

### Los datos que se muestran son de ejemplo

El listado y las estadísticas se construyen a partir de los arreglos definidos
en `js/datos.js`. El enunciado indica que no es necesario almacenar la
información ingresada, por lo que los formularios no persisten nada: al enviar
un formulario válido se muestra un mensaje de éxito en la misma página y se
limpian los campos.

### Los indicadores se calculan, no se escriben

Todos los valores numéricos de la página de estadísticas están vacíos en el HTML
y se calculan en JavaScript a partir del mismo arreglo que alimenta el listado,
incluido el año del gráfico mensual. Esto evita que los indicadores queden
desincronizados respecto a los datos que muestran.

### Los gráficos se construyen con listas de descripción

Los gráficos se arman con `<dl>`, donde cada `<dt>` es la etiqueta de una barra
y cada `<dd>` su valor. La altura proporcional la calcula el JavaScript y se
aplica como porcentaje.

Se descartaron dos alternativas. Una biblioteca externa habría resuelto el
problema en pocas líneas, pero se prefirió escribir el código propio. Y
`<canvas>` habría dibujado el gráfico como imagen, dejando los datos fuera del
documento: no serían seleccionables ni accesibles. Con `<dl>` la información
sigue siendo texto y el gráfico es solo su representación visual.

### Sobre las etiquetas utilizadas

El nombre del sitio en el encabezado no es un `<h1>`. El `<h1>` se reserva para
el título propio de cada página, de modo que cada documento tenga un encabezado
principal distinto y descriptivo. La apariencia destacada del nombre del sitio
se resuelve por CSS.

Los campos de formulario se agrupan con `<p class="campo">` y no con `<div>`,
ya que todos los elementos involucrados (`label`, `input`, `small`, `span`) son
contenido de frase y un párrafo puede contenerlos válidamente.

En cada página, el enlace de navegación correspondiente lleva
`aria-current="page"`. Se prefirió sobre una clase CSS porque cumple la misma
función como selector de estilo, y además indica el estado a las tecnologías de
asistencia. El contador de resultados del listado usa `role="status"` por la
misma razón: al cambiar el filtro, el nuevo total se anuncia sin que el usuario
deba navegar hasta él.

El contenido generado desde JavaScript se inserta con `createElement` y
`textContent`, no con `innerHTML`, para que los datos se traten como texto y no
se interpreten como HTML.

### Diseño responsive

Las tarjetas de la portada, los indicadores de estadísticas y los filtros del
listado se distribuyen con `grid-template-columns: repeat(auto-fit, minmax(...,
1fr))`. El navegador acomoda tantas columnas como quepan sin bajar del ancho
mínimo indicado, por lo que el diseño se adapta solo al ancho disponible.

Se usa una única media query, para pantallas bajo 600px, que resuelve lo que la
grilla no cubre: la navegación pasa a disposición vertical y los botones ocupan
el ancho completo.

Los tamaños de texto y los espaciados están en `rem`, de modo que escalen si el
usuario aumenta el tamaño de letra en su navegador.

---

## Reglas de validación

Los campos obligatorios están marcados con asterisco en cada formulario.

Las validaciones de comuna respecto de región, y de hora respecto de fecha, son
cruzadas, es decir, dependen del valor de otro campo del mismo formulario.

Los campos de texto se validan aplicando `trim()`, de modo que un campo con solo
espacios se trate como vacío.

---

## Validación W3C

HTML5 y CSS3 validados sin errores con los validadores del W3C
(`validator.w3.org` y `jigsaw.w3.org/css-validator`) el 03/09/2026.
