package avistamientos.tarea4.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/* Tabla que llega con el enunciado (tabla-nota.sql). Un avistamiento puede
   tener muchas notas: la tabla no tiene UNIQUE sobre avistamiento_id, y por
   eso el enunciado habla de promedio y no de "la" nota. */
@Entity
@Table(name = "nota")
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avistamiento_id")
    private Avistamiento avistamiento;

    /* La columna es INT NOT NULL sin CHECK: la base acepta un 0, un 99 o un
       numero negativo sin reclamar. El rango 1..7 lo garantiza el servidor. */
    @Column(name = "nota")
    private Integer nota;

    public Nota() {
    }

    public Nota(Avistamiento avistamiento, Integer nota) {
        this.avistamiento = avistamiento;
        this.nota = nota;
    }

    public Integer getId() {
        return id;
    }

    public Avistamiento getAvistamiento() {
        return avistamiento;
    }

    public Integer getNota() {
        return nota;
    }
}
