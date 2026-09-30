from flask import Flask
from sqlalchemy import create_engine, text

app = Flask(__name__)

@app.route("/")
def inicio():
    return "<h1>Flask está vivo</h1>"

@app.route("/prueba-bd")
def prueba_bd():
    url = "mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2"
    engine = create_engine(url)
    with engine.connect() as conexion:
        total = conexion.execute(text("SELECT COUNT(*) FROM ave")).scalar()
    return f"<h1>Hay {total} aves en la base de datos</h1>"

if __name__ == "__main__":
    app.run(debug=True)