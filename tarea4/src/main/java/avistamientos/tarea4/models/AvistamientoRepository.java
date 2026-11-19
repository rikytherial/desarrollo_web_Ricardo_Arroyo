package avistamientos.tarea4.models;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AvistamientoRepository extends JpaRepository<Avistamiento, Integer> {

    /* El filtrado lo hace MySQL, no Java.

       El auxiliar 10 resuelve su buscador con findAll() y despues recorre la
       lista en memoria. Eso trae la tabla entera en cada tecla que se escribe.
       Aca la condicion viaja a la base y vuelven solo las filas que calzan.

       LOWER() en ambos lados deja la busqueda explicitamente insensible a
       mayusculas sin depender del collation de la tabla.

       ESCAPE '!' es necesario porque % y _ son comodines de LIKE: sin esto,
       escribir un "%" en el buscador devolveria todos los avistamientos. El
       servicio escapa esos caracteres antes de llamar aca. */
    @Query("""
            SELECT a FROM Avistamiento a
            JOIN a.ave av
            JOIN a.voluntario v
            JOIN v.comuna c
            WHERE LOWER(av.nombre) LIKE LOWER(CONCAT('%', :patron, '%')) ESCAPE '!'
               OR LOWER(v.nombre)  LIKE LOWER(CONCAT('%', :patron, '%')) ESCAPE '!'
               OR LOWER(c.nombre)  LIKE LOWER(CONCAT('%', :patron, '%')) ESCAPE '!'
            ORDER BY a.fechaHora DESC
            """)
    List<Avistamiento> buscar(@Param("patron") String patron);
}
