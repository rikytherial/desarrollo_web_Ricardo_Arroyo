"""Validaciones del lado del servidor.

Modulo el cual no "confia" en nada que venga del cliente, luego repite todas las reglas
que el JavaScript aplica en el navegador y agrega las que solo se pueden
comprobar contra la base de datos (como por ejemplo que la comuna exista y
pertenezca a la region indicada, o que el correo corresponda a un voluntario
realmente registrado).

Cada funcion de validacion de formulario retorna una tupla (datos, errores) donde:
  - datos:   diccionario con los valores limpios.
  - errores: diccionario campo -> mensaje. Si esta vacio, los datos son validos.
"""

import re
from datetime import datetime, timedelta

from sqlalchemy import select

from modelo import Ave, Comuna, Voluntario


#Utilidades.

def limpiar(valor):
    """Entrega el texto sin espacios al inicio ni al final.
    """
    if valor is None:
        return ""
    return valor.strip()


def solo_digitos(texto):
    return re.sub(r"[^0-9kK]", "", texto)


#Validadores comunes.

def validar_nombre(valor, etiqueta):
    """Nombre o apellido: obligatorio, entre 2 y 100 caracteres, solo letras."""
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

    En el esquema, la columna telefono es VARCHAR(15) y el formato que escribe el usuario
    ('+56 9 1234 5678') ocupa 17 caracteres, por lo que se guarda normalizado.
    Retornamos (numero_normalizado, error).
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
    """Campo opcional. Si viene, debe ser una fecha real y no futura."""
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


def validar_largo_opcional(valor, etiqueta, maximo):
    if len(valor) > maximo:
        return "El campo {0} no puede superar los {1} caracteres.".format(etiqueta, maximo)
    return ""


def validar_comuna(session, comuna_texto, region_texto, obligatorio):
    """Comprueba contra la base de datos que la comuna exista y que pertenezca
    a la region seleccionada.

    Retorna (comuna, error_region, error_comuna).
    """
    if region_texto == "" and comuna_texto == "":
        if obligatorio is True:
            return None, "Debes seleccionar una region.", ""
        return None, "", ""

    if region_texto == "":
        return None, "Debes seleccionar la region de esa comuna.", ""
    if comuna_texto == "":
        if obligatorio is True:
            return None, "", "Debes seleccionar una comuna."
        return None, "", ""

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


#Caso Voluntario.

def validar_voluntario(session, form):
    """Valida el formulario de registro de voluntario.

    Retorna (datos, errores), los nombres de las llaves de 'errores' coinciden
    con los id de los <span class="error"> de la plantilla.
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
        session, datos["comuna"], datos["region"], obligatorio=True
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


#Caso Avistamiento.

ANIOS_MAXIMOS_HACIA_ATRAS = 3


def validar_voluntario_existente(session, correo):
    """El avistamiento debe quedar asociado a un voluntario ya registrado.

    Retorna (voluntario, error).
    """
    error = validar_correo(correo)
    if error != "":
        return None, error

    voluntario = session.scalars(
        select(Voluntario).where(Voluntario.email == correo)
    ).first()

    if voluntario is None:
        return None, "No encontramos un voluntario registrado con ese correo."
    return voluntario, ""


def validar_ave(session, ave_texto):
    """El ave debe ser una de las especies del catalogo de la base de datos."""
    if ave_texto == "":
        return None, "Debes seleccionar el ave observada."
    if ave_texto.isdigit() is False:
        return None, "El ave seleccionada no es valida."

    ave = session.scalars(select(Ave).where(Ave.id == int(ave_texto))).first()
    if ave is None:
        return None, "El ave seleccionada no existe en el catalogo."
    return ave, ""


def validar_cantidad(valor):
    """Campo opcional: si viene, debe ser un entero entre 1 y 500."""
    if valor == "":
        return ""
    if valor.isdigit() is False:
        return "La cantidad debe ser un numero entero."
    numero = int(valor)
    if numero < 1 or numero > 500:
        return "La cantidad debe estar entre 1 y 500."
    return ""


def validar_fecha_hora(fecha_texto, hora_texto):
    """Combina fecha y hora en el DATETIME que guarda la tabla avistamiento.

    Las reglas son las mismas que aplica el JavaScript:
      - ambas son obligatorias
      - el avistamiento no puede ser futuro
      - no puede tener mas de 3 anios de antiguedad

    Retorna (fecha_hora, error_fecha, error_hora).
    """
    if fecha_texto == "":
        return None, "La fecha del avistamiento es obligatoria.", ""
    if hora_texto == "":
        return None, "", "La hora del avistamiento es obligatoria."

    try:
        fecha = datetime.strptime(fecha_texto, "%Y-%m-%d").date()
    except ValueError:
        return None, "La fecha no es una fecha valida.", ""

    try:
        hora = datetime.strptime(hora_texto, "%H:%M").time()
    except ValueError:
        return None, "", "La hora no es una hora valida."

    fecha_hora = datetime.combine(fecha, hora)
    ahora = datetime.now()

    if fecha_hora > ahora:
        return None, "El avistamiento no puede estar en el futuro.", ""

    limite = ahora - timedelta(days=365 * ANIOS_MAXIMOS_HACIA_ATRAS)
    if fecha_hora < limite:
        return None, "El avistamiento no puede tener mas de 3 anios de antiguedad.", ""

    return fecha_hora, "", ""


def validar_avistamiento(session, form):
    """Valida el formulario de registro de avistamiento.

    Solo valida los datos de texto. Los archivos se validan aparte, porque
    "viajan" en request.files y no en request.form.
    """
    datos = {
        "correo-voluntario": limpiar(form.get("correo-voluntario")),
        "ave": limpiar(form.get("ave")),
        "cantidad": limpiar(form.get("cantidad")),
        "lugar": limpiar(form.get("lugar")),
        "region": limpiar(form.get("region")),
        "comuna": limpiar(form.get("comuna")),
        "fecha": limpiar(form.get("fecha")),
        "hora": limpiar(form.get("hora")),
        "descripcion": limpiar(form.get("descripcion")),
    }

    errores = {}

    voluntario, error = validar_voluntario_existente(session, datos["correo-voluntario"])
    if error != "":
        errores["correo-voluntario"] = error

    ave, error = validar_ave(session, datos["ave"])
    if error != "":
        errores["ave"] = error

    error = validar_cantidad(datos["cantidad"])
    if error != "":
        errores["cantidad"] = error

    if datos["lugar"] == "":
        errores["lugar"] = "El lugar del avistamiento es obligatorio."
    elif len(datos["lugar"]) < 3 or len(datos["lugar"]) > 200:
        errores["lugar"] = "El lugar debe tener entre 3 y 200 caracteres."

    comuna, error_region, error_comuna = validar_comuna(
        session, datos["comuna"], datos["region"], obligatorio=False
    )
    if error_region != "":
        errores["region"] = error_region
    if error_comuna != "":
        errores["comuna"] = error_comuna

    fecha_hora, error_fecha, error_hora = validar_fecha_hora(datos["fecha"], datos["hora"])
    if error_fecha != "":
        errores["fecha"] = error_fecha
    if error_hora != "":
        errores["hora"] = error_hora

    error = validar_largo_opcional(datos["descripcion"], "descripcion", 500)
    if error != "":
        errores["descripcion"] = error

    datos["_voluntario"] = voluntario
    datos["_ave"] = ave
    datos["_fecha_hora"] = fecha_hora

    return datos, errores