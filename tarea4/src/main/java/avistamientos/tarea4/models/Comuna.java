package avistamientos.tarea4.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/* Se mapean solo las columnas que necesita el buscador. El esquema ya existe
   desde la Tarea 2 y ddl-auto esta en "none", asi que JPA no exige describir
   la tabla completa. */
@Entity
@Table(name = "comuna")
public class Comuna {

    /* IDENTITY y no SequenceGenerator como en el auxiliar 10: las tablas de
       este proyecto usan AUTO_INCREMENT de MySQL, que no tiene secuencias. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nombre")
    private String nombre;

    public Comuna() {
    }

    public Integer getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }
}
