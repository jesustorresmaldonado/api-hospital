let userCredentials = {};
let selectedDni = "";
let selectedPatientId = null;
let allDoctorLegajos = [];

document.addEventListener('DOMContentLoaded', () => {
  console.log('Script.js: DOMContentLoaded se ha disparado. El script se está ejecutando.');

  // Referencias a elementos del DOM (Botones de navegación y secciones)
  const btnLoadAlta = document.getElementById('load-users-btn');
  const navHome = document.getElementById('nav-home');
  const navUsers = document.getElementById('nav-users'); // Para la lista completa de Personas
  const navPatients = document.getElementById('nav-patients'); // Para la lista filtrada de Pacientes
  const navDoctors = document.getElementById('nav-doctors');   // Para la lista filtrada de Médicos

  const homeSection = document.getElementById('home-section');
  const createUserSection = document.getElementById('create-user-section'); // Usado para el formulario CRUD de alta
  const usersSection = document.getElementById('users-section'); // Para la lista completa y CRUD de búsqueda/actualización/eliminación
  const patientsSection = document.getElementById('patients-section'); // Para la lista filtrada de pacientes
  const doctorsSection = document.getElementById('doctors-section');   // Para la lista filtrada de médicos

  const API_BASE = 'http://localhost:7050/api';

  /**
   * Oculta todas las secciones principales y muestra solo la deseada.
   * @param {HTMLElement} sec - La sección HTML a mostrar.
   */
  function showSection(sec) {
    console.log('Script.js: Mostrando sección:', sec.id);
    [homeSection, createUserSection, usersSection, patientsSection, doctorsSection]
      .forEach(s => s.classList.add('hidden'));
    sec.classList.remove('hidden');
  }

  /**
   * Carga y renderiza la lista de personas desde el backend, con opción de filtrar por rol.
   * @param {HTMLElement} targetListContainer - El contenedor (un div o ul) donde se insertará la lista.
   * @param {string} title - El título de la lista.
   * @param {string} [filterRole] - Opcional. Nombre del rol ('Paciente', 'Medico', 'Administrador') para filtrar en el backend.
   */
  async function loadAndRenderPersonasList(targetListContainer, title, filterRole = null) {
    console.log(`Script.js: Cargando lista: "${title}", Filtro: "${filterRole || 'Ninguno'}"`);
    if (!targetListContainer) {
      console.error("Script.js ERROR: El contenedor de la lista no fue encontrado (targetListContainer es null/undefined). No se puede renderizar.");
      return; // Salir si el contenedor no existe para evitar errores
    }
    targetListContainer.innerHTML = `<p>Cargando ${title.toLowerCase()}…</p>`; // Mensaje de carga
    try {
      let url = `${API_BASE}/personas`;
      if (filterRole) {
        url += `?rol=${encodeURIComponent(filterRole)}`; // Añadir el filtro de rol a la URL
      }
      console.log('Script.js: URL de API para lista:', url);

      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text(); // Obtener más detalles del error HTTP
        throw new Error(`HTTP error! status: ${res.status}, details: ${errorText}`);
      }
      const people = await res.json();
      console.log('Script.js: Datos recibidos de la API:', people);

      let htmlContent = ``; 

      if (Array.isArray(people) && people.length > 0) {
        htmlContent += `<ul>`;
        people.forEach(item => {
          htmlContent += `<li>DNI: ${item.dni}, Nombre: ${item.nombre} ${item.apellido}, Email: ${item.email || 'N/A'}, Teléfono: ${item.telefono || 'N/A'}, Rol: ${item.nombre_rol || 'N/A'}</li>`;
        });
        htmlContent += `</ul>`;
      } else {
        htmlContent += `<p>No hay ${title.toLowerCase()} disponibles.</p>`;
      }
      
      targetListContainer.innerHTML = htmlContent; // Actualizar solo el contenedor de la lista
      console.log('Script.js: Lista renderizada en:', targetListContainer.id || targetListContainer.className);
      console.log('Script.js: Contenido HTML generado:', htmlContent); 

    } catch (err) {
      console.error(`Script.js ERROR al cargar ${title.toLowerCase()}:`, err);
      targetListContainer.innerHTML = `<p style="color: red;">Error al cargar los datos. (${err.message}).</p>`;
    }
  }

  // 
  // Configuración inicial de las secciones con contenido fijo (SE CARGAN UNA SOLA VEZ AL INICIO)
  // Esto asegura que los formularios y sus listeners permanezcan en el DOM.
  // 
  // Configuración de la sección de Alta de Personas (Formulario para crear nuevas)
  createUserSection.innerHTML = `
    <h2>Alta de Personas</h2>
    <form id="create-persona-form">
      <label for="dni">DNI:</label>
      <input type="number" id="dni" name="dni" required><br><br>

      <label for="nombre">Nombre:</label>
      <input type="text" id="nombre" name="nombre" required><br><br>

      <label for="apellido">Apellido:</label>
      <input type="text" id="apellido" name="apellido" required><br><br>

      <label for="email">Email (Opcional):</label>
      <input type="email" id="email" name="email"><br><br>

      <label for="telefono">Teléfono (Opcional):</label>
      <input type="text" id="telefono" name="telefono"><br><br>

      <label for="id_rol">ID del Rol (1: Paciente, 2: Medico, 3: Admin):</label>
      <input type="number" id="id_rol" name="id_rol" required min="1" max="3"><br><br>

      <button type="submit">Dar de Alta Persona</button>
      <p id="create-persona-message"></p>
    </form>
  `;

  // Configuración de la sección de Gestión de Personas (Lista completa y CRUD)
  usersSection.innerHTML = `
    <h2>Gestión de Personas</h2>
    <div class="data-list-container"></div> <!-- Contenedor para la lista de personas -->

    <h3>Buscar Persona por DNI:</h3>
    <input type="number" id="search-dni" placeholder="Ingrese DNI">
    <button id="btn-search-dni">Buscar</button>
    <div id="search-result"></div>

    <h3>Actualizar Persona:</h3>
    <form id="update-persona-form">
      <label for="update-dni">DNI a Actualizar:</label>
      <input type="number" id="update-dni" name="dni" required><br><br>
      <label for="update-nombre">Nuevo Nombre:</label>
      <input type="text" id="update-nombre" name="nombre" required><br><br>
      <label for="update-apellido">Nuevo Apellido:</label>
      <input type="text" id="update-apellido" name="apellido" required><br><br>
      <label for="update-email">Nuevo Email (Opcional):</label>
      <input type="email" id="update-email" name="email"><br><br>
      <label for="update-telefono">Nuevo Teléfono (Opcional):</label>
      <input type="text" id="update-telefono" name="telefono"><br><br>
      <label for="update-id_rol">Nuevo ID Rol (1: Paciente, 2: Medico, 3: Admin):</label>
      <input type="number" id="update-id_rol" name="id_rol" required min="1" max="3"><br><br>
      <button type="submit">Actualizar Persona</button>
      <p id="update-persona-message"></p>
    </form>

    <h3>Eliminar Persona:</h3>
    <input type="number" id="delete-dni" placeholder="DNI de la Persona a Eliminar">
    <button id="btn-delete-persona">Eliminar Persona</button>
    <p id="delete-persona-message"></p>
  `;

  // Configuración de la sección de Pacientes
  patientsSection.innerHTML = `
    <h2>Gestión de Pacientes</h2>
    <p>Aquí se listan las personas con rol 'Paciente'.</p>
    <div class="data-list-container"></div> <!-- Contenedor para la lista de pacientes -->
  `;

  // Configuración de la sección de Médicos
  doctorsSection.innerHTML = `
    <h2>Gestión de Médicos</h2>
    <p>Aquí se listan las personas con rol 'Médico'.</p>
    <div class="data-list-container"></div> <!-- Contenedor para la lista de médicos -->
  `;

  // 
  // Event Listeners para la navegación (SE ADJUNTAN UNA SOLA VEZ)
  // 
  // Navegación - Inicio
  navHome.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Script.js: Clic en "Inicio".');
    showSection(homeSection);
  });

  // Botón "Cargar alta de Personas" (en la sección de Inicio)
  btnLoadAlta.addEventListener('click', () => {
    console.log('Script.js: Clic en "Cargar alta de Personas".');
    showSection(createUserSection);
    // Limpiar el formulario y mensajes al mostrarlo
    const createPersonaForm = document.getElementById('create-persona-form');
    const createPersonaMessage = document.getElementById('create-persona-message');
    if(createPersonaForm) createPersonaForm.reset();
    if(createPersonaMessage) createPersonaMessage.textContent = '';
  });

  // Navegación - Lista de Personas (Muestra todas las personas)
  navUsers.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Script.js: Clic en "Personas".');
    showSection(usersSection);
    loadAndRenderPersonasList(usersSection.querySelector('.data-list-container'), 'Lista Completa de Personas');
  });

  // Navegación - Pacientes (Muestra solo las personas con rol 'Paciente')
  navPatients.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Script.js: Clic en "Pacientes".');
    showSection(patientsSection);
    loadAndRenderPersonasList(patientsSection.querySelector('.data-list-container'), 'Lista de Pacientes', 'Paciente');
  });

  // Navegación - Médicos (Muestra solo las personas con rol 'Medico')
  navDoctors.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Script.js: Clic en "Médicos".');
    showSection(doctorsSection);
    loadAndRenderPersonasList(doctorsSection.querySelector('.data-list-container'), 'Lista de Médicos', 'Medico');
  });

  // 
  // Lógica de los Formularios CRUD (SE ADJUNTAN UNA SOLA VEZ AL INICIO)
  // 
  // Lógica para el formulario de ALTA de Personas (`create-persona-form`)
  const createPersonaForm = document.getElementById('create-persona-form'); 
  const createPersonaMessage = document.getElementById('create-persona-message');

  if (createPersonaForm) {
      console.log('Script.js: Adjuntando listener a create-persona-form (Alta).');
      createPersonaForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          console.log('Script.js: Formulario de Alta enviado.');
          const newPersona = {
              dni: parseInt(createPersonaForm.dni.value, 10),
              nombre: createPersonaForm.nombre.value,
              apellido: createPersonaForm.apellido.value,
              email: createPersonaForm.email.value || null,
              telefono: createPersonaForm.telefono.value || null,
              id_rol: parseInt(createPersonaForm.id_rol.value, 10)
          };

          try {
              const res = await fetch(`${API_BASE}/personas`, { // POST para crear NUEVAS personas
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newPersona)
              });

              const data = await res.json();
              if (res.ok) {
                  createPersonaMessage.textContent = data.message;
                  //  Usar el valor RGB exacto para el color verde
                  createPersonaMessage.style.color = 'rgb(21, 87, 36)'; 
                  createPersonaForm.reset();
                  loadAndRenderPersonasList(usersSection.querySelector('.data-list-container'), 'Lista Completa de Personas');
              } else {
                  createPersonaMessage.textContent = `Error: ${data.error || 'Algo salió mal'}`;
                  createPersonaMessage.style.color = 'red';
              }
          } catch (err) {
              console.error('Script.js ERROR al dar de alta persona:', err);
              createPersonaMessage.textContent = 'Error de conexión con el servidor.';
              createPersonaMessage.style.color = 'red';
          }
      });
  } else {
    console.error('Script.js ERROR: create-persona-form no encontrado al cargar DOM.');
  }


  // Lógica para buscar persona por DNI (en usersSection)
  const searchDniInput = usersSection.querySelector('#search-dni');
  const btnSearchDni = usersSection.querySelector('#btn-search-dni');
  const searchResultDiv = usersSection.querySelector('#search-result');

  if (btnSearchDni) {
    console.log('Script.js: Adjuntando listener a btn-search-dni.');
    btnSearchDni.addEventListener('click', async () => {
      console.log('Script.js: Clic en "Buscar DNI".');
      const dni = parseInt(searchDniInput.value, 10);
      if (isNaN(dni)) {
        searchResultDiv.textContent = "Ingrese un DNI válido para buscar.";
        searchResultDiv.style.color = 'red';
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/personas?dni=${dni}`);
        const data = await res.json();
        if (res.ok) {
          if (data && data.dni) {
            searchResultDiv.innerHTML = `<p><strong>Persona Encontrada:</strong></p>
                                        <ul>
                                          <li>DNI: ${data.dni}</li>
                                          <li>Nombre: ${data.nombre} ${data.apellido}</li>
                                          <li>Email: ${data.email || 'N/A'}</li>
                                          <li>Teléfono: ${data.telefono || 'N/A'}</li>
                                          <li>Rol: ${data.nombre_rol || 'N/A'}</li>
                                        </ul>`;
            searchResultDiv.style.color = 'black';
          } else {
            searchResultDiv.textContent = "Persona no encontrada.";
            searchResultDiv.style.color = 'orange';
          }
        } else {
          // Si la respuesta no es OK (ej. 404 de backend)
          searchResultDiv.textContent = `Error al buscar: ${data.message || data.error}`;
          searchResultDiv.style.color = 'red';
        }
      } catch (err) {
        console.error('Script.js ERROR al buscar persona:', err);
        searchResultDiv.textContent = 'Error de conexión con el servidor al buscar.';
        searchResultDiv.style.color = 'red';
      }
    });
  } else {
    console.error('Script.js ERROR: btn-search-dni no encontrado al cargar DOM.');
  }

  // Lógica para actualizar persona (en usersSection)
  const updatePersonaForm = usersSection.querySelector('#update-persona-form');
  const updatePersonaMessage = usersSection.querySelector('#update-persona-message');

  if (updatePersonaForm) {
    console.log('Script.js: Adjuntando listener a update-persona-form.');
    updatePersonaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Script.js: Formulario de Actualizar enviado.');
      const dniToUpdate = parseInt(updatePersonaForm['update-dni'].value, 10);
      if (isNaN(dniToUpdate)) {
        updatePersonaMessage.textContent = "Ingrese el DNI de la persona a actualizar.";
        updatePersonaMessage.style.color = 'red';
        return;
      }

      const updatedFields = {};
      if (updatePersonaForm['update-nombre'].value) updatedFields.nombre = updatePersonaForm['update-nombre'].value;
      if (updatePersonaForm['update-apellido'].value) updatedFields.apellido = updatePersonaForm['update-apellido'].value;
      if (updatePersonaForm['update-email'].value) updatedFields.email = updatePersonaForm['update-email'].value;
      if (updatePersonaForm['update-telefono'].value) updatedFields.telefono = updatePersonaForm['update-telefono'].value;
      
      const idRolVal = parseInt(updatePersonaForm['update-id_rol'].value, 10);
      if (!isNaN(idRolVal)) {
        updatedFields.id_rol = idRolVal;
      }

      let existingPersona = {};
      // Intentar obtener datos existentes para el PUT/UPSERT
      try {
          // Usamos la misma ruta GET con filtro DNI para obtener la persona actual
          const resExisting = await fetch(`${API_BASE}/personas?dni=${dniToUpdate}`);
          if (resExisting.ok) {
              existingPersona = await resExisting.json();
              console.log('Script.js: Persona existente para actualizar:', existingPersona);
          } else if (resExisting.status === 404) {
              console.log('Script.js: Persona no encontrada para actualizar, asumiendo nueva entrada.');
              // Si no se encuentra, es una nueva persona. Asegurar que los campos requeridos estén en updatedFields
              if (!updatedFields.nombre || !updatedFields.apellido || !updatedFields.id_rol) {
                updatePersonaMessage.textContent = "Persona no encontrada. Para dar de alta, proporcione Nombre, Apellido y ID de Rol.";
                updatePersonaMessage.style.color = 'red';
                return;
              }
          }
      } catch (error) {
          console.warn("Script.js WARNING: Error al obtener datos existentes para actualizar:", error);
      }

      // Combinar datos existentes con los actualizados para el UPSERT (PUT)
      // Aseguramos que los campos NOT NULL siempre estén presentes.
      const finalDataForUpdate = {
          dni: dniToUpdate,
          nombre: updatedFields.nombre || existingPersona.nombre || '', // Debe ser string, no undefined
          apellido: updatedFields.apellido || existingPersona.apellido || '', // Debe ser string, no undefined
          email: updatedFields.email || existingPersona.email || null,
          telefono: updatedFields.telefono || existingPersona.telefono || null,
          id_rol: updatedFields.id_rol || existingPersona.id_rol // ID de rol es numérico
      };
      
      // Verificación final de campos requeridos antes de enviar
      if (!finalDataForUpdate.nombre || !finalDataForUpdate.apellido || typeof finalDataForUpdate.id_rol === 'undefined' || finalDataForUpdate.id_rol === null) {
          updatePersonaMessage.textContent = "Para actualizar o dar de alta, debe proporcionar Nombre, Apellido y ID de Rol.";
          updatePersonaMessage.style.color = 'red';
          return;
      }
      if (isNaN(finalDataForUpdate.id_rol)) {
        updatePersonaMessage.textContent = "El ID de Rol debe ser un número válido.";
        updatePersonaMessage.style.color = 'red';
        return;
      }


      try {
        const res = await fetch(`${API_BASE}/personas/${dniToUpdate}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalDataForUpdate)
        });

        const data = await res.json();
        if (res.ok) {
          updatePersonaMessage.textContent = data.message;
          updatePersonaMessage.style.color = 'rgb(21, 87, 36)'; // Verde oscuro
          updatePersonaForm.reset();
          loadAndRenderPersonasList(usersSection.querySelector('.data-list-container'), 'Lista Completa de Personas');
        } else {
          updatePersonaMessage.textContent = `Error al actualizar: ${data.message || data.error}`;
          updatePersonaMessage.style.color = 'red';
        }
      } catch (err) {
        console.error('Script.js ERROR al actualizar persona:', err);
        updatePersonaMessage.textContent = 'Error de conexión con el servidor al actualizar.';
        updatePersonaMessage.style.color = 'red';
      }
    });
  } else {
    console.error('Script.js ERROR: update-persona-form no encontrado al cargar DOM.');
  }

  // Lógica para eliminar persona (en usersSection)
  const deleteDniInput = usersSection.querySelector('#delete-dni');
  const btnDeletePersona = usersSection.querySelector('#btn-delete-persona');
  const deletePersonaMessage = document.getElementById('delete-persona-message');

  if (btnDeletePersona) {
    console.log('Script.js: Adjuntando listener a btn-delete-persona.');
    btnDeletePersona.addEventListener('click', async () => {
      console.log('Script.js: Clic en "Eliminar Persona".');
      const dniToDelete = parseInt(deleteDniInput.value, 10);
      if (isNaN(dniToDelete)) {
        deletePersonaMessage.textContent = "Ingrese el DNI de la persona a eliminar.";
        deletePersonaMessage.style.color = 'red';
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/personas/${dniToDelete}`, {
          method: 'DELETE'
        });

        const data = await res.json();
        if (res.ok) {
          deletePersonaMessage.textContent = data.message;
          deletePersonaMessage.style.color = 'rgb(21, 87, 36)'; // Verde oscuro
          deleteDniInput.value = '';
          loadAndRenderPersonasList(usersSection.querySelector('.data-list-container'), 'Lista Completa de Personas');
        } else {
          deletePersonaMessage.textContent = `Error al eliminar: ${data.message || data.error}`;
          deletePersonaMessage.style.color = 'red';
        }
      } catch (err) {
        console.error('Script.js ERROR al eliminar persona:', err);
        deletePersonaMessage.textContent = 'Error de conexión con el servidor al eliminar.';
        deletePersonaMessage.style.color = 'red';
      }
    });
  } else {
    console.error('Script.js ERROR: btn-delete-persona no encontrado al cargar DOM.');
  }

  // Inicialmente muestra la sección de inicio al cargar la página
  showSection(homeSection);
});