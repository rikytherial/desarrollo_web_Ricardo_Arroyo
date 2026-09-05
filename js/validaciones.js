/* Funciones de validacion reutilizables: 

   Cada funcion recibe un valor y devuelve el mensaje de error
   correspondiente, o cadena vacia si el valor es valido.
 */


/* Valida un texto obligatorio de largo acotado. Se usa trim() porque un campo con solo espacios
   debe tratarse como vacio. */

function validarTextoObligatorio(valor, nombreCampo, largoMinimo, largoMaximo) {
    const texto = valor.trim();

    if (texto === "") {
        return "Debes ingresar " + nombreCampo + ".";
    }
    if (texto.length < largoMinimo) {
        return nombreCampo + " debe tener al menos " + largoMinimo + " caracteres.";
    }
    if (texto.length > largoMaximo) {
        return nombreCampo + " no puede superar los " + largoMaximo + " caracteres.";
    }
    return "";
}


/* Valida nombres y apellidos: solo letras y espacios, incluyendo vocales acentuadas y ñ 
    en el patron. */

function validarSoloLetras(valor, nombreCampo) {
    const texto = valor.trim();
    const patronLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;

    if (texto === "") {
        return "Debes ingresar " + nombreCampo + ".";
    }
    if (texto.length < 2) {
        return nombreCampo + " debe tener al menos 2 caracteres.";
    }
    if (texto.length > 50) {
        return nombreCampo + " no puede superar los 50 caracteres.";
    }
    if (patronLetras.test(texto) === false) {
        return nombreCampo + " solo puede contener letras y espacios.";
    }
    return "";
}


/* Validacion Correo electronico mediante el formato general algo@algo.algo, sin espacios ni arrobas extra*/

function validarCorreo(valor) {
    const texto = valor.trim();
    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (texto === "") {
        return "Debes ingresar un correo electronico.";
    }
    if (patronCorreo.test(texto) === false) {
        return "El correo debe tener el formato nombre@dominio.cl";
    }
    return "";
}


/* Validacion Celular chileno bajo mi notacion utilizada en los "helper" en el ingreso de notas. */

function validarCelular(valor) {
    const texto = valor.trim();
    /* Se eliminan espacios, guiones y el signo mas antes de comparar, para aceptar +56 9 1234 5678, 56912345678 y 912345678 como
   equivalentes. Ademas se validan dos largos posibles, con codigo de pais (11 digitos) y sin el (9 digitos). */
    const soloDigitos = texto.replace(/[^0-9]/g, "");

    if (texto === "") {
        return "Debes ingresar un numero de celular.";
    }
    if (soloDigitos.length === 11 && soloDigitos.slice(0, 3) === "569") {
        return "";
    }
    if (soloDigitos.length === 9 && soloDigitos.charAt(0) === "9") {
        return "";
    }
    return "El celular debe ser un numero chileno, por ejemplo +56 9 1234 5678.";
}


/* Validacion Rut con digito verificador: Se investigo acerca del metodo modulo 11 para verificar un rut valido mediante el digito verificador.
    Este normaliza el rut para poder operar con el, quita puntos y guion, y pasa a mayuscula para que la K del verificador sea siempre "K".  */

function limpiarRut(valor) {
    return valor.trim().toUpperCase().replace(/[.\-]/g, "");
}

/* Calcula el digito verificador de un RUT mediante Modulo 11. */ 
function calcularDigitoVerificador(numeroRut) {
    let suma = 0;
    let multiplicador = 2;

    /* Se recorre desde el ultimo digito hacia el primero */
    for (let i = numeroRut.length - 1; i >= 0; i = i - 1) {
        suma = suma + Number(numeroRut.charAt(i)) * multiplicador;
        multiplicador = multiplicador + 1;
        if (multiplicador > 7) {
            multiplicador = 2;
        }
    }

    const resto = suma % 11;
    const resultado = 11 - resto;

    if (resultado === 11) {
        return "0";
    }
    if (resultado === 10) {
        return "K";
    }
    return String(resultado);
}


function validarRut(valor) {
    const rutLimpio = limpiarRut(valor);

    if (rutLimpio === "") {
        return "Debes ingresar tu RUT.";
    }
    /* Entre 8 y 9 caracteres ya sin puntos ni guion, es decir,  7 u 8 digitos
   del numero mas el digito verificador. */
    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
        return "El RUT debe tener entre 7 y 8 digitos mas el verificador.";
    }

    const numeroRut = rutLimpio.slice(0, rutLimpio.length - 1);
    const digitoIngresado = rutLimpio.charAt(rutLimpio.length - 1);
    const patronNumeros = /^[0-9]+$/;

    if (patronNumeros.test(numeroRut) === false) {
        return "El RUT solo puede contener numeros antes del guion.";
    }

    const digitoCorrecto = calcularDigitoVerificador(numeroRut);

    if (digitoIngresado !== digitoCorrecto) {
        return "El RUT ingresado no es valido.";
    }
    return "";
}


/* Validacion Fecha de nacimiento */

function validarFechaNacimiento(valor) {
    if (valor === "") {
        return "";
    }

    const fechaNacimiento = new Date(valor);
    const hoy = new Date();

    if (fechaNacimiento > hoy) {
        return "La fecha de nacimiento no puede estar en el futuro.";
    }

    /*Se usa 365.25 dias por año para promediar los bisiestos.*/
    const milisegundosPorAnio = 1000 * 60 * 60 * 24 * 365.25;
    const edad = Math.floor((hoy - fechaNacimiento) / milisegundosPorAnio);

    if (edad < 12) {
        return "Debes tener al menos 12 anios para registrarte.";
    }
    if (edad > 100) {
        return "La fecha de nacimiento no parece valida.";
    }
    return "";
}


/* Validacion de Selectores y casillas  */

function validarSeleccion(valor, nombreCampo) {
    if (valor === "") {
        return "Debes seleccionar " + nombreCampo + ".";
    }
    return "";
}


function validarTextoOpcional(valor, nombreCampo, largoMaximo) {
    const texto = valor.trim();

    if (texto === "") {
        return "";
    }
    if (texto.length > largoMaximo) {
        return nombreCampo + " no puede superar los " + largoMaximo + " caracteres.";
    }
    return "";
}

/* Validacion fecha del avistamiento */

/* Devuelve la fecha actual como texto en formato AAAA-MM-DD, que es el mismo formato que entrega un input type="date". */
function obtenerFechaHoy() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    return anio + "-" + mes + "-" + dia;
}


/* Valida que la fecha no sea futura ni anterior al limite de años indicado. El limite hacia atras evita registros tan antiguos que
   ya no reflejan la poblacion actual de aves. */
function validarFechaAvistamiento(valor, aniosHaciaAtras) {
    if (valor === "") {
        return "Debes indicar la fecha del avistamiento.";
    }

    const fechaHoy = obtenerFechaHoy();

    if (valor > fechaHoy) {
        return "La fecha del avistamiento no puede estar en el futuro.";
    }

    const hoy = new Date();
    const limite = new Date();
    limite.setFullYear(hoy.getFullYear() - aniosHaciaAtras);

    const anio = limite.getFullYear();
    const mes = String(limite.getMonth() + 1).padStart(2, "0");
    const dia = String(limite.getDate()).padStart(2, "0");
    const fechaLimite = anio + "-" + mes + "-" + dia;

    if (valor < fechaLimite) {
        return "La fecha no puede ser anterior a " + aniosHaciaAtras + " anios.";
    }
    return "";
}


/* Validacion hora del avistamiento */

/* La hora se valida en conjunto con la fecha, pues solo si el avistamiento
   ocurrio hoy tiene sentido comparar contra la hora actual. */
function validarHoraAvistamiento(valorHora, valorFecha) {
    if (valorHora === "") {
        return "Debes indicar la hora del avistamiento.";
    }

    if (valorFecha !== obtenerFechaHoy()) {
        return "";
    }

    const ahora = new Date();
    const horaActual = String(ahora.getHours()).padStart(2, "0") + ":" +
                       String(ahora.getMinutes()).padStart(2, "0");

    if (valorHora > horaActual) {
        return "La hora no puede ser posterior a la hora actual.";
    }
    return "";
}


/* Validacion numero entero en rango */

function validarNumeroOpcional(valor, nombreCampo, minimo, maximo) {
    const texto = valor.trim();

    if (texto === "") {
        return "";
    }

    const numero = Number(texto);

    if (Number.isNaN(numero) === true) {
        return nombreCampo + " debe ser un numero.";
    }
    if (Number.isInteger(numero) === false) {
        return nombreCampo + " debe ser un numero entero.";
    }
    if (numero < minimo || numero > maximo) {
        return nombreCampo + " debe estar entre " + minimo + " y " + maximo + ".";
    }
    return "";
}


/* Validacion archivo de evidencia */

/* El atributo accept del input solo filtra el dialogo de seleccion, luego el usuario puede cambiar el filtro y elegir cualquier archivo.
   Por eso verificamos el tipo aqui. Luego el tamaño no tiene ningun atributo HTML que lo limite. */
function validarArchivoEvidencia(listaArchivos, tamanioMaximoMb) {
    if (listaArchivos.length === 0) {
        return "Debes adjuntar una foto o un video del avistamiento.";
    }

    const archivo = listaArchivos[0];
    const esImagen = archivo.type.slice(0, 6) === "image/";
    const esVideo = archivo.type.slice(0, 6) === "video/";

    if (esImagen === false && esVideo === false) {
        return "El archivo debe ser una imagen o un video.";
    }

    const tamanioMaximoBytes = tamanioMaximoMb * 1024 * 1024;

    if (archivo.size > tamanioMaximoBytes) {
        return "El archivo no puede superar los " + tamanioMaximoMb + " MB.";
    }
    return "";
}