package avistamientos.tarea4.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/*Lo que devuelve es el nombre de una plantilla de Thymeleaf, no el cuerpo de la respuesta. */
@Controller
public class AppController {

    @GetMapping({ "/", "/buscador" })
    public String buscadorRoute() {
        return "buscador";
    }
}
