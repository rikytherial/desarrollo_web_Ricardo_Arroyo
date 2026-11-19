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

@Entity
@Table(name = "voluntario")
public class Voluntario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nombre")
    private String nombre;

    /* La comuna del avistamiento se obtiene por aca: el enunciado pide mostrar
       el nombre de la comuna, y la comuna cuelga del voluntario, no del
       avistamiento. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "comuna_id")
    private Comuna comuna;

    public Voluntario() {
    }

    public Integer getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public Comuna getComuna() {
        return comuna;
    }
}
