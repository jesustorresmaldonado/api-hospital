// Importación de dependencias
const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify/sync');
const app = express();
const PORT = 7050;
const path = require('path'); // Agrega esto al inicio del archivo
app.use(express.json());

// Variables para almacenar los datos
let cuentas = [];
let medicos = [];
let especialidades = [];
let turnos = [];

// Funciones para cargar archivos CSV

// Leer cuentas.csv
function leerCuentasCSV() {
  return new Promise((resolve, reject) => {
    const resultados = [];
    fs.createReadStream('datos/cuentas.csv')
      .pipe(csv())
      .on('data', (fila) => resultados.push(fila))
      .on('end', () => {
        cuentas = resultados;
        console.log('Cuentas cargadas.');
        resolve();
      })
      .on('error', reject);
  });
}

// Leer medicos.csv
function leerMedicosCSV() {
  return new Promise((resolve, reject) => {
    const resultados = [];
    fs.createReadStream('datos/medicos.csv')
      .pipe(csv())
      .on('data', (fila) => resultados.push(fila))
      .on('end', () => {
        medicos = resultados;
        console.log('Médicos cargados.');
        resolve();
      })
      .on('error', reject);
  });
}

// Leer especialidades.csv
function leerEspecialidadesCSV() {
  return new Promise((resolve, reject) => {
    const resultados = [];
    fs.createReadStream('datos/especialidades.csv')
      .pipe(csv())
      .on('data', (fila) => resultados.push(fila))
      .on('end', () => {
        especialidades = resultados;
        console.log('Especialidades cargadas.');
        resolve();
      })
      .on('error', reject);
  });
}

// Leer turnos.csv
function leerTurnosCSV() {
  return new Promise((resolve, reject) => {
    const resultados = [];
    fs.createReadStream('datos/turnos.csv')
      .pipe(csv())
      .on('data', (fila) => resultados.push(fila))
      .on('end', () => {
        turnos = resultados;
        console.log('Turnos cargados.');
        resolve();
      })
      .on('error', reject);
  });
}

// Cargar todos los archivos
async function cargarArchivos() {
  try {
    await leerCuentasCSV();
    await leerMedicosCSV();
    await leerEspecialidadesCSV();
    await leerTurnosCSV();
    console.log('Todos los archivos han sido cargados correctamente.');
  } catch (error) {
    console.error('Error al cargar los archivos:', error);
  }
}

// Guardar turnos en turnos.csv
const guardarTurnosCSV = () => {
  const rutaCSV = path.join(__dirname, 'datos/turnos.csv');
  const columnas = ['id_turno', 'id_cuenta', 'id_especialidad', 'legajo_medico', 'fecha', 'horario', 'obra_social', 'motivo_consulta', 'estado', 'observaciones'];

  // Filtrar turnos válidos y evitar líneas vacías
  const contenido = turnos
    .filter(t => t.id_turno && t.id_cuenta) // Evita guardar registros vacíos o corruptos
    .map(t => `${t.id_turno},${t.id_cuenta},${t.id_especialidad},${t.legajo_medico},${t.fecha},${t.horario},${t.obra_social},${t.motivo_consulta},${t.estado},${t.observaciones}`)
    .join("\n");

  fs.writeFileSync(rutaCSV, `${columnas.join(",")}\n${contenido}`, 'utf-8');

  console.log('Turnos actualizados en archivo.');
};

// Guardar cuentas en cuentas.csv
const guardarCuentasCSV = () => {
  const rutaCSV = path.join(__dirname, 'datos/cuentas.csv');
  const columnas = ['id_cuenta', 'dni', 'contraseña'];

  // Filtrar usuarios válidos y evitar líneas vacías
  const contenido = cuentas
    .filter(u => u.id_cuenta && u.dni && u.contraseña) // Evita registros vacíos o corruptos
    .map(u => `${u.id_cuenta},${u.dni},${u.contraseña}`)
    .join("\n");

  fs.writeFileSync(rutaCSV, `${columnas.join(",")}\n${contenido}`, 'utf-8');

  console.log('Usuarios guardados correctamente.');
};
// Middleware de autenticación (validar usuario antes de acceder a rutas protegidas)
function autenticarUsuario(req, res, next) {
  const { dni, contraseña } = req.query;

  console.log('Validando autorización...');

  if (!dni || !contraseña) {
    return res.status(401).send('Faltan credenciales');
  }

  const usuario = cuentas.find(u => u.dni === dni && u.contraseña === contraseña);

  if (usuario) {
    req.usuario = usuario; // Guarda el usuario en la request
    next();
  } else {
    res.status(403).send('No autorizado');
  }
}

// Obtener el último ID del CSV correctamente
const obtenerNuevoIdCuenta = () => {
  const rutaCSV = path.join(__dirname, 'datos/cuentas.csv');

  if (!fs.existsSync(rutaCSV)) {
    return "C0001"; // Si el archivo no existe, empezamos desde C0001
  }

  const datosCSV = fs.readFileSync(rutaCSV, 'utf-8').split('\n').filter(linea => linea.trim());

  if (datosCSV.length <= 1) {
    return "C0001"; // Si solo tiene el encabezado, empezar desde C0001
  }

  // Obtener la última línea válida del CSV
  const ultimaLinea = datosCSV.filter(linea => linea.includes(',')).pop();
  if (!ultimaLinea) {
    return "C0001"; // Manejo de error si no hay datos válidos
  }

  const ultimoIdCuenta = ultimaLinea.split(',')[0]; // Primer campo de la última línea

  if (!ultimoIdCuenta.startsWith('C')) {
    return "C0001"; // Manejo de error si el formato es incorrecto
  }

  const nuevoNumero = parseInt(ultimoIdCuenta.substring(1)) + 1;

  return `C${String(nuevoNumero).padStart(4, '0')}`;
};


// Rutas

// Ruta de registro de usuario (Validado)
app.put('/registro', (req, res) => {
  const { dni, contraseña } = req.body;

  if (!dni || !contraseña) {
    return res.status(400).json({ mensaje: 'DNI y contraseña son requeridos.' });
  }

  const usuarioExistente = cuentas.find((u) => u.dni === dni);

  if (usuarioExistente) {
    return res.status(400).json({ mensaje: 'El DNI ya está registrado.' });
  }

  // Obtener el nuevo ID correctamente desde el CSV
  const nuevoIdCuenta = obtenerNuevoIdCuenta();

  const nuevoUsuario = {
    id_cuenta: nuevoIdCuenta,
    dni,
    contraseña
  };

  cuentas.push(nuevoUsuario);
  guardarCuentasCSV(); // Guardar en el archivo CSV

  return res.status(201).json({
    mensaje: 'Usuario registrado con éxito',
    id_cuenta: nuevoIdCuenta
  });
});

// Ruta de inicio de sesión (Validado)
app.post('/login', (req, res) => {
  const { dni, contraseña } = req.body;

  const usuario = cuentas.find((u) => u.dni === dni && u.contraseña === contraseña);

  if (!usuario) {
    return res.status(401).json({ mensaje: 'DNI o contraseña incorrecta, vuelva a intentarlo.' });
  }

  return res.status(200).json({
    mensaje: 'Inicio de sesión exitoso.',
    id_cuenta: usuario.id_cuenta
  });
});

const obtenerNuevoIdTurno = () => {
  const rutaCSV = path.join(__dirname, 'datos/turnos.csv');

  if (!fs.existsSync(rutaCSV)) {
    return 1; // Si el archivo no existe, empieza desde 1
  }

  const datosCSV = fs.readFileSync(rutaCSV, 'utf-8').split('\n').filter(linea => linea.trim());

  if (datosCSV.length <= 1) {
    return 1; // Si solo tiene encabezados, empieza desde 1
  }

  // Obtener la última línea válida y evitar espacios en blanco
  const ultimaLinea = datosCSV.filter(linea => linea.includes(',')).pop();
  if (!ultimaLinea) {
    return 1; // Si no hay datos válidos, empezar desde 1
  }

  const ultimoIdTurno = parseInt(ultimaLinea.split(',')[0]); // Extraer ID de turno
  return isNaN(ultimoIdTurno) ? 1 : ultimoIdTurno + 1;
};

// Ruta para solicitar turno (requiere autenticación) (Validado)
app.post('/solicitar-turno', autenticarUsuario, (req, res) => {
  const { fecha, horario, obra_social, especialidad, motivo_consulta } = req.body;

  if (!fecha || !horario || !obra_social || !especialidad || !motivo_consulta) {
    return res.status(400).json({ mensaje: 'Faltan datos requeridos.' });
  }

  // Validar fecha
  const fechaTurno = new Date(`${fecha}T${horario}`);
  const ahora = new Date();
  if (fechaTurno < ahora) {
    return res.status(400).json({ mensaje: 'No se pueden solicitar turnos en fechas pasadas.' });
  }

  // Validar fin de semana
  const diaSemana = fechaTurno.getDay(); // 0 = domingo, 6 = sábado
  if (diaSemana === 0 || diaSemana === 6) {
    return res.status(400).json({ mensaje: 'No se pueden solicitar turnos los fines de semana.' });
  }

  // Validar que no tenga más de 3 turnos pendientes
  const turnosUsuario = turnos.filter(t =>
    t.id_cuenta === req.usuario.id_cuenta &&
    t.estado === 'pendiente'
  );
  if (turnosUsuario.length >= 3) {
    return res.status(400).json({ mensaje: 'Ya tiene 3 turnos pendientes. Cancele alguno para solicitar otro.' });
  }

  // Buscar id_especialidad
  const especialidadEncontrada = especialidades.find(e => e.nombre_especialidad.toLowerCase() === especialidad.toLowerCase());
  if (!especialidadEncontrada) {
    return res.status(404).json({ mensaje: 'Especialidad no encontrada.' });
  }

  const id_especialidad = especialidadEncontrada.id_especialidad;

// Mapeo de nombres de día a minúsculas en español
  const diasSemana = [
    'domingo', 'lunes', 'martes', 'miércoles',
    'jueves', 'viernes', 'sábado'
  ];

  // Obtener día de la semana en palabra
  const nombreDia = diasSemana[fechaTurno.getDay()];

  // Buscar médico disponible
  const medicoDisponible = medicos.find(m => {
    // Normalizar lista de días del CSV
    const diasAtencion = m.dias_atencion
      .split(',')
      .map(d => d.trim().toLowerCase());

    // Verificar día
    if (!diasAtencion.includes(nombreDia)) return false;

    // Verificar estado activo
    if (m.estado.toLowerCase() !== 'activo') return false;

    // Verificar horario (string compare funciona con "HH:MM")
    if (horario < m.hora_inicio || horario > m.hora_fin) return false;

    // Verificar que el médico no tenga ya un turno en ese día y horario
    const choque = turnos.some(t =>
      t.legajo_medico === m.legajo &&
      t.fecha === fecha &&
      t.horario === horario
    );
    if (choque) return false;

    // Coincide especialidad
    return m.id_especialidad === id_especialidad;
  });

  if (!medicoDisponible) {
    return res.status(404).json({
      mensaje: 'No hay médicos disponibles en ese horario para esa especialidad.'
    });
  }

  // Crear el nuevo turno
  const nuevoTurno = {
    id_turno: obtenerNuevoIdTurno(), // Genera correctamente el ID
    id_cuenta: req.usuario.id_cuenta,
    id_especialidad,
    legajo_medico: medicoDisponible.legajo,
    fecha,
    horario,
    obra_social,
    motivo_consulta,
    estado: "pendiente",
    observaciones: motivo_consulta
  };

  turnos.push(nuevoTurno);
  guardarTurnosCSV();

  return res.status(201).json({
    mensaje: 'Turno solicitado con éxito.',
    turno: nuevoTurno
  });
});

// Ruta para ver los turnos solicitados por el usuario autenticado (Validado)
app.get('/mis-turnos', autenticarUsuario, (req, res) => {
  const usuario = req.usuario;

  const turnosUsuario = turnos.filter((turno) => turno.id_cuenta === usuario.id_cuenta);

  if (turnosUsuario.length === 0) {
    return res.status(404).json({ mensaje: 'No tiene turnos solicitados.' });
  }

  return res.status(200).json({
    mensaje: 'Turnos encontrados',
    turnos: turnosUsuario
  });
});

// Ruta para cancelar un turno
app.delete('/cancelar-turno/:id_turno', autenticarUsuario, (req, res) => {
  const { id_turno } = req.params;
  const usuario = req.usuario;

  const turno = turnos.find(t => t.id_turno === id_turno && t.id_cuenta === usuario.id_cuenta);

  if (!turno) {
    return res.status(404).json({ mensaje: 'Turno no encontrado o no pertenece a esta cuenta.' });
  }

  // Modificar estado y observaciones
  turno.estado = 'cancelado';
  turno.observaciones = req.body?.motivo_cancelacion || 'Cancelación confirmada';

  guardarTurnosCSV();

  return res.status(200).json({ mensaje: 'Turno cancelado correctamente.', turno });
});

// Iniciar servidor
cargarArchivos().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});