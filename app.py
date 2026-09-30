from flask import Flask, render_template
from sqlalchemy import select

from modelo import get_session, Region, Comuna, Voluntario, Ave, Avistamiento, Registro
app = Flask(__name__)

@app.route("/")
def portada():
    return render_template("portada.html", activa="portada")

@app.route("/voluntario")
def registro_voluntario():
    return render_template("registro-voluntario.html", activa="voluntario")

@app.route("/avistamiento")
def reportar_avistamiento():
    return render_template("reportar-avistamiento.html", activa="avistamiento")

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