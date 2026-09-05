/* Validacion del formulario de registro de voluntario */


/* Escribe el mensaje de error de un campo y marca visualmente el control. */
function mostrarError(idCampo, mensaje) {
    const campo = document.getElementById(idCampo);
    const contenedorError = document.getElementById("error-" + idCampo);

    contenedorError.textContent = mensaje;

    if (mensaje === "") {
        campo.classList.remove("campo-invalido");
    } else {
        campo.classList.add("campo-invalido");
    }
}


function obtenerValor(idCampo) {
    return document.getElementById(idCampo).value;
}

/* Los radio buttons comparten el atributo name, por lo que no se pueden obtener con getElementById. Se recorren todos los del grupo
   buscando cual esta marcado y se devuelve una cadena vacia si ninguno lo esta. */
function obtenerMedioContactoSeleccionado() {
    const opciones = document.getElementsByName("medio-contacto");

    for (let i = 0; i < opciones.length; i = i + 1) {
        if (opciones[i].checked === true) {
            return opciones[i].value;
        }
    }
    return "";
}

/* Valida todos los campos y acumula si hubo errores, en lugar de detenerse en el primero, de esta manera el usuario ve todos los problemas de
   una vez y no uno por envio. */
function validarFormularioVoluntario() {
    let hayErrores = false;

    const errorNombre = validarSoloLetras(obtenerValor("nombre"), "el nombre");
    mostrarError("nombre", errorNombre);
    if (errorNombre !== "") { hayErrores = true; }

    const errorApellido = validarSoloLetras(obtenerValor("apellido"), "el apellido");
    mostrarError("apellido", errorApellido);
    if (errorApellido !== "") { hayErrores = true; }

    const errorRut = validarRut(obtenerValor("rut"));
    mostrarError("rut", errorRut);
    if (errorRut !== "") { hayErrores = true; }

    const errorFechaNacimiento = validarFechaNacimiento(obtenerValor("fecha-nacimiento"));
    mostrarError("fecha-nacimiento", errorFechaNacimiento);
    if (errorFechaNacimiento !== "") { hayErrores = true; }

    const errorCorreo = validarCorreo(obtenerValor("correo"));
    mostrarError("correo", errorCorreo);
    if (errorCorreo !== "") { hayErrores = true; }

    const errorCelular = validarCelular(obtenerValor("celular"));
    mostrarError("celular", errorCelular);
    if (errorCelular !== "") { hayErrores = true; }

    const errorMedioContacto = validarSeleccion(obtenerMedioContactoSeleccionado(), "un medio de contacto");
    document.getElementById("error-medio-contacto").textContent = errorMedioContacto;
    if (errorMedioContacto !== "") { hayErrores = true; }

    const errorRegion = validarSeleccion(obtenerValor("region"), "una region");
    mostrarError("region", errorRegion);
    if (errorRegion !== "") { hayErrores = true; }

    const errorComuna = validarSeleccion(obtenerValor("comuna"), "una comuna");
    mostrarError("comuna", errorComuna);
    if (errorComuna !== "") { hayErrores = true; }

    const errorCalle = validarTextoOpcional(obtenerValor("calle"), "la direccion", 100);
    mostrarError("calle", errorCalle);
    if (errorCalle !== "") { hayErrores = true; }

    const errorMotivacion = validarTextoOpcional(obtenerValor("motivacion"), "la motivacion", 500);
    mostrarError("motivacion", errorMotivacion);
    if (errorMotivacion !== "") { hayErrores = true; }

    const consentimiento = document.getElementById("consentimiento");
    let errorConsentimiento = "";
    if (consentimiento.checked === false) {
        errorConsentimiento = "Debes aceptar el uso de tus datos para continuar.";
    }
    mostrarError("consentimiento", errorConsentimiento);
    if (errorConsentimiento !== "") { hayErrores = true; }

    return hayErrores === false;
}


function iniciarFormularioVoluntario() {
    const formulario = document.getElementById("form-voluntario");

    /* El script solo actua si encuentra el formulario, de modo que
       pueda enlazarse en paginas que no lo contienen sin provocar error. */
    if (formulario === null) {
        return;
    }

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const mensajeExito = document.getElementById("mensaje-exito");

        if (validarFormularioVoluntario() === true) {
            mensajeExito.hidden = false;
            formulario.reset();
            /* reset() devuelve los campos a su estado inicial del HTML, pero las comunas fueron insertadas por JavaScript y no se
            eliminan asi entonces devolvemos el selector a su opcion vacia. */
            document.getElementById("comuna").selectedIndex = 0;
            mensajeExito.scrollIntoView();
        } else {
            mensajeExito.hidden = true;
        }
    });
}


document.addEventListener("DOMContentLoaded", iniciarFormularioVoluntario);