package avistamientos.tarea4.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import avistamientos.tarea4.models.ResultadoBusqueda;
import avistamientos.tarea4.services.BuscadorService;

/* @RestController: lo que devuelve cada metodo se serializa a JSON y se manda
   como cuerpo de la respuesta. Es el equivalente de las rutas de Flask que
   terminaban en jsonify() en la Tarea 3. */
@RestController
public class ApiController {

    private final BuscadorService buscadorService;

    public ApiController(BuscadorService buscadorService) {
        this.buscadorService = buscadorService;
    }

    /* El patron viaja como parametro de consulta y no dentro de la ruta como
       en el auxiliar 10 (/get-conf/{texto}). Con el texto en la ruta, el campo
       vacio produce /get-conf/ y responde 404, y un "/" escrito por el usuario
       parte la URL en dos. Como parametro, ambos casos son texto normal. */
    @GetMapping("/api/buscar")
    public Map<String, List<ResultadoBusqueda>> buscar(
            @RequestParam(value = "q", required = false) String q) {
        return Map.of("resultados", buscadorService.buscar(q));
    }

    /* Agrega una nota a un avistamiento. Responde siempre JSON: con el
       promedio actualizado si todo salio bien, o con el mensaje de error. */
    @PostMapping("/api/avistamientos/{id}/notas")
    public ResponseEntity<Map<String, Object>> agregarNota(
            @PathVariable("id") Integer id,
            @RequestParam(value = "nota", required = false) String nota) {

        /* La validacion esta en el servidor aunque el cliente solo ofrezca un
           select con las opciones 1 a 7: cualquiera puede enviar un POST
           directo sin pasar por la pagina. */
        String error = buscadorService.validarNota(nota);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("error", error));
        }

        if (!buscadorService.existeAvistamiento(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "El avistamiento no existe."));
        }

        String promedio = buscadorService.agregarNota(id, Integer.parseInt(nota.trim()));

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("nota", promedio));
    }
}
