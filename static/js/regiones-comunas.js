/* Datos de regiones y comunas de Chile 
    cada clave es el nombre de una region y su
   valor es el arreglo de comunas de esa region.
   PD. Al tratarse de un prototipo, no incluí la totalidad de las comunas 
   por región, solo una selección de ellas.
*/ 

const REGIONES = {
    "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
    "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica", "Huara"],
    "Antofagasta": ["Antofagasta", "Mejillones", "Taltal", "Calama", "San Pedro de Atacama", "Tocopilla"],
    "Atacama": ["Copiapó", "Caldera", "Tierra Amarilla", "Vallenar", "Huasco", "Chañaral"],
    "Coquimbo": ["La Serena", "Coquimbo", "Andacollo", "Vicuña", "Ovalle", "Illapel", "Los Vilos"],
    "Valparaíso": ["Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana", "Quintero", "San Antonio", "Zapallar", "La Ligua", "Los Andes"],
    "Metropolitana de Santiago": ["Santiago", "Providencia", "Las Condes", "Vitacura", "Ñuñoa", "La Florida", "Maipú", "Puente Alto", "San Bernardo", "Melipilla", "Talagante"],
    "Libertador General Bernardo O'Higgins": ["Rancagua", "Machalí", "San Fernando", "Santa Cruz", "Pichilemu", "Rengo"],
    "Maule": ["Talca", "Curicó", "Linares", "Cauquenes", "Constitución", "Molina"],
    "Ñuble": ["Chillán", "Chillán Viejo", "San Carlos", "Bulnes", "Quirihue", "Coihueco"],
    "Biobío": ["Concepción", "Talcahuano", "San Pedro de la Paz", "Chiguayante", "Coronel", "Lota", "Los Ángeles", "Arauco"],
    "La Araucanía": ["Temuco", "Padre Las Casas", "Villarrica", "Pucón", "Angol", "Victoria", "Nueva Imperial"],
    "Los Ríos": ["Valdivia", "La Unión", "Río Bueno", "Panguipulli", "Lanco", "Corral"],
    "Los Lagos": ["Puerto Montt", "Puerto Varas", "Osorno", "Castro", "Ancud", "Frutillar", "Maullín", "Calbuco"],
    "Aysén del General Carlos Ibáñez del Campo": ["Coyhaique", "Aysén", "Chile Chico", "Cochrane", "Cisnes"],
    "Magallanes y de la Antártica Chilena": ["Punta Arenas", "Puerto Natales", "Porvenir", "Cabo de Hornos", "Torres del Paine"]
};

/* LLenado de los selectores */

function llenarSelectorRegiones() {
    const selectorRegion = document.getElementById("region");

    if (selectorRegion === null) {
        return;
    }

    const nombresRegiones = Object.keys(REGIONES);

    for (let i = 0; i < nombresRegiones.length; i++) {
        const opcion = document.createElement("option");
        opcion.value = nombresRegiones[i];
        opcion.textContent = nombresRegiones[i];
        selectorRegion.appendChild(opcion);
    }
}


function llenarSelectorComunas(nombreRegion) {
    const selectorComuna = document.getElementById("comuna");

    if (selectorComuna === null) {
        return;
    }

    vaciarSelector(selectorComuna, "Seleccione comuna");

    if (nombreRegion === "") {
        return;
    }

    const comunas = REGIONES[nombreRegion];

    for (let i = 0; i < comunas.length; i++) {
        const opcion = document.createElement("option");
        opcion.value = comunas[i];
        opcion.textContent = comunas[i];
        selectorComuna.appendChild(opcion);
    }
}


function vaciarSelector(selector, textoInicial) {
    selector.textContent = "";

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = textoInicial;
    selector.appendChild(opcionInicial);
}
/* Inicializacion: Conectamos todas las funciones al cargar la pagina. */

function iniciarSelectoresGeograficos() {
    const selectorRegion = document.getElementById("region");

    if (selectorRegion === null) {
        return;
    }

    llenarSelectorRegiones();

    selectorRegion.addEventListener("change", function () {
        llenarSelectorComunas(selectorRegion.value);
    });
}

document.addEventListener("DOMContentLoaded", iniciarSelectoresGeograficos);
