const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Función para leer el archivo CSV y verificar si el DNI ya está registrado
function checkIfUserExists(dni, filePath) {
  return new Promise((resolve, reject) => {
    let userExists = false;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.dni === dni) {  // Verificamos si el DNI ya está registrado
          userExists = true;
        }
      })
      .on('end', () => resolve(userExists))  // Resolvemos si encontramos el DNI o no
      .on('error', (error) => reject(error));  // Si hay un error, lo rechazamos
  });
}

// Función para agregar un nuevo usuario al archivo CSV
function registerUser(dni, password, filePath) {
  return new Promise((resolve, reject) => {
    // Creamos el escritor CSV para agregar un nuevo registro
    const csvWriter = createCsvWriter({
      path: filePath,
      append: true,  // Usamos append: true para no sobrescribir el archivo
      header: [
        { id: 'id_cuenta', title: 'id_cuenta' },
        { id: 'dni', title: 'dni' },
        { id: 'contraseña', title: 'contraseña' },
      ]
    });

    const newUser = {
      id_cuenta: Date.now(),  // Creamos un id único basado en el tiempo
      dni,
      contraseña: password
    };

    // Escribimos el nuevo usuario en el archivo CSV
    csvWriter.writeRecords([newUser])
      .then(() => resolve('Usuario registrado con éxito'))
      .catch((error) => reject('Error al registrar el usuario: ' + error));
  });
}

module.exports = { checkIfUserExists, registerUser };
