/* Validacion del formulario de reporte de avistamiento: */

/* Limite hacia atras para la fecha del avistamiento. Se define como constante para que el valor quede en un solo lugar y coincida con
   el texto de ayuda del formulario. */
const ANIOS_MAXIMOS_HACIA_ATRAS = 3;
const TAMANIO_MAXIMO_MB = 15;


function mostrarErrorAvistamiento(idCampo, mensaje) {
    const campo = document.getElementById(idCampo);
    const contenedorError = document.getElementById("error-" + idCampo);

    contenedorError.textContent = mensaje;

    if (mensaje === "") {
        campo.classList.remove("campo-invalido");
    } else {
        campo.classList.add("campo-invalido");
    }
}


function obtenerValorAvistamiento(idCampo) {
    return document.getElementById(idCampo).value;
}


function validarFormularioAvistamiento() {
    let hayErrores = false;

    const errorCorreo = validarCorreo(obtenerValorAvistamiento("correo-voluntario"));
    mostrarErrorAvistamiento("correo-voluntario", errorCorreo);
    if (errorCorreo !== "") { hayErrores = true; }

    const errorAve = validarSeleccion(obtenerValorAvistamiento("ave"), "el ave observada");
    mostrarErrorAvistamiento("ave", errorAve);
    if (errorAve !== "") { hayErrores = true; }

    const errorCantidad = validarNumeroOpcional(obtenerValorAvistamiento("cantidad"), "La cantidad", 1, 500);
    mostrarErrorAvistamiento("cantidad", errorCantidad);
    if (errorCantidad !== "") { hayErrores = true; }

    const errorLugar = validarTextoObligatorio(obtenerValorAvistamiento("lugar"), "el lugar", 3, 200);
    mostrarErrorAvistamiento("lugar", errorLugar);
    if (errorLugar !== "") { hayErrores = true; }

    /* Si se elige una region debe elegirse tambien su comuna, para no dejar el dato a medias. */
    const valorRegion = obtenerValorAvistamiento("region");
    const valorComuna = obtenerValorAvistamiento("comuna");
    let errorComuna = "";
    if (valorRegion !== "" && valorComuna === "") {
        errorComuna = "Si indicas una region, debes indicar tambien la comuna.";
    }
    mostrarErrorAvistamiento("comuna", errorComuna);
    if (errorComuna !== "") { hayErrores = true; }

    const valorFecha = obtenerValorAvistamiento("fecha");
    const errorFecha = validarFechaAvistamiento(valorFecha, ANIOS_MAXIMOS_HACIA_ATRAS);
    mostrarErrorAvistamiento("fecha", errorFecha);
    if (errorFecha !== "") { hayErrores = true; }

    const errorHora = validarHoraAvistamiento(obtenerValorAvistamiento("hora"), valorFecha);
    mostrarErrorAvistamiento("hora", errorHora);
    if (errorHora !== "") { hayErrores = true; }

    const campoEvidencia = document.getElementById("evidencia");
    const errorEvidencia = validarArchivoEvidencia(campoEvidencia.files, TAMANIO_MAXIMO_MB);
    mostrarErrorAvistamiento("evidencia", errorEvidencia);
    if (errorEvidencia !== "") { hayErrores = true; }

    const errorDescripcion = validarTextoOpcional(obtenerValorAvistamiento("descripcion"), "La descripcion", 500);
    mostrarErrorAvistamiento("descripcion", errorDescripcion);
    if (errorDescripcion !== "") { hayErrores = true; }

    return hayErrores === false;
}


function iniciarFormularioAvistamiento() {
    const formulario = document.getElementById("form-avistamiento");

    if (formulario === null) {
        return;
    }

    formulario.addEventListener("submit", function (evento) {
        const mensajeExito = document.getElementById("mensaje-exito");

        if (validarFormularioAvistamiento() === false) {
            evento.preventDefault();
            mensajeExito.hidden = true;
        }
    });
}


document.addEventListener("DOMContentLoaded", iniciarFormularioAvistamiento);