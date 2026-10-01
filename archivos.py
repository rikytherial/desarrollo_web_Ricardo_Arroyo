"""Validacion y almacenamiento de los archivos subidos por el usuario.

Reglas aplicadas, siguiendo las recomendaciones vistas en clases:

  - No se confia en la extension del nombre, asi entonces, el tipo real se determina a
    partir de los "magic numbers" (firma fija de bytes con la que empiezan casi todos 
    los formatos binarios) del contenido con la libreria filetype.
  - No se confia en el nombre enviado por el cliente, el nombre con el que se
    guarda en disco lo genera el servidor de forma aleatoria. El nombre
    original se guarda como texto en la base de datos, solo para mostrarlo.
  - Se limita la cantidad de archivos y el tamano de cada uno.
"""

import os
import secrets

import filetype
from werkzeug.utils import secure_filename


#Tipos permitidos, expresados como MIME real del contenido.
IMAGENES_PERMITIDAS = ("image/jpeg", "image/png", "image/gif", "image/webp")
VIDEOS_PERMITIDOS = ("video/mp4", "video/quicktime", "video/webm", "video/x-msvideo")
TIPOS_PERMITIDOS = IMAGENES_PERMITIDAS + VIDEOS_PERMITIDOS

MAXIMO_ARCHIVOS = 5
MAXIMO_BYTES_POR_ARCHIVO = 15 * 1024 * 1024  #15 MB

#Cantidad de bytes que necesita filetype para reconocer una firma.
BYTES_FIRMA = 261


def _tamano_en_bytes(archivo):
    """Mide el archivo moviendo el puntero al final y devolviendolo al inicio."""
    archivo.stream.seek(0, os.SEEK_END)
    tamano = archivo.stream.tell()
    archivo.stream.seek(0)
    return tamano


def _tipo_real(archivo):
    """Determina el tipo MIME leyendo los primeros bytes del contenido."""
    cabecera = archivo.stream.read(BYTES_FIRMA)
    archivo.stream.seek(0)
    return filetype.guess(cabecera)


def validar_archivos(archivos):
    """Revisa la lista de archivos recibidos en request.files.

    Retorna (archivos_validos, error), si error no es vacio, no se debe
    guardar nada.
    """
    utiles = [a for a in archivos if a is not None and a.filename != ""]

    if len(utiles) == 0:
        return [], "Debes adjuntar al menos una foto o un video del avistamiento."

    if len(utiles) > MAXIMO_ARCHIVOS:
        return [], "Puedes adjuntar como maximo {0} archivos.".format(MAXIMO_ARCHIVOS)

    for archivo in utiles:
        tamano = _tamano_en_bytes(archivo)

        if tamano == 0:
            return [], "El archivo '{0}' esta vacio.".format(archivo.filename)

        if tamano > MAXIMO_BYTES_POR_ARCHIVO:
            return [], "El archivo '{0}' supera los 15 MB permitidos.".format(archivo.filename)

        tipo = _tipo_real(archivo)

        if tipo is None:
            return [], "No se pudo reconocer el tipo del archivo '{0}'.".format(archivo.filename)

        if tipo.mime not in TIPOS_PERMITIDOS:
            return [], "El archivo '{0}' no es una imagen ni un video valido.".format(archivo.filename)

    return utiles, ""


def guardar_archivos(archivos, carpeta_destino):
    """Escribe los archivos en disco con un nombre generado por el servidor.

    Retorna una lista de diccionarios con:
        nombre_en_disco : nombre aleatorio con el que quedo guardado
        nombre_original : nombre que envio el cliente, ya "saneado"
        ruta_completa   : ruta absoluta, por si hay que borrarlo

    Si algo falla a mitad de camino, borra lo ya escrito y propaga el error.
    """
    os.makedirs(carpeta_destino, exist_ok=True)
    guardados = []

    try:
        for archivo in archivos:
            tipo = _tipo_real(archivo)

            #El nombre en disco lo decide el servidor (32 caracteres
            #aleatorios mas la extension que corresponde al contenido real).
            nombre_en_disco = "{0}.{1}".format(secrets.token_hex(16), tipo.extension)
            ruta_completa = os.path.join(carpeta_destino, nombre_en_disco)

            archivo.stream.seek(0)
            archivo.save(ruta_completa)

            nombre_original = secure_filename(archivo.filename)
            if nombre_original == "":
                nombre_original = nombre_en_disco

            guardados.append({
                "nombre_en_disco": nombre_en_disco,
                "nombre_original": nombre_original[:300],
                "ruta_completa": ruta_completa,
            })
    except Exception:
        eliminar_archivos(guardados)
        raise

    return guardados


def eliminar_archivos(guardados):
    """Borra del disco los archivos indicados, ignorando los que ya no esten.

    Se usa cuando la insercion en la base de datos falla despues de haber
    escrito los archivos, de esta manera no quedan archivos huerfanos.
    """
    for guardado in guardados:
        try:
            os.remove(guardado["ruta_completa"])
        except OSError:
            pass