/* Listado de avistamientos: filtro, ordenamiento y paginacion: */

/* Pagina que se esta mostrando, correspondiente al unico estado que mantiene
   el modulo, el resto se recalcula en cada dibujado. */
let paginaActual = 1;


/* Obtencion de los datos a mostrar */

/* Devuelve una copia filtrada por tipo de ave. Se trabaja sobre una copia porque sort() ordena en el lugar y modificaria el arreglo
   original de datos. */
function filtrarPorTipo(tipoSeleccionado) {
    if (tipoSeleccionado === "todos") {
        return AVISTAMIENTOS.slice();
    }

    return AVISTAMIENTOS.filter(function (avistamiento) {
        return avistamiento.tipo === tipoSeleccionado;
    });
}


/* Ordena la lista segun el campo y la direccion indicados. Las fechas se comparan como texto porque el formato AAAA-MM-DD
   es ordenable alfabeticamente. Los textos se comparan en minusculas para que el orden no dependa de mayusculas. */
function ordenarAvistamientos(lista, campo, direccion) {
    lista.sort(function (a, b) {
        let valorA = a[campo];
        let valorB = b[campo];

        if (campo !== "fecha") {
            valorA = valorA.toLowerCase();
            valorB = valorB.toLowerCase();
        }

        if (valorA < valorB) {
            return -1;
        }
        if (valorA > valorB) {
            return 1;
        }
        return 0;
    });

    if (direccion === "desc") {
        lista.reverse();
    }

    return lista;
}


/*Construccion de la tabla */

/* Crea una celda de tabla con el texto indicado. Se usa textContent y no innerHTML para que el contenido se inserte como texto y no
   se interprete como HTML. */
function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
}


function crearFila(avistamiento) {
    const fila = document.createElement("tr");

    fila.appendChild(crearCelda(avistamiento.fecha));
    fila.appendChild(crearCelda(avistamiento.hora));
    fila.appendChild(crearCelda(avistamiento.nombreAve));
    fila.appendChild(crearCelda(TIPOS_AVE[avistamiento.tipo]));
    fila.appendChild(crearCelda(avistamiento.lugar));
    fila.appendChild(crearCelda(avistamiento.comuna + ", " + avistamiento.region));
    fila.appendChild(crearCelda(avistamiento.voluntario));
    fila.appendChild(crearCelda(avistamiento.evidencia));

    return fila;
}


/* Dibujado del listado*/

function dibujarListado() {
    const tipoSeleccionado = document.getElementById("filtro-tipo").value;
    const campoOrden = document.getElementById("orden-campo").value;
    const direccionOrden = document.getElementById("orden-direccion").value;
    const porPagina = Number(document.getElementById("por-pagina").value);

    const listaFiltrada = filtrarPorTipo(tipoSeleccionado);
    const listaOrdenada = ordenarAvistamientos(listaFiltrada, campoOrden, direccionOrden);

    const totalResultados = listaOrdenada.length;
    const totalPaginas = Math.max(1, Math.ceil(totalResultados / porPagina));

    /* Si el filtro dejo menos paginas de las que habia, la pagina actual podria quedar fuera de rango. */
    if (paginaActual > totalPaginas) {
        paginaActual = totalPaginas;
    }

    const desde = (paginaActual - 1) * porPagina;
    const hasta = desde + porPagina;
    const listaPagina = listaOrdenada.slice(desde, hasta);

    const cuerpoTabla = document.getElementById("cuerpo-tabla");
    cuerpoTabla.textContent = "";

    for (let i = 0; i < listaPagina.length; i = i + 1) {
        cuerpoTabla.appendChild(crearFila(listaPagina[i]));
    }

    document.getElementById("contador").textContent =
        "Mostrando " + listaPagina.length + " de " + totalResultados + " avistamientos";

    document.getElementById("sin-resultados").hidden = (totalResultados > 0);

    document.getElementById("indicador-pagina").textContent =
        "Pagina " + paginaActual + " de " + totalPaginas;

    document.getElementById("btn-anterior").disabled = (paginaActual === 1);
    document.getElementById("btn-siguiente").disabled = (paginaActual === totalPaginas);
}


/* Inicializacion */

/* Cualquier cambio en los filtros vuelve a la primera pagina, si el usuario esta en la pagina 3 y filtra, esperar que siga en la 3 no
   tiene sentido. */
function alCambiarFiltro() {
    paginaActual = 1;
    dibujarListado();
}


function iniciarListado() {
    const cuerpoTabla = document.getElementById("cuerpo-tabla");

    if (cuerpoTabla === null) {
        return;
    }

    document.getElementById("filtro-tipo").addEventListener("change", alCambiarFiltro);
    document.getElementById("orden-campo").addEventListener("change", alCambiarFiltro);
    document.getElementById("orden-direccion").addEventListener("change", alCambiarFiltro);
    document.getElementById("por-pagina").addEventListener("change", alCambiarFiltro);

    document.getElementById("btn-anterior").addEventListener("click", function () {
        if (paginaActual > 1) {
            paginaActual = paginaActual - 1;
            dibujarListado();
        }
    });

    document.getElementById("btn-siguiente").addEventListener("click", function () {
        paginaActual = paginaActual + 1;
        dibujarListado();
    });

    dibujarListado();
}


document.addEventListener("DOMContentLoaded", iniciarListado);