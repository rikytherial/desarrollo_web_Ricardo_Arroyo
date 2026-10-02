from datetime import datetime

from flask import Flask, render_template, request, redirect, url_for, abort
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
import os
from math import ceil

from archivos import validar_archivos, guardar_archivos, eliminar_archivos
from modelo import get_session, Region, Comuna, Voluntario, Ave, Avistamiento, Registro
from validaciones import validar_voluntario, validar_avistamiento

app = Flask(__name__)

#Carpeta donde se guardan las fotos y videos subidos.
CARPETA_SUBIDAS = os.path.join(app.root_path, "static", "uploads")

#Tope del tamaño total de una peticion, si se supera, Flask responde 413
#sin siquiera ejecutar la ruta, lo que evita que alguien llene el disco.
app.config["MAX_CONTENT_LENGTH"] = 80 * 1024 * 1024


#Funciones Auxiliares:
def cargar_regiones(session):
    """Fucnión axuiliar con la cual buscamos entregar las regiones con sus comunas,
    en el formato que espera el JavaScript que arma los selectores."""
    regiones = session.scalars(
        select(Region).options(selectinload(Region.comunas)).order_by(Region.id)
    ).all()

    return [
        {
            "id": region.id,
            "nombre": region.nombre,
            "comunas": [
                {"id": comuna.id, "nombre": comuna.nombre}
                for comuna in sorted(region.comunas, key=lambda c: c.nombre)
            ],
        }
        for region in regiones
    ]

def cargar_aves(session):
    return session.scalars(select(Ave).order_by(Ave.nombre)).all()

MENSAJES = {
    "avistamiento": "Tu avistamiento fue registrado correctamente. ¡Gracias por aportar!",
}

#Lista "blanca" de ordenamientos, esta traduce la palabra que llega por la URL a
#una columna real. Luego nunca se interpola texto del usuario en el SQL.
ORDENES = {
    "fecha": Avistamiento.fecha_hora,
    "lugar": Avistamiento.lugar,
    "ave": Ave.nombre,
}

POR_PAGINA_PERMITIDOS = (5, 10, 20)


def leer_filtros(args):
    """Lee los parametros de la URL y descarta cualquier valor no permitido.

    Si llega algo invalido o malicioso, se usa el valor por defecto en vez de
    mostrar un error, el listado siempre debe poder desplegarse.
    """
    ave = args.get("ave", "todas")
    if ave != "todas" and ave.isdigit() is False:
        ave = "todas"

    orden = args.get("orden", "fecha")
    if orden not in ORDENES:
        orden = "fecha"

    direccion = args.get("direccion", "desc")
    if direccion not in ("asc", "desc"):
        direccion = "desc"

    por_pagina = args.get("por_pagina", "10")
    if por_pagina.isdigit() is False or int(por_pagina) not in POR_PAGINA_PERMITIDOS:
        por_pagina = 10
    else:
        por_pagina = int(por_pagina)

    pagina = args.get("pagina", "1")
    if pagina.isdigit() is False or int(pagina) < 1:
        pagina = 1
    else:
        pagina = int(pagina)

    return {
        "ave": ave,
        "orden": orden,
        "direccion": direccion,
        "por_pagina": por_pagina,
        "pagina": pagina,
    }

#Rutas.
@app.route("/")
def portada():
    mensaje = MENSAJES.get(request.args.get("ok", ""))

    with get_session() as session:
        ultimos = session.scalars(
            select(Avistamiento)
            .options(joinedload(Avistamiento.ave), joinedload(Avistamiento.voluntario))
            .order_by(Avistamiento.id.desc())
            .limit(2)
        ).all()

        return render_template(
            "portada.html",
            activa="portada",
            mensaje=mensaje,
            ultimos=ultimos,
        )

@app.route("/voluntario", methods=["GET", "POST"])
def registro_voluntario():
    with get_session() as session:
        regiones = cargar_regiones(session)

        if request.method == "GET":
            return render_template(
                "registro-voluntario.html",
                activa="voluntario",
                regiones=regiones,
                datos={},
                errores={},
            )

        datos, errores = validar_voluntario(session, request.form)

        if len(errores) > 0:
            return render_template(
                "registro-voluntario.html",
                activa="voluntario",
                regiones=regiones,
                datos=datos,
                errores=errores,
            )

        voluntario = Voluntario(
            nombre=datos["nombre"] + " " + datos["apellido"],
            email=datos["correo"],
            telefono=datos["_celular_normalizado"],
            fecha_registro=datetime.now(),
            comuna_id=datos["_comuna"].id,
        )

        try:
            session.add(voluntario)
            session.commit()
        except Exception as error:
            session.rollback()
            app.logger.error("Error al insertar voluntario: %s", error)
            errores["general"] = "No fue posible completar el registro. Intenta nuevamente."
            return render_template(
                "registro-voluntario.html",
                activa="voluntario",
                regiones=regiones,
                datos=datos,
                errores=errores,
            )

        return redirect(url_for("voluntario_registrado", voluntario_id=voluntario.id))


@app.route("/voluntario/<int:voluntario_id>/registrado")
def voluntario_registrado(voluntario_id):
    with get_session() as session:
        voluntario = session.scalars(
            select(Voluntario).where(Voluntario.id == voluntario_id)
        ).first()

        if voluntario is None:
            abort(404)

        return render_template(
            "voluntario-registrado.html",
            activa="voluntario",
            voluntario=voluntario,
        )

@app.route("/avistamiento", methods=["GET", "POST"])
def reportar_avistamiento():
    with get_session() as session:
        regiones = cargar_regiones(session)
        aves = cargar_aves(session)

        if request.method == "GET":
            # Si se llega desde el registro de voluntario, se precarga su correo.
            datos = {}
            voluntario_id = request.args.get("voluntario_id", "")
            if voluntario_id.isdigit():
                voluntario = session.scalars(
                    select(Voluntario).where(Voluntario.id == int(voluntario_id))
                ).first()
                if voluntario is not None:
                    datos["correo-voluntario"] = voluntario.email

            return render_template(
                "reportar-avistamiento.html",
                activa="avistamiento",
                regiones=regiones,
                aves=aves,
                datos=datos,
                errores={},
            )

        datos, errores = validar_avistamiento(session, request.form)

        #Los archivos viajan en request.files, no en request.form.
        adjuntos, error_archivos = validar_archivos(request.files.getlist("evidencia"))
        if error_archivos != "":
            errores["evidencia"] = error_archivos

        if len(errores) > 0:
            return render_template(
                "reportar-avistamiento.html",
                activa="avistamiento",
                regiones=regiones,
                aves=aves,
                datos=datos,
                errores=errores,
            )

        #Primero se escriben los archivos en disco.
        try:
            guardados = guardar_archivos(adjuntos, CARPETA_SUBIDAS)
        except Exception as error:
            app.logger.error("Error al guardar archivos: %s", error)
            errores["evidencia"] = "No fue posible guardar los archivos. Intenta nuevamente."
            return render_template(
                "reportar-avistamiento.html",
                activa="avistamiento",
                regiones=regiones,
                aves=aves,
                datos=datos,
                errores=errores,
            )

        #Luego se inserta todo en una sola transaccion.
        avistamiento = Avistamiento(
            voluntario_id=datos["_voluntario"].id,
            ave_id=datos["_ave"].id,
            fecha_hora=datos["_fecha_hora"],
            lugar=datos["lugar"],
            descripcion=datos["descripcion"] if datos["descripcion"] != "" else None,
        )

        for guardado in guardados:
            avistamiento.registros.append(
                Registro(
                    ruta_archivo=guardado["nombre_en_disco"],
                    nombre_archivo=guardado["nombre_original"],
                )
            )

        try:
            session.add(avistamiento)
            session.commit()
        except Exception as error:
            #Si la base falla, se deshace la transaccion y se borran los
            #archivos ya escritos, para no dejar basura en el disco.
            session.rollback()
            eliminar_archivos(guardados)
            app.logger.error("Error al insertar avistamiento: %s", error)
            errores["general"] = "No fue posible registrar el avistamiento. Intenta nuevamente."
            return render_template(
                "reportar-avistamiento.html",
                activa="avistamiento",
                regiones=regiones,
                aves=aves,
                datos=datos,
                errores=errores,
            )

        return redirect(url_for("portada", ok="avistamiento"))

@app.route("/avistamientos")
def listado_avistamientos():
    filtros = leer_filtros(request.args)

    with get_session() as session:
        #Solo se muestran en el filtro las aves que tienen avistamientos.
        aves_con_avistamientos = session.scalars(
            select(Ave).join(Avistamiento).distinct().order_by(Ave.nombre)
        ).all()

        condiciones = []
        if filtros["ave"] != "todas":
            condiciones.append(Avistamiento.ave_id == int(filtros["ave"]))

        total = session.scalar(
            select(func.count()).select_from(Avistamiento).where(*condiciones)
        )

        total_paginas = max(1, ceil(total / filtros["por_pagina"]))
        if filtros["pagina"] > total_paginas:
            filtros["pagina"] = total_paginas

        columna = ORDENES[filtros["orden"]]
        if filtros["direccion"] == "asc":
            columna = columna.asc()
        else:
            columna = columna.desc()

        avistamientos = session.scalars(
            select(Avistamiento)
            .join(Ave)
            .where(*condiciones)
            .options(
                joinedload(Avistamiento.ave),
                joinedload(Avistamiento.voluntario),
                selectinload(Avistamiento.registros),
            )
            .order_by(columna)
            .limit(filtros["por_pagina"])
            .offset((filtros["pagina"] - 1) * filtros["por_pagina"])
        ).unique().all()

        return render_template(
            "avistamientos.html",
            activa="listado",
            avistamientos=avistamientos,
            aves_con_avistamientos=aves_con_avistamientos,
            filtros=filtros,
            total=total,
            total_paginas=total_paginas,
        )

EXTENSIONES_VIDEO = ("mp4", "webm", "mov", "avi")


@app.route("/avistamientos/<int:avistamiento_id>")
def detalle_avistamiento(avistamiento_id):
    with get_session() as session:
        avistamiento = session.scalars(
            select(Avistamiento).where(Avistamiento.id == avistamiento_id)
        ).first()

        if avistamiento is None:
            abort(404)

        medios = []
        for registro in avistamiento.registros:
            extension = registro.ruta_archivo.rsplit(".", 1)[-1].lower()
            medios.append({
                "url": url_for("static", filename="uploads/" + registro.ruta_archivo),
                "nombre": registro.nombre_archivo,
                "es_video": extension in EXTENSIONES_VIDEO,
            })

        return render_template(
            "detalle-avistamiento.html",
            activa="listado",
            avistamiento=avistamiento,
            medios=medios,
        )
    

@app.errorhandler(413)
def archivo_demasiado_grande(error):
    return render_template(
        "error.html",
        activa="",
        titulo="Archivo demasiado grande",
        mensaje="Los archivos enviados superan el tamano maximo permitido. "
                "Cada archivo puede pesar hasta 15 MB.",
    ), 413

@app.errorhandler(404)
def pagina_no_encontrada(error):
    return render_template(
        "error.html",
        activa="",
        titulo="Página no encontrada",
        mensaje="La página o el avistamiento que buscas no existe.",
    ), 404

if __name__ == "__main__":
    app.run(debug=True)