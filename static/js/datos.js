/* Datos de ejemplo del prototipo:

   El enunciado indica que no es necesario almacenar la informacion ingresada, por lo que el listado y las
   estadisticas las construire a partir de estos arreglos.  */


/* Equivalencia entre el valor interno de cada tipo de ave y su nombre legible. Se mantiene aparte para que el valor guardado
   sea estable aunque cambie el texto que se muestra. */
const TIPOS_AVE = {
    "rapaz": "Rapaz",
    "acuatica": "Acuatica",
    "passeriforme": "Passeriforme (canora)",
    "zancuda": "Zancuda",
    "marina": "Marina",
    "otra": "Otra"
};


const VOLUNTARIOS = [
    { nombre: "Benjamin Contreras", region: "Los Lagos" },
    { nombre: "Antonia Fuentes", region: "Coquimbo" },
    { nombre: "Javiera Munoz", region: "Biobio" },
    { nombre: "Matias Soto", region: "Valparaiso" },
    { nombre: "Camila Reyes", region: "Metropolitana de Santiago" },
    { nombre: "Ignacio Vera", region: "Los Lagos" },
    { nombre: "Fernanda Lillo", region: "La Araucania" }
];


/* Las fechas usan el formato AAAA-MM-DD, el mismo que entrega un input type="date". */
const AVISTAMIENTOS = [
    { fecha: "2026-08-28", hora: "07:15", nombreAve: "Pato jergon grande", tipo: "acuatica", lugar: "Estuario del Rio Maullin", region: "Los Lagos", comuna: "Maullin", voluntario: "Benjamin Contreras", evidencia: "Video" },
    { fecha: "2026-08-19", hora: "10:20", nombreAve: "Tiuque", tipo: "rapaz", lugar: "Quebrada de Vicuna", region: "Coquimbo", comuna: "Vicuna", voluntario: "Antonia Fuentes", evidencia: "Foto" },
    { fecha: "2026-08-06", hora: "08:05", nombreAve: "Bandurria", tipo: "zancuda", lugar: "Salto del Laja", region: "Biobio", comuna: "Los Angeles", voluntario: "Javiera Munoz", evidencia: "Foto" },
    { fecha: "2026-07-24", hora: "15:25", nombreAve: "Pinguino de Humboldt", tipo: "marina", lugar: "Isla Cachagua", region: "Valparaiso", comuna: "Zapallar", voluntario: "Matias Soto", evidencia: "Video" },
    { fecha: "2026-07-11", hora: "09:40", nombreAve: "Zorzal", tipo: "passeriforme", lugar: "Parque Bicentenario", region: "Metropolitana de Santiago", comuna: "Vitacura", voluntario: "Camila Reyes", evidencia: "Foto" },
    { fecha: "2026-07-02", hora: "11:00", nombreAve: "Peuco", tipo: "rapaz", lugar: "Parque Nacional Alerce Andino", region: "Los Lagos", comuna: "Puerto Montt", voluntario: "Benjamin Contreras", evidencia: "Foto" },
    { fecha: "2026-06-21", hora: "13:15", nombreAve: "Cachana", tipo: "otra", lugar: "Reserva Nacional Las Chinchillas", region: "Coquimbo", comuna: "Illapel", voluntario: "Antonia Fuentes", evidencia: "Video" },
    { fecha: "2026-06-14", hora: "07:30", nombreAve: "Cisne de cuello negro", tipo: "acuatica", lugar: "Laguna Grande de San Pedro", region: "Biobio", comuna: "San Pedro de la Paz", voluntario: "Javiera Munoz", evidencia: "Foto" },
    { fecha: "2026-06-01", hora: "10:55", nombreAve: "Diucon", tipo: "passeriforme", lugar: "Parque Quebrada Verde", region: "Valparaiso", comuna: "Valparaiso", voluntario: "Matias Soto", evidencia: "Foto" },
    { fecha: "2026-05-19", hora: "08:10", nombreAve: "Queltehue", tipo: "zancuda", lugar: "Parque O'Higgins", region: "Metropolitana de Santiago", comuna: "Santiago", voluntario: "Camila Reyes", evidencia: "Video" },
    { fecha: "2026-05-08", hora: "16:40", nombreAve: "Pinguino de Humboldt", tipo: "marina", lugar: "Bahia de Coquimbo", region: "Coquimbo", comuna: "Coquimbo", voluntario: "Antonia Fuentes", evidencia: "Foto" },
    { fecha: "2026-04-27", hora: "09:05", nombreAve: "Chincol", tipo: "passeriforme", lugar: "Cerro Nielol", region: "La Araucania", comuna: "Temuco", voluntario: "Fernanda Lillo", evidencia: "Foto" },
    { fecha: "2026-04-15", hora: "12:30", nombreAve: "Aguilucho", tipo: "rapaz", lugar: "Valle del Elqui", region: "Coquimbo", comuna: "Vicuna", voluntario: "Antonia Fuentes", evidencia: "Video" },
    { fecha: "2026-04-03", hora: "07:50", nombreAve: "Garza cuca", tipo: "zancuda", lugar: "Humedal de Puerto Varas", region: "Los Lagos", comuna: "Puerto Varas", voluntario: "Ignacio Vera", evidencia: "Foto" },
    { fecha: "2026-03-22", hora: "14:10", nombreAve: "Pelicano", tipo: "marina", lugar: "Caleta Portales", region: "Valparaiso", comuna: "Valparaiso", voluntario: "Matias Soto", evidencia: "Foto" },
    { fecha: "2026-03-09", hora: "08:45", nombreAve: "Tordo", tipo: "passeriforme", lugar: "Parque Metropolitano", region: "Metropolitana de Santiago", comuna: "Providencia", voluntario: "Camila Reyes", evidencia: "Foto" },
    { fecha: "2026-02-25", hora: "11:20", nombreAve: "Pato real", tipo: "acuatica", lugar: "Lago Villarrica", region: "La Araucania", comuna: "Villarrica", voluntario: "Fernanda Lillo", evidencia: "Video" },
    { fecha: "2026-02-11", hora: "17:05", nombreAve: "Cormoran", tipo: "marina", lugar: "Canal de Chacao", region: "Los Lagos", comuna: "Ancud", voluntario: "Ignacio Vera", evidencia: "Foto" },
    { fecha: "2026-01-28", hora: "06:55", nombreAve: "Bandurria", tipo: "zancuda", lugar: "Vega de Chiguayante", region: "Biobio", comuna: "Chiguayante", voluntario: "Javiera Munoz", evidencia: "Foto" },
    { fecha: "2026-01-16", hora: "13:35", nombreAve: "Cernicalo", tipo: "rapaz", lugar: "Campos de Melipilla", region: "Metropolitana de Santiago", comuna: "Melipilla", voluntario: "Camila Reyes", evidencia: "Video" },
    { fecha: "2025-12-30", hora: "09:15", nombreAve: "Pinguino de Humboldt", tipo: "marina", lugar: "Isla Damas", region: "Coquimbo", comuna: "La Serena", voluntario: "Antonia Fuentes", evidencia: "Foto" },
    { fecha: "2025-12-12", hora: "10:40", nombreAve: "Chincol", tipo: "passeriforme", lugar: "Parque Katalapi", region: "Los Lagos", comuna: "Puerto Montt", voluntario: "Ignacio Vera", evidencia: "Foto" }
];