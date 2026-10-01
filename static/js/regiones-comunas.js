/* Llenado de los selectores de region y comuna.

   
   Flask obtiene los datos desde la base de datos y la plantilla los deja en la
   variable global DATOS_GEOGRAFICOS.
*/

const REGIONES = (typeof DATOS_GEOGRAFICOS === "undefined") ? [] : DATOS_GEOGRAFICOS;


function vaciarSelector(selector, textoInicial) {
    selector.textContent = "";

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = textoInicial;
    selector.appendChild(opcionInicial);
}


function buscarRegion(idRegion) {
    for (let i = 0; i < REGIONES.length; i++) {
        if (String(REGIONES[i].id) === String(idRegion)) {
            return REGIONES[i];
        }
    }
    return null;
}


function llenarSelectorRegiones() {
    const selectorRegion = document.getElementById("region");

    if (selectorRegion === null) {
        return;
    }

    vaciarSelector(selectorRegion, "Seleccione región");

    for (let i = 0; i < REGIONES.length; i++) {
        const opcion = document.createElement("option");
        opcion.value = REGIONES[i].id;
        opcion.textContent = REGIONES[i].nombre;
        selectorRegion.appendChild(opcion);
    }
}


function llenarSelectorComunas(idRegion) {
    const selectorComuna = document.getElementById("comuna");

    if (selectorComuna === null) {
        return;
    }

    vaciarSelector(selectorComuna, "Seleccione comuna");

    if (idRegion === "") {
        return;
    }

    const region = buscarRegion(idRegion);

    if (region === null) {
        return;
    }

    for (let i = 0; i < region.comunas.length; i++) {
        const opcion = document.createElement("option");
        opcion.value = region.comunas[i].id;
        opcion.textContent = region.comunas[i].nombre;
        selectorComuna.appendChild(opcion);
    }
}


/* Inicializacion: conectamos todas las funciones al cargar la pagina.

   Si el servidor devolvio el formulario con errores de validacion, los
   atributos traen lo que el usuario habia elegido, de modo
   que no pierda su seleccion al corregir los otros campos.
*/

function iniciarSelectoresGeograficos() {
    const selectorRegion = document.getElementById("region");
    const selectorComuna = document.getElementById("comuna");

    if (selectorRegion === null) {
        return;
    }

    llenarSelectorRegiones();

    const regionPrevia = selectorRegion.dataset.seleccionada;

    if (regionPrevia !== undefined && regionPrevia !== "") {
        selectorRegion.value = regionPrevia;
        llenarSelectorComunas(regionPrevia);

        const comunaPrevia = selectorComuna.dataset.seleccionada;
        if (comunaPrevia !== undefined && comunaPrevia !== "") {
            selectorComuna.value = comunaPrevia;
        }
    }

    selectorRegion.addEventListener("change", function () {
        llenarSelectorComunas(selectorRegion.value);
    });
}


document.addEventListener("DOMContentLoaded", iniciarSelectoresGeograficos);