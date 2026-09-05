/*  Estadisticas: indicadores y graficos

    Todos los valores se calculan a partir de los arreglos definidos en datos.js. No hay cifras escritas a mano en el
   HTML, entonces si los datos cambian, los indicadores y los graficos cambian con ellos.
   */




/* Calculos */

/* Cuenta cuantas veces aparece cada valor de una propiedad dentro del arreglo. Devuelve un objeto donde cada clave es un valor
   encontrado y su contenido la cantidad de repeticiones. */
function contarPorPropiedad(lista, propiedad) {
    const conteo = {};

    for (let i = 0; i < lista.length; i = i + 1) {
        const valor = lista[i][propiedad];

        if (conteo[valor] === undefined) {
            conteo[valor] = 1;
        } else {
            conteo[valor] = conteo[valor] + 1;
        }
    }

    return conteo;
}


/* Cantidad de nombres de ave distintos. Se reutiliza el conteo por propiedad, la cantidad de claves equivale a la cantidad de
   especies diferentes registradas. */
function contarEspeciesDistintas() {
    const conteo = contarPorPropiedad(AVISTAMIENTOS, "nombreAve");
    return Object.keys(conteo).length;
}


/* Devuelve la clave con el valor mas alto de un objeto de conteo. Si el arreglo esta vacio devuelve un guion, para que el indicador
   no quede en blanco. */
function obtenerClaveMasFrecuente(conteo) {
    const claves = Object.keys(conteo);

    if (claves.length === 0) {
        return "-";
    }

    let claveMayor = claves[0];

    for (let i = 1; i < claves.length; i = i + 1) {
        if (conteo[claves[i]] > conteo[claveMayor]) {
            claveMayor = claves[i];
        }
    }

    return claveMayor;
}


/* Cuenta los avistamientos de cada mes del año mas reciente presente en los datos. El año no se escribe fijo, se toma del primer
   avistamiento tras ordenar las fechas de mayor a menor. */
function contarPorMes() {
    const fechas = [];

    for (let i = 0; i < AVISTAMIENTOS.length; i = i + 1) {
        fechas.push(AVISTAMIENTOS[i].fecha);
    }

    fechas.sort();
    const anioReciente = fechas[fechas.length - 1].slice(0, 4);

    const conteoMeses = {};
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                          "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    /* Se inicializan los doce meses en cero para que el grafico muestre tambien los meses sin avistamientos. */
    for (let i = 0; i < nombresMeses.length; i = i + 1) {
        conteoMeses[nombresMeses[i]] = 0;
    }

    for (let i = 0; i < AVISTAMIENTOS.length; i = i + 1) {
        const fecha = AVISTAMIENTOS[i].fecha;

        if (fecha.slice(0, 4) === anioReciente) {
            /* El mes ocupa las posiciones 5 y 6 del formato AAAA-MM-DD. Se resta 1 porque el arreglo de nombres parte en cero. */
            const numeroMes = Number(fecha.slice(5, 7)) - 1;
            const nombreMes = nombresMeses[numeroMes];
            conteoMeses[nombreMes] = conteoMeses[nombreMes] + 1;
        }
    }

    return { anio: anioReciente, conteo: conteoMeses };
}


/* Devuelve el mayor valor de un objeto de conteo. Se usa como referencia para calcular la altura proporcional de las barras. */
function obtenerValorMaximo(conteo) {
    const claves = Object.keys(conteo);
    let maximo = 0;

    for (let i = 0; i < claves.length; i = i + 1) {
        if (conteo[claves[i]] > maximo) {
            maximo = conteo[claves[i]];
        }
    }

    return maximo;
}


/* Dibujado de indicadores */

function dibujarIndicadores() {
    const conteoAves = contarPorPropiedad(AVISTAMIENTOS, "nombreAve");

    document.getElementById("total-voluntarios").textContent = VOLUNTARIOS.length;
    document.getElementById("total-avistamientos").textContent = AVISTAMIENTOS.length;
    document.getElementById("total-especies").textContent = contarEspeciesDistintas();
    document.getElementById("ave-frecuente").textContent = obtenerClaveMasFrecuente(conteoAves);
}


/* Dibujado de graficos */

/* Construye una barra del grafico. Cada par etiqueta-valor se agrupa en un div, lo que el estandar HTML5 permite dentro de un dl.
   La altura es el unico estilo aplicado desde JavaScript, porque es un valor calculado que no puede estar en el css. */
function crearBarra(etiqueta, valor, valorMaximo) {
    const grupo = document.createElement("div");

    const termino = document.createElement("dt");
    termino.textContent = etiqueta;

    const definicion = document.createElement("dd");

    const barra = document.createElement("span");
    barra.className = "barra";
    barra.textContent = valor;

    let porcentaje = 0;
    if (valorMaximo > 0) {
        porcentaje = (valor / valorMaximo) * 100;
    }
    barra.style.height = porcentaje + "%";

    definicion.appendChild(barra);
    grupo.appendChild(definicion);
    grupo.appendChild(termino);

    return grupo;
}


function dibujarGrafico(idContenedor, conteo, etiquetas) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.textContent = "";

    const valorMaximo = obtenerValorMaximo(conteo);
    const claves = Object.keys(conteo);

    for (let i = 0; i < claves.length; i = i + 1) {
        const clave = claves[i];
        let etiqueta = clave;

        /* Si se entrega una tabla de equivalencias se muestra el nombre legible en lugar del valor interno. */
        if (etiquetas !== null && etiquetas[clave] !== undefined) {
            etiqueta = etiquetas[clave];
        }

        contenedor.appendChild(crearBarra(etiqueta, conteo[clave], valorMaximo));
    }
}


/* Tabla de voluntarios por region */

function dibujarTablaRegiones() {
    const conteo = contarPorPropiedad(VOLUNTARIOS, "region");
    const cuerpoTabla = document.getElementById("tabla-regiones");
    cuerpoTabla.textContent = "";

    const regiones = Object.keys(conteo);
    regiones.sort();

    for (let i = 0; i < regiones.length; i = i + 1) {
        const fila = document.createElement("tr");

        const celdaRegion = document.createElement("td");
        celdaRegion.textContent = regiones[i];

        const celdaCantidad = document.createElement("td");
        celdaCantidad.textContent = conteo[regiones[i]];

        fila.appendChild(celdaRegion);
        fila.appendChild(celdaCantidad);
        cuerpoTabla.appendChild(fila);
    }
}


/* Inicializacion */

function iniciarEstadisticas() {
    const contenedorIndicadores = document.getElementById("total-avistamientos");

    if (contenedorIndicadores === null) {
        return;
    }

    dibujarIndicadores();

    const conteoTipos = contarPorPropiedad(AVISTAMIENTOS, "tipo");
    dibujarGrafico("grafico-tipo", conteoTipos, TIPOS_AVE);

    const datosMeses = contarPorMes();
    dibujarGrafico("grafico-mes", datosMeses.conteo, null);

    /* El anio del grafico mensual se toma de los datos y no se escribe
       fijo en el HTML, para que no quede desactualizado. */
    document.getElementById("titulo-mes").textContent =
        "Avistamientos por mes (" + datosMeses.anio + ")";

    dibujarTablaRegiones();
}


document.addEventListener("DOMContentLoaded", iniciarEstadisticas);