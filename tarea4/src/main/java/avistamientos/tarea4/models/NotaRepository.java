package avistamientos.tarea4.models;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Integer> {

    /* Los promedios de varios avistamientos en UNA consulta, no una por fila.

       Si se pidiera el promedio avistamiento por avistamiento, una busqueda
       que devuelve 20 resultados dispararia 21 consultas (el clasico problema
       N+1). Aca MySQL agrupa y devuelve una fila por avistamiento. */
    @Query("""
            SELECT n.avistamiento.id, AVG(n.nota)
            FROM Nota n
            WHERE n.avistamiento.id IN :ids
            GROUP BY n.avistamiento.id
            """)
    List<Object[]> promediosDe(@Param("ids") List<Integer> ids);

    /* Promedio de un solo avistamiento, para responder despues de insertar una
       nota nueva. Devuelve null si el avistamiento todavia no tiene notas. */
    @Query("SELECT AVG(n.nota) FROM Nota n WHERE n.avistamiento.id = :id")
    Double promedioDe(@Param("id") Integer id);
}
