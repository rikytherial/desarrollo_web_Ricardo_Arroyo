from flask import Flask, render_template

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

if __name__ == "__main__":
    app.run(debug=True)