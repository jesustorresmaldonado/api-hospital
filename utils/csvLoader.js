// utils/csvLoader.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../db');

const DATA_FOLDER = path.join(__dirname, '../datos');

/**
 * Función auxiliar para obtener o crear un Rol y devolver su id_rol.
 * @param {string} nombre_rol
 * @returns {number} id_rol
 */
async function getOrCreateRoleId(nombre_rol) {
    let [rolRow] = await db.sql(`SELECT id_rol FROM Roles WHERE nombre_rol = '${nombre_rol}';`);
    if (!rolRow) {
        await db.sql(`INSERT INTO Roles (nombre_rol) VALUES ('${nombre_rol}');`);
        [rolRow] = await db.sql(`SELECT id_rol FROM Roles WHERE nombre_rol = '${nombre_rol}';`);
    }
    return rolRow.id_rol;
}

/**
 * Función auxiliar para insertar o actualizar una Persona (UPSERT).
 * @param {Object} personaData - { dni, nombre, apellido, email, telefono, id_rol }
 * @returns {number} dni de la persona (ya que es PK)
 */
async function upsertPersona(personaData) {
    const { dni, nombre, apellido, email, telefono, id_rol } = personaData;
    const query = `
        INSERT OR REPLACE INTO Personas (dni, nombre, apellido, email, telefono, id_rol)
        VALUES (${dni}, '${nombre}', '${apellido}', '${email || ''}', '${telefono || ''}', ${id_rol});
    `;
    await db.sql(query);
    return dni;
}

/**
 * Procesa un archivo CSV, extrayendo datos para la tabla Personas.
 * Intentará inferir si es de médicos o cuentas para asignar roles.
 * @param {string} filePath - La ruta completa al archivo CSV.
 */
async function processCsvToPersonas(filePath) {
    console.log(`Iniciando procesamiento de CSV: ${path.basename(filePath)}`);
    const records = [];
    let transactionStarted = false;

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (headers) => {
                console.log(`Encabezados detectados en ${path.basename(filePath)}:`, headers);
            })
            .on('data', (row) => {
                records.push(row);
            })
            .on('end', async () => {
                try {
                    if (records.length === 0) {
                        console.warn(`Archivo CSV vacío o sin datos válidos: ${path.basename(filePath)}.`);
                        return resolve();
                    }

                    await db.sql('BEGIN;');
                    transactionStarted = true;
                    console.log(`Transacción iniciada para ${path.basename(filePath)}.`);

                    const firstRow = records[0];
                    let processedRows = 0;

                    // Lógica para MEDIOS.CSV
                    if (firstRow.legajo && firstRow.dni && firstRow.matricula) {
                        const medicoRolId = await getOrCreateRoleId('Medico');
                        for (const row of records) {
                            const dni = parseInt(row.dni, 10);
                            if (isNaN(dni)) {
                                console.warn(`Saltando fila de Medicos inválida (DNI no numérico) en ${path.basename(filePath)}:`, row);
                                continue;
                            }
                            // Asumimos nombre y apellido genéricos si el CSV de Medicos no los tiene,
                            // o si quieres que los médicos del CSV aparezcan con nombres.
                            // Si tus Medicos CSV no tienen 'Nombre' y 'Apellido', usa algo genérico.
                            // Si tus Medicos CSV SI tienen Nombre y Apellido, ajusta 'row.Nombre' etc.
                            // Para el ejemplo, los creamos/actualizamos con datos mínimos de Persona.
                            try {
                                await upsertPersona({
                                    dni: dni,
                                    nombre: row.nombre || `Medico ${dni}`, // Usa row.nombre si existe, sino genérico
                                    apellido: row.apellido || `(Importado)`, // Usa row.apellido si existe, sino genérico
                                    email: row.email || null, // Asume que el CSV de medicos tiene email, si no, null
                                    telefono: row.telefono || null, // Asume que el CSV de medicos tiene telefono, si no, null
                                    id_rol: medicoRolId
                                });
                                processedRows++;
                            } catch (error) {
                                console.error(`Error al procesar médico DNI ${dni} en ${path.basename(filePath)}:`, error.message);
                            }
                        }
                        console.log(`Procesadas ${processedRows} personas con rol 'Medico' desde ${path.basename(filePath)}.`);

                    } // Lógica para CUENTAS.CSV
                    else if (firstRow.id_cuenta && firstRow.dni && firstRow.contrasenia) {
                        const pacienteRolId = await getOrCreateRoleId('Paciente');
                        for (const row of records) {
                            const dni = parseInt(row.dni, 10);
                            if (isNaN(dni)) {
                                console.warn(`Saltando fila de Cuentas inválida (DNI no numérico) en ${path.basename(filePath)}:`, row);
                                continue;
                            }
                            // Similuar a medicos, asume nombres si no están en cuentas.csv
                            try {
                                await upsertPersona({
                                    dni: dni,
                                    nombre: row.nombre || `Paciente ${dni}`, // Usa row.nombre si existe, sino genérico
                                    apellido: row.apellido || `(Importado)`, // Usa row.apellido si existe, sino genérico
                                    email: row.email || null, // Asume que el CSV de cuentas tiene email, si no, null
                                    telefono: row.telefono || null, // Asume que el CSV de cuentas tiene telefono, si no, null
                                    id_rol: pacienteRolId
                                });
                                processedRows++;
                            } catch (error) {
                                console.error(`Error al procesar cuenta DNI ${dni} en ${path.basename(filePath)}:`, error.message);
                            }
                        }
                        console.log(`Procesadas ${processedRows} personas con rol 'Paciente' desde ${path.basename(filePath)}.`);
                    }
                    // Lógica para CSVs de Personas genéricos (si tienes un personas.csv)
                    else if (firstRow.DNI && firstRow.Nombre && firstRow.Apellido && firstRow.Rol) {
                        for (const row of records) {
                            const dni = parseInt(row.DNI, 10);
                            if (isNaN(dni) || !row.Nombre || !row.Apellido) {
                                console.warn(`Saltando fila de Personas genérica inválida en ${path.basename(filePath)}:`, row);
                                continue;
                            }
                            try {
                                const id_rol = await getOrCreateRoleId(row.Rol);
                                await upsertPersona({
                                    dni: dni,
                                    nombre: row.Nombre,
                                    apellido: row.Apellido,
                                    email: row.Email || null,
                                    telefono: row.Telefono || null,
                                    id_rol: id_rol
                                });
                                processedRows++;
                            } catch (error) {
                                console.error(`Error al procesar persona DNI ${dni} en ${path.basename(filePath)}:`, error.message);
                            }
                        }
                         console.log(`Procesadas ${processedRows} personas desde CSV genérico de Personas: ${path.basename(filePath)}.`);
                    }
                    else {
                        console.warn(`Saltando CSV ${path.basename(filePath)}: No se pudo mapear a una Persona para las tablas actuales (Persona, Rol).`);
                    }

                    await db.sql('COMMIT;');
                    console.log(`Transacción confirmada para ${path.basename(filePath)}. Datos cargados exitosamente (para Personas/Roles).`);
                    resolve();
                } catch (err) {
                    if (transactionStarted) {
                        await db.sql('ROLLBACK;');
                        console.error(`Transacción revertida para ${path.basename(filePath)} debido a un error. Detalles: ${err.message}`);
                    }
                    console.error(`Error al procesar y cargar CSV ${path.basename(filePath)}:`, err);
                    reject(err);
                }
            })
            .on('error', (err) => {
                console.error(`Error leyendo stream del CSV ${path.basename(filePath)}:`, err);
                reject(err);
            });
    });
}

/**
 * Carga todos los archivos CSV de la carpeta 'datos' al iniciar el servidor.
 * Intentará procesarlos en un orden que priorice las Personas.
 */
async function loadInitialCsvData() {
    try {
        const files = await fs.promises.readdir(DATA_FOLDER);
        const csvFiles = files.filter(file => file.endsWith('.csv'));

        if (csvFiles.length === 0) {
            console.log('No se encontraron archivos CSV en la carpeta "datos" para la carga inicial.');
            return;
        }

        console.log(`Se encontraron ${csvFiles.length} archivos CSV para cargar...`);

        // Orden de carga para respetar la lógica: Personas primero, luego médicos/cuentas que se refieren a Personas.
        // Los CSV de turnos y especialidades no se cargarán a Personas/Roles.
        const orderedFileNames = [
            'personas.csv', // Si tienes uno general de personas
            'cuentas.csv',  // Pacientes (se usarán para crear Personas)
            'medicos.csv'   // Médicos (se usarán para crear Personas)
        ];

        const filesToProcess = [];
        const processedFilePaths = new Set(); // Para evitar duplicados

        // Priorizar los archivos en el orden definido
        for (const name of orderedFileNames) {
            const filePath = path.join(DATA_FOLDER, name);
            if (fs.existsSync(filePath) && csvFiles.includes(path.basename(filePath))) {
                filesToProcess.push(filePath);
                processedFilePaths.add(filePath);
            }
        }

        // Añadir cualquier otro CSV que exista pero no esté en la lista ordenada (serán saltados)
        for (const file of csvFiles) {
            const filePath = path.join(DATA_FOLDER, file);
            if (!processedFilePaths.has(filePath)) {
                filesToProcess.push(filePath);
            }
        }

        for (const filePath of filesToProcess) {
            await processCsvToPersonas(filePath);
        }
        console.log(' Carga inicial de datos CSV completada.');
    } catch (err) {
        console.error(' Error al cargar datos iniciales desde CSV:', err);
    }
}

module.exports = { loadInitialCsvData };