/* Buscador de avistamientos con llamadas asincronas.

   Dos decisiones que vale la pena dejar escritas:

   1. Nada se pinta con innerHTML. Los nombres de ave, voluntario y comuna
      salen de la base de datos y el patron lo escribe el usuario, asi que todo
      entra por textContent o por createTextNode. Es la misma regla que use en
      los comentarios de la Tarea 3.

   2. El destacado del patron NO se hace reemplazando texto por "<mark>...",
      porque eso obliga a usar innerHTML. Se construye con nodos del DOM. */

const ESPERA_ANTES_DE_BUSCAR = 300;
const NOTA_MINIMA = 1;
const NOTA_MAXIMA = 7;

const campoPatron = document.getElementById("patron");
const contenedorResultados = document.getElementById("resultados");

let temporizador = null;

/* Numero de la ultima busqueda pedida. Sirve para descartar respuestas que
   llegan tarde: si se escribe "pa" y luego "pato", la respuesta de "pa" puede
   volver despues de la de "pato" y pisar los resultados buenos. */
let ultimaBusqueda = 0;


/* Devuelve un fragmento con el texto, donde cada aparicion del patron queda
   envuelta en un <mark>. Compara en minusculas pero conserva el texto
   original, para que "RANCAGUA" se destaque igual al escribir "ran". */
function resaltar(texto, patron) {
    const fragmento = document.createDocumentFragment();

    if (patron === "") {
        fragmento.appendChild(document.createTextNode(texto));
        return fragmento;
    }

    const textoMinuscula = texto.toLowerCase();
    const patronMinuscula = patron.toLowerCase();

    let desde = 0;
    let posicion = textoMinuscula.indexOf(patronMinuscula, desde);

    while (posicion !== -1) {
        if (posicion > desde) {
            fragmento.appendChild(
                document.createTextNode(texto.slice(desde, posicion))
            );
        }

        const marca = document.createElement("mark");
        marca.textContent = texto.slice(posicion, posicion + patron.length);
        fragmento.appendChild(marca);

        desde = posicion + patron.length;
        posicion = textoMinuscula.indexOf(patronMinuscula, desde);
    }

    if (desde < texto.length) {
        fragmento.appendChild(document.createTextNode(texto.slice(desde)));
    }

    return fragmento;
}


function celdaConResaltado(texto, patron) {
    const celda = document.createElement("td");
    celda.appendChild(resaltar(texto, patron));
    return celda;
}


function vaciar(elemento) {
    while (elemento.firstChild !== null) {
        elemento.removeChild(elemento.firstChild);
    }
}


function mostrarAviso(mensaje, esError) {
    vaciar(contenedorResultados);

    const aviso = document.createElement("p");
    if (esError === true) {
        aviso.className = "error";
    }
    aviso.textContent = mensaje;
    contenedorResultados.appendChild(aviso);
}


/* Arma el <select> con las notas 1 a 7. Al elegir una se envia de inmediato,
   tal como pide el enunciado: "al seleccionar la nota, se debe agregar esta
   nueva nota asociada al avistamiento en la base de datos". */
function crearSelectorNota(idAvistamiento, celdaNota, celdaAccion) {
    const selector = document.createElement("select");
    selector.className = "selector-nota";

    const etiqueta = document.createElement("option");
    etiqueta.value = "";
    etiqueta.textContent = "Nota...";
    etiqueta.selected = true;
    etiqueta.disabled = true;
    selector.appendChild(etiqueta);

    for (let valor = NOTA_MINIMA; valor <= NOTA_MAXIMA; valor = valor + 1) {
        const opcion = document.createElement("option");
        opcion.value = String(valor);
        opcion.textContent = String(valor);
        selector.appendChild(opcion);
    }

    selector.addEventListener("change", function () {
        enviarNota(idAvistamiento, selector, celdaNota, celdaAccion);
    });

    return selector;
}


function crearBotonEvaluar(idAvistamiento, celdaNota, celdaAccion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-evaluar";
    boton.textContent = "evaluar";

    boton.addEventListener("click", function () {
        vaciar(celdaAccion);
        const selector = crearSelectorNota(idAvistamiento, celdaNota, celdaAccion);
        celdaAccion.appendChild(selector);
        selector.focus();
    });

    return boton;
}


function enviarNota(idAvistamiento, selector, celdaNota, celdaAccion) {
    /* Se bloquea el selector mientras viaja la peticion, para que dos
       selecciones rapidas no inserten dos notas. */
    selector.disabled = true;

    const cuerpo = new FormData();
    cuerpo.append("nota", selector.value);

    fetch("/api/avistamientos/" + idAvistamiento + "/notas", {
        method: "POST",
        body: cuerpo
    })
        .then(function (respuesta) {
            return respuesta.json().then(function (datos) {
                return { ok: respuesta.ok, datos: datos };
            });
        })
        .then(function (resultado) {
            if (resultado.ok === false) {
                selector.disabled = false;
                mostrarErrorEnFila(celdaAccion, resultado.datos.error);
                return;
            }

            /* El servidor devuelve el promedio ya recalculado, asi que la
               interfaz se actualiza sin volver a consultar ni recargar. */
            celdaNota.textContent = resultado.datos.nota;
            vaciar(celdaAccion);
            celdaAccion.appendChild(
                crearBotonEvaluar(idAvistamiento, celdaNota, celdaAccion)
            );
        })
        .catch(function () {
            selector.disabled = false;
            mostrarErrorEnFila(celdaAccion, "No fue posible guardar la nota.");
        });
}


function mostrarErrorEnFila(celdaAccion, mensaje) {
    const anterior = celdaAccion.querySelector(".error-nota");
    if (anterior !== null) {
        celdaAccion.removeChild(anterior);
    }

    const aviso = document.createElement("span");
    aviso.className = "error-nota";
    aviso.textContent = mensaje;
    celdaAccion.appendChild(aviso);
}


function crearFila(resultado, patron) {
    const fila = document.createElement("tr");

    fila.appendChild(celdaConResaltado(resultado.voluntario, patron));

    const celdaDia = document.createElement("td");
    celdaDia.textContent = resultado.dia;
    fila.appendChild(celdaDia);

    fila.appendChild(celdaConResaltado(resultado.ave, patron));
    fila.appendChild(celdaConResaltado(resultado.comuna, patron));

    const celdaNota = document.createElement("td");
    celdaNota.className = "celda-nota";
    celdaNota.textContent = resultado.nota;
    fila.appendChild(celdaNota);

    const celdaAccion = document.createElement("td");
    celdaAccion.appendChild(
        crearBotonEvaluar(resultado.id, celdaNota, celdaAccion)
    );
    fila.appendChild(celdaAccion);

    return fila;
}


function pintarResultados(resultados, patron) {
    vaciar(contenedorResultados);

    if (resultados.length === 0) {
        mostrarAviso(
            "No se encontraron avistamientos que coincidan con “" + patron + "”.",
            false
        );
        return;
    }

    const total = document.createElement("p");
    total.className = "total-resultados";
    if (resultados.length === 1) {
        total.textContent = "1 avistamiento encontrado.";
    } else {
        total.textContent = resultados.length + " avistamientos encontrados.";
    }
    contenedorResultados.appendChild(total);

    const tabla = document.createElement("table");
    tabla.className = "tabla-resultados";

    const encabezado = document.createElement("thead");
    const filaEncabezado = document.createElement("tr");
    const titulos = ["Voluntario/a", "Día", "Ave", "Comuna", "Nota", "Evaluar"];

    for (let i = 0; i < titulos.length; i = i + 1) {
        const celda = document.createElement("th");
        celda.scope = "col";
        celda.textContent = titulos[i];
        filaEncabezado.appendChild(celda);
    }

    encabezado.appendChild(filaEncabezado);
    tabla.appendChild(encabezado);

    const cuerpo = document.createElement("tbody");
    for (let i = 0; i < resultados.length; i = i + 1) {
        cuerpo.appendChild(crearFila(resultados[i], patron));
    }
    tabla.appendChild(cuerpo);

    contenedorResultados.appendChild(tabla);
}


function buscar(patron) {
    ultimaBusqueda = ultimaBusqueda + 1;
    const numeroDeEstaBusqueda = ultimaBusqueda;

    /* encodeURIComponent es obligatorio: sin el, un "&", un "#" o un "+"
       escritos en el campo romperian la URL. */
    fetch("/api/buscar?q=" + encodeURIComponent(patron))
        .then(function (respuesta) {
            if (respuesta.ok === false) {
                throw new Error("respuesta no exitosa");
            }
            return respuesta.json();
        })
        .then(function (datos) {
            // Llego tarde: ya se pidio una busqueda mas nueva.
            if (numeroDeEstaBusqueda !== ultimaBusqueda) {
                return;
            }
            pintarResultados(datos.resultados, patron);
        })
        .catch(function () {
            if (numeroDeEstaBusqueda !== ultimaBusqueda) {
                return;
            }
            mostrarAviso("No fue posible realizar la búsqueda.", true);
        });
}


/* El enunciado pide buscar "cuando el usuario comience a escribir", pero sin
   espera se dispara una peticion por cada tecla. Se espera 300 ms desde la
   ultima tecla y recien ahi se consulta. */
function alEscribir() {
    const patron = campoPatron.value.trim();

    if (temporizador !== null) {
        window.clearTimeout(temporizador);
    }

    if (patron === "") {
        ultimaBusqueda = ultimaBusqueda + 1;
        vaciar(contenedorResultados);
        return;
    }

    temporizador = window.setTimeout(function () {
        buscar(patron);
    }, ESPERA_ANTES_DE_BUSCAR);
}


function iniciarBuscador() {
    if (campoPatron === null) {
        return;
    }

    campoPatron.addEventListener("input", alEscribir);

    /* El formulario existe para que la pagina funcione como formulario de
       busqueda, pero nunca se envia: todo viaja por fetch. */
    document.getElementById("form-buscador").addEventListener(
        "submit",
        function (evento) {
            evento.preventDefault();
        }
    );
}


document.addEventListener("DOMContentLoaded", iniciarBuscador);
