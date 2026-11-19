package avistamientos.tarea4.services;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import avistamientos.tarea4.models.Avistamiento;
import avistamientos.tarea4.models.AvistamientoRepository;
import avistamientos.tarea4.models.Nota;
import avistamientos.tarea4.models.NotaRepository;
import avistamientos.tarea4.models.ResultadoBusqueda;

/* Capa de servicio: aca vive toda la logica. Los controladores solo reciben la
   peticion y arman la respuesta HTTP, siguiendo la arquitectura de 3 capas del
   auxiliar 10 (Controller -> Service -> Repository). */
@Service
public class BuscadorService {

    private static final DateTimeFormatter FORMATO_DIA = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final Locale LOCALE_CL = Locale.forLanguageTag("es-CL");
    private static final String SIN_NOTA = "-";

    private final AvistamientoRepository avistamientoRepository;
    private final NotaRepository notaRepository;

    /* Inyeccion por constructor: Spring crea estos repositorios y los entrega
       armados. En ningun punto del proyecto se hace "new" de un repositorio. */
    public BuscadorService(AvistamientoRepository avistamientoRepository,
                           NotaRepository notaRepository) {
        this.avistamientoRepository = avistamientoRepository;
        this.notaRepository = notaRepository;
    }

    public List<ResultadoBusqueda> buscar(String patron) {
        String limpio = (patron == null) ? "" : patron.trim();

        /* Con el campo vacio no se consulta la base: devolveria el listado
           completo y no es lo que pide el enunciado. */
        if (limpio.isEmpty()) {
            return List.of();
        }

        List<Avistamiento> encontrados = avistamientoRepository.buscar(escaparLike(limpio));

        if (encontrados.isEmpty()) {
            return List.of();
        }

        List<Integer> ids = new ArrayList<>();
        for (Avistamiento avistamiento : encontrados) {
            ids.add(avistamiento.getId());
        }

        Map<Integer, Double> promedios = promediosPorAvistamiento(ids);

        List<ResultadoBusqueda> resultados = new ArrayList<>();
        for (Avistamiento avistamiento : encontrados) {
            resultados.add(new ResultadoBusqueda(
                    avistamiento.getId(),
                    avistamiento.getVoluntario().getNombre(),
                    avistamiento.getFechaHora().format(FORMATO_DIA),
                    avistamiento.getAve().getNombre(),
                    avistamiento.getVoluntario().getComuna().getNombre(),
                    formatearNota(promedios.get(avistamiento.getId()))));
        }

        return resultados;
    }

    private Map<Integer, Double> promediosPorAvistamiento(List<Integer> ids) {
        Map<Integer, Double> promedios = new HashMap<>();

        if (ids.isEmpty()) {
            return promedios;
        }

        /* La consulta devuelve filas de dos columnas. Se leen como Number y no
           como Integer/Double directo, porque el tipo exacto que entrega el
           driver puede variar (Long, BigDecimal) segun la version de MySQL. */
        for (Object[] fila : notaRepository.promediosDe(ids)) {
            Integer idAvistamiento = ((Number) fila[0]).intValue();
            Double promedio = ((Number) fila[1]).doubleValue();
            promedios.put(idAvistamiento, promedio);
        }

        return promedios;
    }

    /* Valida la nota que llega del navegador. Devuelve el mensaje de error, o
       null si la nota es valida.

       Llega como texto y no como int a proposito: si el parametro fuera int,
       un envio con "abc" lo rechazaria Spring con su propio error antes de
       llegar aca, y la respuesta no seria el JSON que espera el cliente. */
    public String validarNota(String texto) {
        if (texto == null || texto.trim().isEmpty()) {
            return "Debes seleccionar una nota.";
        }

        String limpio = texto.trim();

        /* Solo digitos: descarta "3.5", "3,5", " -2" y cualquier texto. */
        if (!limpio.matches("\\d+")) {
            return "La nota debe ser un numero entero entre 1 y 7.";
        }

        int valor;
        try {
            valor = Integer.parseInt(limpio);
        } catch (NumberFormatException error) {
            // Una cadena de digitos mas larga que un int.
            return "La nota debe ser un numero entero entre 1 y 7.";
        }

        if (valor < 1 || valor > 7) {
            return "La nota debe estar entre 1 y 7.";
        }

        return null;
    }

    public boolean existeAvistamiento(Integer id) {
        return avistamientoRepository.existsById(id);
    }

    /* Inserta la nota y devuelve el promedio actualizado, ya formateado. El
       mismo metodo hace las dos cosas para que el navegador reciba el promedio
       nuevo en la misma respuesta y no tenga que volver a preguntar. */
    @Transactional
    public String agregarNota(Integer avistamientoId, int valor) {
        Avistamiento avistamiento = avistamientoRepository.findById(avistamientoId).orElseThrow();
        notaRepository.save(new Nota(avistamiento, valor));
        return formatearNota(notaRepository.promedioDe(avistamientoId));
    }

    private String formatearNota(Double promedio) {
        if (promedio == null) {
            return SIN_NOTA;
        }
        return String.format(LOCALE_CL, "%.1f", promedio);
    }

    /* % y _ son comodines de LIKE y ! es el caracter de escape declarado en la
       consulta, asi que los tres se escapan antes de armar el patron. */
    private String escaparLike(String texto) {
        return texto.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }
}
