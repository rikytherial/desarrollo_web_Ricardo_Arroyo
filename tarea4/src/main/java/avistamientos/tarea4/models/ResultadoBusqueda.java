package avistamientos.tarea4.models;

/* Lo que viaja como JSON hacia el navegador. Es un record y no la entidad
   Avistamiento directamente, para no exponer el modelo completo ni arrastrar
   relaciones perezosas al serializar.

   "dia" y "nota" vienen ya formateados desde el servidor, igual que las fechas
   de los comentarios en la Tarea 3: asi el formato no depende del idioma ni de
   la zona horaria del navegador. */
public record ResultadoBusqueda(
        Integer id,
        String voluntario,
        String dia,
        String ave,
        String comuna,
        String nota) {
}
