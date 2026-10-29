/*Comentarios de un avistamiento: listado y alta mediante llamadas asincronas.
La URL la escribe Flask en el atributo action del formulario, por lo que el
JavaScript nunca arma rutas a mano. Luego la misma URL sirve para listar (GET) y
para agregar (POST).*/

const LARGO_MINIMO_NOMBRE = 3;
const LARGO_MAXIMO_NOMBRE = 50;
const LARGO_MINIMO_TEXTO = 5;
const LARGO_MAXIMO_TEXTO = 300;


/*Misma mecanica que en los formularios que realice en la Tarea 2, el mensaje va al span
   con id "error-" + idCampo y el control se marca con la clase campo-invalido.*/
function mostrarErrorComentario(idCampo, mensaje) {
    const campo = document.getElementById(idCampo);
    const contenedorError = document.getElementById("error-" + idCampo);

    contenedorError.textContent = mensaje;

    if (mensaje === "") {
        campo.classList.remove("campo-invalido");
    } else {
        campo.classList.add("campo-invalido");
    }
}


function obtenerValorComentario(idCampo) {
    return document.getElementById(idCampo).value;
}


/*Funcion que reutiliza validarTextoObligatorio de validaciones.js, que ya aplica trim y
revisa minimo y maximo.*/
function validarFormularioComentario() {
    let hayErrores = false;

    const errorNombre = validarTextoObligatorio(
        obtenerValorComentario("nombre-comentarista"),
        "el nombre del comentarista",
        LARGO_MINIMO_NOMBRE,
        LARGO_MAXIMO_NOMBRE
    );
    mostrarErrorComentario("nombre-comentarista", errorNombre);
    if (errorNombre !== "") { hayErrores = true; }

    const errorTexto = validarTextoObligatorio(
        obtenerValorComentario("texto-comentario"),
        "el comentario",
        LARGO_MINIMO_TEXTO,
        LARGO_MAXIMO_TEXTO
    );
    mostrarErrorComentario("texto-comentario", errorTexto);
    if (errorTexto !== "") { hayErrores = true; }

    return hayErrores === false;
}


/*Funcion que arma el <li> de un comentario SIN usar innerHTML.

El nombre y el texto los escribe un usuario cualquiera, asi que se insertan
con textContent, el navegador los trata como texto y los escapa solo. Con
innerHTML, una entrada como por ej: <img src=x onerror="..."> se ejecutaria.*/
function crearElementoComentario(comentario) {
    const item = document.createElement("li");

    const cabecera = document.createElement("p");
    cabecera.className = "comentario-cabecera";

    const nombre = document.createElement("strong");
    nombre.textContent = comentario.nombre;

    const fecha = document.createElement("span");
    fecha.className = "comentario-fecha";
    fecha.textContent = comentario.fecha;

    cabecera.appendChild(nombre);
    cabecera.appendChild(fecha);

    const texto = document.createElement("p");
    texto.className = "comentario-texto";
    texto.textContent = comentario.texto;

    item.appendChild(cabecera);
    item.appendChild(texto);

    return item;
}


function pintarComentarios(comentarios) {
    const contenedor = document.getElementById("lista-comentarios");
    contenedor.textContent = "";

    if (comentarios.length === 0) {
        const vacio = document.createElement("p");
        vacio.textContent = "Este avistamiento todavia no tiene comentarios.";
        contenedor.appendChild(vacio);
        return;
    }

    const lista = document.createElement("ul");
    lista.className = "comentarios";

    for (let i = 0; i < comentarios.length; i = i + 1) {
        lista.appendChild(crearElementoComentario(comentarios[i]));
    }

    contenedor.appendChild(lista);
}


function mostrarAvisoListado(mensaje) {
    const contenedor = document.getElementById("lista-comentarios");
    contenedor.textContent = "";

    const aviso = document.createElement("p");
    aviso.className = "error";
    aviso.textContent = mensaje;
    contenedor.appendChild(aviso);
}


function cargarComentarios(url) {
    fetch(url)
        .then(function (respuesta) {
            if (respuesta.ok === false) {
                throw new Error("respuesta no exitosa");
            }
            return respuesta.json();
        })
        .then(function (datos) {
            pintarComentarios(datos.comentarios);
        })
        .catch(function () {
            mostrarAvisoListado("No fue posible cargar los comentarios.");
        });
}


function limpiarErroresComentario() {
    mostrarErrorComentario("nombre-comentarista", "");
    mostrarErrorComentario("texto-comentario", "");
    document.getElementById("error-comentario-general").textContent = "";
}


function enviarComentario(formulario) {
    const url = formulario.getAttribute("action");
    const boton = formulario.querySelector("button[type='submit']");
    const mensajeExito = document.getElementById("mensaje-comentario-exito");

    /*Se desactiva el boton mientras viaja la peticion, para que un doble clic
    no inserte el mismo comentario dos veces.*/
    boton.disabled = true;

    fetch(url, {
        method: "POST",
        body: new FormData(formulario)
    })
        .then(function (respuesta) {
            return respuesta.json().then(function (datos) {
                return { ok: respuesta.ok, datos: datos };
            });
        })
        .then(function (resultado) {
            if (resultado.ok === false) {
                /*El servidor rechazo los datos. Se muestran sus mensajes y el
                formulario queda visible con lo que la persona escribio.*/
                const errores = resultado.datos.errores || {};
                mostrarErrorComentario("nombre-comentarista", errores.nombre || "");
                mostrarErrorComentario("texto-comentario", errores.texto || "");

                if (resultado.datos.error !== undefined) {
                    document.getElementById("error-comentario-general").textContent =
                        resultado.datos.error;
                }
                mensajeExito.hidden = true;
                return;
            }

            formulario.reset();
            limpiarErroresComentario();
            mensajeExito.hidden = false;
            cargarComentarios(url);
        })
        .catch(function () {
            document.getElementById("error-comentario-general").textContent =
                "No fue posible enviar el comentario. Intenta nuevamente.";
            mensajeExito.hidden = true;
        })
        .finally(function () {
            boton.disabled = false;
        });
}


function iniciarComentarios() {
    const formulario = document.getElementById("form-comentario");

    if (formulario === null) {
        return;
    }

    cargarComentarios(formulario.getAttribute("action"));

    formulario.addEventListener("submit", function (evento) {

        evento.preventDefault();

        document.getElementById("error-comentario-general").textContent = "";

        if (validarFormularioComentario() === false) {
            document.getElementById("mensaje-comentario-exito").hidden = true;
            return;
        }

        enviarComentario(formulario);
    });
}


document.addEventListener("DOMContentLoaded", iniciarComentarios);