"""Validaciones del lado del servidor.

Este modulo el cual "no confia" en nada que venga del cliente, luego repite todas las reglas
que el JavaScript aplica en el navegador y agrega las que solo se pueden
comprobar contra la base de datos (como por ejemplo que la comuna exista y
pertenezca a la region indicada).

Cada funcion de validacion retorna una tupla (datos, errores):
  - datos:   diccionario con los valores limpios.
  - errores: diccionario campo -> mensaje. Luego si esta vacio, los datos son validos.
"""

import re
from datetime import datetime

from sqlalchemy import select

from modelo import Comuna

#Utilidades.

LARGO_MAXIMO_TEXTO = 500


def limpiar(valor):
    """Entrega el texto sin espacios al inicio ni al final.
    """
    if valor is None:
        return ""
    return valor.strip()


def solo_digitos(texto):
    return re.sub(r"[^0-9kK]", "", texto)


#Validadores

def validar_nombre(valor, etiqueta):
    """Nombre o apellido, obligatorio, entre 2 y 100 caracteres, solo letras."""
    if valor == "":
        return "El campo {0} es obligatorio.".format(etiqueta)
    if len(valor) < 2 or len(valor) > 100:
        return "El campo {0} debe tener entre 2 y 100 caracteres.".format(etiqueta)
    if re.fullmatch(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+", valor) is None:
        return "El campo {0} solo admite letras, espacios, guiones y apostrofes.".format(etiqueta)
    return ""


def validar_rut(valor):
    """Valida formato y digito verificador con el algoritmo modulo 11."""
    if valor == "":
        return "El RUT es obligatorio."

    limpio = solo_digitos(valor)
    if len(limpio) < 8 or len(limpio) > 9:
        return "El RUT debe tener entre 7 y 8 digitos mas el verificador."

    cuerpo = limpio[:-1]
    verificador = limpio[-1].upper()

    if cuerpo.isdigit() is False:
        return "El RUT solo puede contener digitos antes del verificador."

    suma = 0
    multiplicador = 2
    for digito in reversed(cuerpo):
        suma = suma + int(digito) * multiplicador
        multiplicador = multiplicador + 1
        if multiplicador > 7:
            multiplicador = 2

    resto = 11 - (suma % 11)
    if resto == 11:
        esperado = "0"
    elif resto == 10:
        esperado = "K"
    else:
        esperado = str(resto)

    if verificador != esperado:
        return "El RUT ingresado no es valido."
    return ""


def validar_correo(valor):
    if valor == "":
        return "El correo electronico es obligatorio."
    if len(valor) > 80:
        return "El correo electronico no puede superar los 80 caracteres."
    if re.fullmatch(r"[^@\s]+@[^@\s]+\.[A-Za-z]{2,}", valor) is None:
        return "Ingresa un correo electronico valido, por ejemplo nombre@ejemplo.cl"
    return ""


def normalizar_celular(valor):
    """Deja el celular en formato +569XXXXXXXX.

    La columna telefono es VARCHAR(15) y el formato que escribe el usuario
    ('+56 9 1234 5678') ocupa 17 caracteres, por lo que lo guardamos normalizado.
    Retorna (numero_normalizado, error).
    """
    if valor == "":
        return "", "El celular es obligatorio."

    digitos = re.sub(r"[^0-9]", "", valor)

    if len(digitos) == 11 and digitos.startswith("569"):
        return "+" + digitos, ""
    if len(digitos) == 9 and digitos.startswith("9"):
        return "+56" + digitos, ""

    return "", "Ingresa un celular chileno valido, por ejemplo +56 9 1234 5678."


def validar_fecha_nacimiento(valor):
    """Campo opcional. Luego si viene, debe ser una fecha real y no futura."""
    if valor == "":
        return None, ""
    try:
        fecha = datetime.strptime(valor, "%Y-%m-%d").date()
    except ValueError:
        return None, "La fecha de nacimiento no es una fecha valida."

    if fecha > datetime.now().date():
        return None, "La fecha de nacimiento no puede estar en el futuro."
    if fecha.year < 1900:
        return None, "La fecha de nacimiento no es razonable."
    return fecha, ""


def validar_largo_opcional(valor, etiqueta, maximo=LARGO_MAXIMO_TEXTO):
    if len(valor) > maximo:
        return "El campo {0} no puede superar los {1} caracteres.".format(etiqueta, maximo)
    return ""


def validar_comuna(session, comuna_texto, region_texto):
    """Comprueba contra la base de datos que la comuna exista y que pertenezca
    a la region seleccionada.

    Retorna (comuna, error_region, error_comuna).
    """
    if region_texto == "":
        return None, "Debes seleccionar una region.", ""
    if comuna_texto == "":
        return None, "", "Debes seleccionar una comuna."

    if region_texto.isdigit() is False or comuna_texto.isdigit() is False:
        return None, "", "La comuna seleccionada no es valida."

    comuna = session.scalars(
        select(Comuna).where(Comuna.id == int(comuna_texto))
    ).first()

    if comuna is None:
        return None, "", "La comuna seleccionada no existe."
    if comuna.region_id != int(region_texto):
        return None, "", "La comuna seleccionada no pertenece a la region indicada."

    return comuna, "", ""


# Caso voluntario.

def validar_voluntario(session, form):
    """Valida el formulario de registro de voluntario.

    Retorna (datos, errores). Los nombres de las llaves de 'errores' coinciden
    con los id de los <span class="error">.
    """
    datos = {
        "nombre": limpiar(form.get("nombre")),
        "apellido": limpiar(form.get("apellido")),
        "rut": limpiar(form.get("rut")),
        "fecha-nacimiento": limpiar(form.get("fecha-nacimiento")),
        "correo": limpiar(form.get("correo")),
        "celular": limpiar(form.get("celular")),
        "medio-contacto": limpiar(form.get("medio-contacto")),
        "region": limpiar(form.get("region")),
        "comuna": limpiar(form.get("comuna")),
        "calle": limpiar(form.get("calle")),
        "motivacion": limpiar(form.get("motivacion")),
        "consentimiento": form.get("consentimiento") is not None,
    }

    errores = {}

    error = validar_nombre(datos["nombre"], "nombre")
    if error != "":
        errores["nombre"] = error

    error = validar_nombre(datos["apellido"], "apellido")
    if error != "":
        errores["apellido"] = error

    error = validar_rut(datos["rut"])
    if error != "":
        errores["rut"] = error

    fecha_nacimiento, error = validar_fecha_nacimiento(datos["fecha-nacimiento"])
    if error != "":
        errores["fecha-nacimiento"] = error

    error = validar_correo(datos["correo"])
    if error != "":
        errores["correo"] = error

    celular_normalizado, error = normalizar_celular(datos["celular"])
    if error != "":
        errores["celular"] = error

    if datos["medio-contacto"] not in ("correo", "celular"):
        errores["medio-contacto"] = "Debes indicar un medio de contacto preferido."

    comuna, error_region, error_comuna = validar_comuna(
        session, datos["comuna"], datos["region"]
    )
    if error_region != "":
        errores["region"] = error_region
    if error_comuna != "":
        errores["comuna"] = error_comuna

    error = validar_largo_opcional(datos["calle"], "calle y numero", 200)
    if error != "":
        errores["calle"] = error

    error = validar_largo_opcional(datos["motivacion"], "motivacion", 500)
    if error != "":
        errores["motivacion"] = error

    if datos["consentimiento"] is False:
        errores["consentimiento"] = "Debes aceptar el uso de tus datos para continuar."

    # Valores ya procesados que la ruta necesita para insertar.
    datos["_celular_normalizado"] = celular_normalizado
    datos["_comuna"] = comuna
    datos["_fecha_nacimiento"] = fecha_nacimiento

    return datos, errores