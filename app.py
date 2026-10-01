from datetime import datetime

from flask import Flask, render_template, request, redirect, url_for, abort
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from modelo import get_session, Region, Comuna, Voluntario, Ave, Avistamiento, Registro
from validaciones import validar_voluntario, validar_avistamiento

app = Flask(__name__)
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


@app.route("/")
def portada():
    #El texto del mensaje NO viene de la URL, la URL solo trae una clave que
    #se busca en un diccionario fijo del servidor. Asi entonces, un enlace manipulado
    #no puede insertar texto ni HTML en la pagina.
    mensaje = MENSAJES.get(request.args.get("ok", ""))

    return render_template("portada.html", activa="portada", mensaje=mensaje)

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

        if len(errores) > 0:
            return render_template(
                "reportar-avistamiento.html",
                activa="avistamiento",
                regiones=regiones,
                aves=aves,
                datos=datos,
                errores=errores,
            )

        avistamiento = Avistamiento(
            voluntario_id=datos["_voluntario"].id,
            ave_id=datos["_ave"].id,
            fecha_hora=datos["_fecha_hora"],
            lugar=datos["lugar"],
            descripcion=datos["descripcion"] if datos["descripcion"] != "" else None,
        )

        try:
            session.add(avistamiento)
            session.commit()
        except Exception as error:
            session.rollback()
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
    return render_template("avistamientos.html", activa="listado")

@app.route("/prueba-modelos")
def prueba_modelos():
    with get_session() as session:
        aves = session.scalars(select(Ave).order_by(Ave.nombre).limit(5)).all()
        comuna = session.scalars(select(Comuna).where(Comuna.nombre == "Ñuñoa")).first()

        salida = "<h2>Primeras 5 aves</h2><ul>"
        for ave in aves:
            salida += f"<li>{ave.id} - {ave.nombre}</li>"
        salida += "</ul>"
        salida += f"<p>Ñuñoa pertenece a: {comuna.region.nombre}</p>"
    return salida

if __name__ == "__main__":
    app.run(debug=True)