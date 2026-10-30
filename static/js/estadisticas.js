/*Estadisticas: pide los datos al servidor con fetch y dibuja los tres
graficos con Highcharts en el lado del cliente. 
Luego, si un grafico no tiene datos se avisa en su lugar, porque Highcharts
dibujaria un recuadro vacio sin explicacion.*/

function hayDatos(idContenedor, datos) {
    if (datos.length > 0) {
        return true;
    }
    document.getElementById(idContenedor).textContent =
        "Todavia no hay datos para este grafico.";
    return false;
}

/*Convierte "dd-mm-aaaa" al timestamp UTC que espera un eje de tipo datetime.*/
function aTimestamp(texto) {
    const partes = texto.split("-");
    return Date.UTC(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
}


function dibujarPorDia(datos) {
    if (hayDatos("grafico-por-dia", datos) === false) {
        return;
    }

    /*El eje va como datetime y no como categorias de texto, pues con categorias
    cada dia ocupa el mismo ancho y con un rango de meses el eje queda
    ilegible. Luego, como datetime Highcharts rotula por mes y los puntos quedan
    ubicados en el tiempo real.*/
    Highcharts.chart("grafico-por-dia", {
        chart: { type: "line" },
        title: { text: null },
        xAxis: {
            type: "datetime",
            title: { text: "Día" }
        },
        yAxis: {
            title: { text: "Cantidad de avistamientos" },
            allowDecimals: false,
            min: 0
        },
        tooltip: {
            xDateFormat: "%d-%m-%Y",
            pointFormat: "{series.name}: <b>{point.y}</b>"
        },
        series: [{
            name: "Avistamientos",
            data: datos.map(function (fila) {
                return [aTimestamp(fila.dia), fila.total];
            })
        }]
    });
}


function dibujarPorAve(datos) {
    if (hayDatos("grafico-por-ave", datos) === false) {
        return;
    }

    Highcharts.chart("grafico-por-ave", {
        chart: { type: "pie" },
        title: { text: null },
        tooltip: {
            pointFormat: "Avistamientos: <b>{point.y}</b> ({point.percentage:.1f}%)"
        },
        series: [{
            name: "Avistamientos",
            data: datos.map(function (fila) {
                return { name: fila.nombre, y: fila.total };
            })
        }]
    });
}


function dibujarPorComuna(datos) {
    if (hayDatos("grafico-por-comuna", datos) === false) {
        return;
    }

    /*En Highcharts "column" son barras verticales y "bar" son horizontales.*/
    Highcharts.chart("grafico-por-comuna", {
        chart: { type: "column" },
        title: { text: null },
        xAxis: {
            categories: datos.map(function (fila) { return fila.nombre; }),
            title: { text: "Comuna" }
        },
        yAxis: {
            title: { text: "Voluntarios registrados" },
            allowDecimals: false,
            min: 0
        },
        legend: { enabled: false },
        series: [{
            name: "Voluntarios",
            data: datos.map(function (fila) { return fila.total; })
        }]
    });
}


function cargarEstadisticas() {
    const contenedor = document.getElementById("graficos");

    if (contenedor === null) {
        return;
    }

    const estado = document.getElementById("estado-graficos");

    fetch(contenedor.getAttribute("data-url"))
        .then(function (respuesta) {
            if (respuesta.ok === false) {
                throw new Error("respuesta no exitosa");
            }
            return respuesta.json();
        })
        .then(function (datos) {
            estado.hidden = true;
            dibujarPorDia(datos.avistamientos_por_dia);
            dibujarPorAve(datos.avistamientos_por_ave);
            dibujarPorComuna(datos.voluntarios_por_comuna);
        })
        .catch(function () {
            estado.textContent = "No fue posible cargar las estadísticas.";
            estado.className = "error";
        });
}


document.addEventListener("DOMContentLoaded", cargarEstadisticas);