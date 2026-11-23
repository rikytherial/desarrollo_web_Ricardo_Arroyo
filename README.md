# CC5002 - Desarrollo de Aplicaciones Web - Tarea 4

Ricardo Arroyo Santibáñez

Continuación de la Tarea 3. Agrega un buscador de avistamientos que consulta
mientras se escribe, y la posibilidad de evaluar cada avistamiento con una nota
de 1 a 7. Las dos funcionalidades son asíncronas y están implementadas con
Spring Boot y JPA, sobre la misma base de datos `tarea2`.

## Cómo ejecutarlo

Son dos aplicaciones sobre la misma base. Necesita MySQL Server 8 corriendo en
`localhost:3306`, JDK 21 o superior y, para el resto del sitio, Python 3.10 o
superior.

1. Crear la base de datos y cargar los datos, en este orden:

```
mysql -u root -p < sql/tarea2.sql
mysql -u root -p tarea2 < sql/region-comuna.sql
mysql -u root -p tarea2 < sql/aves.sql
mysql -u root -p tarea2 < sql/tabla-comentario.sql
mysql -u root -p tarea2 < sql/tabla-nota.sql
```

El quinto script es el que viene con el enunciado de esta tarea y agrega la
tabla `nota`. Los otros cuatro son los de las tareas anteriores.

2. Levantar la aplicación de esta entrega:

```
cd tarea4
.\mvnw spring-boot:run
```

Queda en `http://localhost:8080`, que es donde está el buscador.

3. Para navegar al resto del sitio desde el menú, levantar también la
aplicación Flask de las tareas anteriores con `python app.py`, que queda en
`http://localhost:5000`.

Usa las credenciales que indica el enunciado: base `tarea2`, usuario `cc5002`,
contraseña `programacionweb`.

## Estructura

Lo de esta tarea está todo dentro de `tarea4/`:

```
tarea4/pom.xml                              dependencias y version de Java
tarea4/src/main/resources/application.properties    conexion a MySQL
tarea4/src/main/java/avistamientos/tarea4/
    models/         entidades JPA, repositorios y el record de resultados
    services/       BuscadorService, con la logica del buscador y las notas
    controllers/    AppController (pagina) y ApiController (JSON)
tarea4/src/main/resources/templates/buscador.html   pantalla del buscador
tarea4/src/main/resources/static/js/buscador.js     busqueda y evaluacion asincronas
tarea4/src/main/resources/static/css/buscador.css   estilos propios del buscador
sql/tabla-nota.sql                          script que viene con el enunciado
```

El resto del repositorio es la aplicación Flask de las Tareas 2 y 3, que no
modifiqué.

## Librería externa

Ninguna. El buscador y la evaluación están escritos en JavaScript sin
bibliotecas, así que en esta entrega no hay licencias que declarar.

## Decisiones que tomé

**1. Spring Boot solo para lo nuevo, no migré el sitio completo.**
El enunciado pide que las funcionalidades nuevas se implementen con Spring
Boot. Lo consulté por correo con el aux y me confirmó que es solo lo
nuevo, usando la misma base de datos. Por eso quedaron dos aplicaciones: Flask
en el 5000 con las pantallas de las tareas anteriores, y Spring Boot en el 8080
con el buscador. Las dos leen y escriben sobre `tarea2`.

**2. Hibernate no toca el esquema.**
Dejé `spring.jpa.hibernate.ddl-auto=none`. El esquema ya existe desde la Tarea
2 y tiene datos cargados, así que con `update` Hibernate podría alterar las
tablas. La contra es que si falta una tabla no avisa al arrancar y la
aplicación falla recién en la primera consulta.

**3. Los identificadores van con `IDENTITY`.**
Las tablas de este proyecto usan `AUTO_INCREMENT`. Por eso usé
`@GeneratedValue(strategy = GenerationType.IDENTITY)` y no un generador de
secuencia, MySQL no tiene secuencias y Hibernate las emula creando una tabla
extra que no quiero en mi base.

**4. El filtrado lo hace MySQL, no Java.**
La búsqueda es una consulta JPQL con los tres JOIN y `LIKE` sobre nombre de
ave, de voluntario y de comuna. La alternativa era traer todos los
avistamientos y filtrarlos en memoria, que significa leer la tabla completa en
cada tecla que se escribe. Además escapo `%` y `_` con `ESCAPE '!'` antes de
armar el patrón, pues sin eso, escribir un `%` en el buscador devolvería todos los
avistamientos, porque es el comodín de SQL.

**5. Los promedios salen en una sola consulta.**
Una vez que tengo los avistamientos encontrados, pido los promedios de todos
ellos con un `GROUP BY` sobre `nota`. Pedir el promedio uno por uno serían 21
consultas para 20 resultados.

**6. La nota llega al servidor como texto y no como entero.**
Si el parámetro fuera `int`, un envío con `"abc"` lo rechazaría Spring con su
propio error antes de llegar a mi código, y la respuesta no sería el JSON que
espera el cliente. Recibiéndola como `String` valido yo y devuelvo `400` con mi
mensaje. Compruebo que sean solo dígitos y que el valor esté entre 1 y 7; la
tabla `nota` no tiene `CHECK`, así que ese rango lo garantiza únicamente el
servidor.

**7. El patrón buscado viaja como parámetro de consulta.**
Uso `/api/buscar?q=...` y no `/api/buscar/{texto}`. Con el texto dentro de la
ruta, el campo vacío produce una URL terminada en `/` que responde 404, y un
`/` escrito por el usuario parte la URL en dos. Como parámetro, ambos casos son
texto normal. En el cliente lo paso por `encodeURIComponent`.

**8. El resaltado lo armo con nodos del DOM, no con `innerHTML`.**
Lo natural para destacar el texto buscado sería reemplazarlo por `<mark>` dentro
de un `innerHTML`, pero eso convierte en HTML ejecutable todo lo que venga de la
base o escriba el usuario. En vez de eso parto el texto y voy agregando nodos
con `createTextNode` y elementos `<mark>` con `textContent`. Lo comprobé
escribiendo `<img src=x onerror=...>` en el buscador, aparece como texto y no se
ejecuta. Es la misma regla que usé con los comentarios en la Tarea 3.

**9. La búsqueda espera 300 ms y descarta las respuestas atrasadas.**
El enunciado pide buscar mientras se escribe, pero sin espera se dispara una
petición por cada tecla. Espero 300 ms desde la última tecla. Además llevo un
contador de secuencia tal que si escribo "pa" y luego "pato", la respuesta de "pa"
puede llegar después y pisar los resultados buenos, así que descarto toda
respuesta que no corresponda a la última búsqueda pedida.

**10. El día y el promedio los formatea el servidor.**
El día viaja como `dd-mm-yyyy` y el promedio con un decimal y coma, armados en
Java. Es la misma decisión que tomé con la fecha de los comentarios en la Tarea
3: así el formato no depende del idioma ni de la zona horaria del navegador.

## Notas

- La pantalla del buscador y las hojas de estilo pasan los validadores de HTML
  y CSS de W3C sin errores.
- Probé la validación del servidor saltándome el navegador, enviando POST desde
  la consola con `9`, `0`, `-3`, `3.5`, `abc`, el campo vacío y sin el
  parámetro y las siete respuestas son `400` con su mensaje, y un POST a un
  avistamiento inexistente responde `404`.
- El selector de nota se bloquea mientras viaja la petición, para que dos
  selecciones rápidas no inserten dos notas.
- La tabla `nota` no tiene restricción de unicidad sobre `avistamiento_id`, así
  que un avistamiento acumula varias notas y lo que muestro en la columna es el
  promedio. Si todavía no tiene ninguna, muestra `-`.