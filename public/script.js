let userCredentials = {};   
let selectedDni = "";      
let selectedPatientId = null;
let allDoctorLegajos = [];

document.addEventListener('DOMContentLoaded', () => {

  const btnLoadAlta    = document.getElementById('load-users-btn');
  const navHome        = document.getElementById('nav-home');
  const navUsers       = document.getElementById('nav-users');
  const navPatients    = document.getElementById('nav-patients');
  const navDoctors     = document.getElementById('nav-doctors');
  const homeSection        = document.getElementById('home-section');
  const createUserSection  = document.getElementById('create-user-section');
  const usersSection       = document.getElementById('users-section');
  const patientsSection    = document.getElementById('patients-section');
  const doctorsSection     = document.getElementById('doctors-section');

  const API_BASE = 'http://localhost:7050/api';

  function showSection(sec) {
    [homeSection, createUserSection, usersSection, patientsSection, doctorsSection]
      .forEach(s => s.classList.add('hidden'));
    sec.classList.remove('hidden');
  }

  async function loadAndRender(sec, endpoint, title, renderFn) {
    showSection(sec);
    sec.innerHTML = `<h2>${title}</h2><p>Cargando ${title.toLowerCase()}…</p>`;
    try {
      const res  = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();

      let html = `<h2>${title}</h2>`;
      if (Array.isArray(data) && data.length) {
        html += `<h3>Lista de ${title}:</h3><ul>`;
        data.forEach(item => html += renderFn(item));
        html += `</ul>`;
      } else {
        html += `<p>No hay ${title.toLowerCase()} registrados.</p>`;
      }

      sec.innerHTML = html;
    } catch (err) {
      sec.innerHTML = `<h2 style="color:red;">Error al cargar ${title.toLowerCase()}: ${err.message}</h2>`;
    }
  }

function renderUser(u){ return `<li>DNI: ${u.dni||'N/A'} – Nombre: ${u.nombre||'N/A'} – Email: ${u.email||'N/A'}</li>`; }
function renderPatient(p) {return `<li data-id="${p.id_cuenta}">ID: ${p.id_cuenta || 'N/A'} – Nombre: ${p.nombre || 'N/A'} – Email: ${p.email || 'N/A'}</li>`;}
function renderDoctor(d) {return `<li data-id="${d.legajo}">Legajo: ${d.legajo || 'N/A'} – Nombre: ${d.nombre || 'N/A'} – Apellido: ${d.apellido || 'N/A'} – Especialidad: ${d.nombre_especialidad || 'N/A'} – Tel: ${d.telefono || 'N/A'}</li>`;}


  navUsers.addEventListener('click',    e => { e.preventDefault(); loadAndRender(usersSection,    '/users',    'Usuarios',  renderUser);   });
  navPatients.addEventListener('click', e => { e.preventDefault(); loadAndRender(patientsSection, '/patients', 'Pacientes', renderPatient); });
  navDoctors.addEventListener('click',  e => { e.preventDefault(); loadAndRender(doctorsSection,  '/doctors',  'Médicos',   renderDoctor); });
  navHome.addEventListener('click',     e => { e.preventDefault(); showSection(homeSection); });

  
btnLoadAlta.addEventListener('click', async () => {
  
  await loadAndRender(
    createUserSection,
    '/users',
    'Usuarios',
    renderUser
  );

  
  const chooseBtn = document.createElement('button');
  chooseBtn.id = 'choose-user-btn';
  chooseBtn.textContent = 'Elegir usuario';
  createUserSection.appendChild(chooseBtn);

  
  chooseBtn.addEventListener('click', () => {
    
    if (!document.getElementById('dni-input-container')) {
      const container = document.createElement('div');
      container.id = 'dni-input-container';

      const label = document.createElement('label');
      label.setAttribute('for', 'dni-input');
      label.textContent = 'DNI: ';

      const dniInput = document.createElement('input');
      dniInput.type = 'text';
      dniInput.id = 'dni-input';

      const saveBtn = document.createElement('button');
      saveBtn.id = 'save-dni-btn';
      saveBtn.textContent = 'Guardar DNI';

      container.appendChild(label);
      container.appendChild(dniInput);
      container.appendChild(saveBtn);
      createUserSection.appendChild(container);

      
      saveBtn.addEventListener('click', async () => {
        selectedDni = dniInput.value.trim();
        console.log('DNI guardado:', selectedDni);

        try {
          const res = await fetch(`${API_BASE}/users`);
          if (!res.ok) throw new Error(res.status);
          const users = await res.json();

    const foundUser = users.find(user => user.dni == selectedDni);

    
    const container = document.getElementById('dni-input-container');
    
   
    const existingMsg = document.getElementById('dni-msg');
    if (existingMsg) existingMsg.remove();
    const existingRoleContainer = document.getElementById('role-btn-container');
    if (existingRoleContainer) existingRoleContainer.remove();

    if (foundUser) {
      
      const roleBtnContainer = document.createElement('div');
      roleBtnContainer.id = 'role-btn-container';
      roleBtnContainer.style.marginTop = '10px';
      roleBtnContainer.style.display = 'flex';
      roleBtnContainer.style.justifyContent = 'space-between';
      
      
      const pacienteBtn = document.createElement('button');
      pacienteBtn.id = 'btn-paciente-role';
      pacienteBtn.textContent = 'Paciente';
      
      
      
      const medicoBtn = document.createElement('button');
      medicoBtn.id = 'btn-medico-role';
      medicoBtn.textContent = 'Médico';
      
      
      roleBtnContainer.appendChild(pacienteBtn);
      roleBtnContainer.appendChild(medicoBtn);
      container.appendChild(roleBtnContainer);
      
      
     pacienteBtn.addEventListener('click', () => {
  console.log("Rol seleccionado: Paciente para usuario:", foundUser);
  
  
  if (!document.getElementById('password-input-container')) {
    const passwordContainer = document.createElement('div');
    passwordContainer.id = 'password-input-container';
    passwordContainer.style.marginTop = '10px';
  
    const passLabel = document.createElement('label');
    passLabel.setAttribute('for', 'password-input');
    passLabel.textContent = 'Contraseña: ';
  
    const passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.id = 'password-input';
  
    const savePassBtn = document.createElement('button');
    savePassBtn.id = 'save-password-btn';
    savePassBtn.textContent = 'Guardar Contraseña';
  
    passwordContainer.appendChild(passLabel);
    passwordContainer.appendChild(passInput);
    passwordContainer.appendChild(savePassBtn);
    
    const container = document.getElementById('dni-input-container');
    container.appendChild(passwordContainer);
  
    savePassBtn.addEventListener('click', () => {
  const passwordValue = passInput.value.trim();
  if (!passwordValue) {
    let errorMsg = passwordContainer.querySelector('.error-msg');
    if (!errorMsg) {
      errorMsg = document.createElement('p');
      errorMsg.className = 'error-msg';
      errorMsg.style.color = 'red';
      passwordContainer.appendChild(errorMsg);
    }
    errorMsg.textContent = 'La contraseña no puede estar vacía';
    return;
  }
  
 
  userCredentials = { dni: selectedDni || dniInput.value.trim(), password: passwordValue };
  console.log('Credenciales guardadas:', userCredentials);
  
  
  fetch(`${API_BASE}/patient-credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userCredentials)
  }).then(response => response.json()).then(data => {
      console.log('Respuesta del servidor:', data);
      let successMsg = document.createElement('p');
      successMsg.textContent = 'Paciente dado de alta';
      successMsg.style.color = 'green';
      passwordContainer.appendChild(successMsg);
    }).catch(error => {
      console.error('Error al enviar credenciales:', error);
      let errorMsg = document.createElement('p');
      errorMsg.textContent = 'Error al dar de alta el paciente';
      errorMsg.style.color = 'red';
      passwordContainer.appendChild(errorMsg);
    });
});
  }
});
      
medicoBtn.addEventListener('click', () => {
  console.log("Rol seleccionado: Médico para usuario:", foundUser);
  
  
  if (!document.getElementById('medico-input-container')) {
    const medicoContainer = document.createElement('div');
    medicoContainer.id = 'medico-input-container';
    medicoContainer.style.marginTop = '10px';
    
    
    const labelEspecialidad = document.createElement('label');
    labelEspecialidad.setAttribute('for', 'id-especialidad-input');
    labelEspecialidad.textContent = 'ID de la Especialidad: ';
    const inputEspecialidad = document.createElement('input');
    inputEspecialidad.type = 'number';
    inputEspecialidad.id = 'id-especialidad-input';
    
    
    const labelDias = document.createElement('label');
    labelDias.setAttribute('for', 'dias-atencion-input');
    labelDias.textContent = 'Días de Atención: ';
    const inputDias = document.createElement('input');
    inputDias.type = 'text';
    inputDias.id = 'dias-atencion-input';
    
    
    const labelEstado = document.createElement('label');
    labelEstado.setAttribute('for', 'estado-input');
    labelEstado.textContent = 'Estado: ';
    const inputEstado = document.createElement('input');
    inputEstado.type = 'text';
    inputEstado.id = 'estado-input';
    
    
    const labelMatricula = document.createElement('label');
    labelMatricula.setAttribute('for', 'matricula-input');
    labelMatricula.textContent = 'Matrícula: ';
    const inputMatricula = document.createElement('input');
    inputMatricula.type = 'number';
    inputMatricula.id = 'matricula-input';
    
    
    const labelHoraInicio = document.createElement('label');
    labelHoraInicio.setAttribute('for', 'hora-inicio-input');
    labelHoraInicio.textContent = 'Hora de Inicio: ';
    const inputHoraInicio = document.createElement('input');
    inputHoraInicio.type = 'time';
    inputHoraInicio.id = 'hora-inicio-input';
    
    
    const labelHoraFin = document.createElement('label');
    labelHoraFin.setAttribute('for', 'hora-fin-input');
    labelHoraFin.textContent = 'Hora de Fin: ';
    const inputHoraFin = document.createElement('input');
    inputHoraFin.type = 'time';
    inputHoraFin.id = 'hora-fin-input';
    
    
    const guardarMedicoBtn = document.createElement('button');
    guardarMedicoBtn.id = 'guardar-medico-btn';
    guardarMedicoBtn.textContent = 'Guardar Médico';
    
    
    medicoContainer.appendChild(labelEspecialidad);
    medicoContainer.appendChild(inputEspecialidad);
    medicoContainer.appendChild(document.createElement('br'));
    
    medicoContainer.appendChild(labelDias);
    medicoContainer.appendChild(inputDias);
    medicoContainer.appendChild(document.createElement('br'));
    
    medicoContainer.appendChild(labelEstado);
    medicoContainer.appendChild(inputEstado);
    medicoContainer.appendChild(document.createElement('br'));
    
    medicoContainer.appendChild(labelMatricula);
    medicoContainer.appendChild(inputMatricula);
    medicoContainer.appendChild(document.createElement('br'));
    
    medicoContainer.appendChild(labelHoraInicio);
    medicoContainer.appendChild(inputHoraInicio);
    medicoContainer.appendChild(document.createElement('br'));
    
    medicoContainer.appendChild(labelHoraFin);
    medicoContainer.appendChild(inputHoraFin);
    medicoContainer.appendChild(document.createElement('br'));
    
    medicoContainer.appendChild(guardarMedicoBtn);
    
    
    const container = document.getElementById('dni-input-container');
    container.appendChild(medicoContainer);
    
    
    guardarMedicoBtn.addEventListener('click', () => {
      
      const idEspecialidad = inputEspecialidad.value.trim();
      const diasAtencion = inputDias.value.trim();
      const estado = inputEstado.value.trim();
      const matricula = inputMatricula.value.trim();
      const horaInicio = inputHoraInicio.value.trim();
      const horaFin = inputHoraFin.value.trim();
      
      
      if (!idEspecialidad || !diasAtencion || !estado || !matricula || !horaInicio || !horaFin) {
        let errorMsg = document.createElement('p');
        errorMsg.textContent = 'Todos los campos son obligatorios.';
        errorMsg.style.color = 'red';
        medicoContainer.appendChild(errorMsg);
        return;
      }
      
      
      const medicoData = {
        dni: selectedDni || dniInput.value.trim(),
        id_especialidad: parseInt(idEspecialidad, 10),
        dias_atencion: diasAtencion,
        estado: estado,
        matricula: parseInt(matricula, 10),
        hora_inicio: horaInicio,
        hora_fin: horaFin
      };
      
      console.log("Datos del Médico:", medicoData);
      
      
      fetch(`${API_BASE}/medicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(medicoData)
      })
      .then(response => response.json())
      .then(data => {
        console.log("Respuesta del servidor (Médicos):", data);
        let successMsg = document.createElement('p');
        successMsg.textContent = 'Médico dado de alta';
        successMsg.style.color = 'green';
        medicoContainer.appendChild(successMsg);
      })
      .catch(error => {
        console.error("Error al enviar datos del médico:", error);
        let errorMsg = document.createElement('p');
        errorMsg.textContent = 'Error al dar de alta el médico';
        errorMsg.style.color = 'red';
        medicoContainer.appendChild(errorMsg);
      });
    });
  }
});
      
    } else {
     
      const msg = document.createElement('p');
      msg.id = 'dni-msg';
      msg.textContent = "Este DNI no es de un usuario del sistema";
      msg.style.color = 'red';
      container.appendChild(msg);
      console.log("Este DNI no es de un usuario del sistema");
    }
  } catch (error) {
    console.error('Error al verificar DNI:', error);
  }
});

    }
  });
});

navDoctors.addEventListener('click', async e => {
  e.preventDefault();

  
  await loadAndRender(doctorsSection, '/doctors', 'Médicos', renderDoctor);

  
  const doctorItems = doctorsSection.querySelectorAll('ul li'); 
  let allDoctorLegajos = [];
  doctorItems.forEach(item => {
    if (item.dataset.id) {
      allDoctorLegajos.push(item.dataset.id);
    }
  });
  console.log("Todos los Legajos de médicos:", allDoctorLegajos);

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.justifyContent = 'space-between';
  btnContainer.style.marginTop = '10px';

  const editBtn = document.createElement('button');
  editBtn.id = 'edit-doctor-btn';
  editBtn.textContent = 'Editar';

  editBtn.addEventListener('click', () => {
    
    if (!document.getElementById('edit-doctor-fields-container')) {
      const editContainer = document.createElement('div');
      editContainer.id = 'edit-doctor-fields-container';
      editContainer.style.marginTop = '10px';

      const legajoLabel = document.createElement('label');
      legajoLabel.setAttribute('for', 'doctor-legajo');
      legajoLabel.textContent = 'Ingrese el Legajo del médico: ';
      const legajoInput = document.createElement('input');
      legajoInput.type = 'text';
      legajoInput.id = 'doctor-legajo';

      const verifyBtn = document.createElement('button');
      verifyBtn.id = 'doctor-verify-btn';
      verifyBtn.textContent = 'Verificar';

      const verifyMessage = document.createElement('span');
      verifyMessage.id = 'doctor-verify-message';
      verifyMessage.style.marginLeft = '10px';

      const verifyContainer = document.createElement('div');
      verifyContainer.id = 'doctor-verify-container';
      verifyContainer.appendChild(legajoLabel);
      verifyContainer.appendChild(legajoInput);
      verifyContainer.appendChild(verifyBtn);
      verifyContainer.appendChild(verifyMessage);

      editContainer.appendChild(verifyContainer);
      editContainer.appendChild(document.createElement('br'));

      const telLabel = document.createElement('label');
      telLabel.setAttribute('for', 'new-doctor-tel');
      telLabel.textContent = 'Nuevo Telefono: ';
      const telInput = document.createElement('input');
      telInput.type = 'text';
      telInput.id = 'new-doctor-tel';

      const updateBtn = document.createElement('button');
      updateBtn.id = 'update-doctor-btn';
      updateBtn.textContent = 'Actualizar';

      const fieldsContainer = document.createElement('div');
      fieldsContainer.id = 'verified-doctor-fields-container';
      fieldsContainer.style.display = 'none';
      fieldsContainer.appendChild(document.createElement('br'));
      fieldsContainer.appendChild(telLabel);
      fieldsContainer.appendChild(telInput);
      fieldsContainer.appendChild(document.createElement('br'));
      fieldsContainer.appendChild(updateBtn);

      editContainer.appendChild(fieldsContainer);
      doctorsSection.appendChild(editContainer);

      verifyBtn.addEventListener('click', () => {
        const enteredLegajo = legajoInput.value.trim();
        verifyMessage.textContent = "";
        if (!enteredLegajo) {
          verifyMessage.textContent = "Ingrese un Legajo.";
          verifyMessage.style.color = "red";
          fieldsContainer.style.display = "none";
          return;
        }
        if (allDoctorLegajos.includes(enteredLegajo)) {
          verifyMessage.textContent = "Legajo verificado.";
          verifyMessage.style.color = "green";
          fieldsContainer.style.display = "block";
        } else {
          verifyMessage.textContent = "El Legajo ingresado no corresponde a ningún médico.";
          verifyMessage.style.color = "red";
          fieldsContainer.style.display = "none";
        }
      });

     
      updateBtn.addEventListener('click', async () => {
        const newTel = telInput.value.trim();
        if (!newTel) {
          verifyMessage.textContent = "Ingrese un nuevo Tel.";
          verifyMessage.style.color = "red";
          return;
        }
        const updateData = {
          legajo: legajoInput.value.trim(),
          nuevoTel: newTel
        };
        try {
          const res = await fetch(`${API_BASE}/doctors/update`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
          });
          if (!res.ok) throw new Error(`Error ${res.status}`);
          const data = await res.json();
          verifyMessage.textContent = "Médico actualizado exitosamente.";
          verifyMessage.style.color = "green";
        } catch (error) {
          console.error("Error al actualizar médico:", error);
          verifyMessage.textContent = "Error al actualizar el médico.";
          verifyMessage.style.color = "red";
        }
      });
    }
  });


  const deleteBtn = document.createElement('button');
  deleteBtn.id = 'delete-doctor-btn';
  deleteBtn.textContent = 'Eliminar';

  deleteBtn.addEventListener('click', () => {
  
    if (!document.getElementById('delete-doctor-fields-container')) {
      const deleteContainer = document.createElement('div');
      deleteContainer.id = 'delete-doctor-fields-container';
      deleteContainer.style.marginTop = '10px';

      const legajoLabel = document.createElement('label');
      legajoLabel.setAttribute('for', 'delete-doctor-legajo');
      legajoLabel.textContent = 'Ingrese el Legajo del médico a eliminar: ';
      const legajoInput = document.createElement('input');
      legajoInput.type = 'text';
      legajoInput.id = 'delete-doctor-legajo';

      const verifyDelBtn = document.createElement('button');
      verifyDelBtn.id = 'delete-doctor-verify-btn';
      verifyDelBtn.textContent = 'Verificar';

      const delMessageSpan = document.createElement('span');
      delMessageSpan.id = 'delete-doctor-verify-message';
      delMessageSpan.style.marginLeft = '10px';

      deleteContainer.appendChild(legajoLabel);
      deleteContainer.appendChild(legajoInput);
      deleteContainer.appendChild(verifyDelBtn);
      deleteContainer.appendChild(delMessageSpan);

      doctorsSection.appendChild(deleteContainer);

     
      verifyDelBtn.addEventListener('click', () => {
        const enteredLegajo = legajoInput.value.trim();
        delMessageSpan.textContent = "";
        if (!enteredLegajo) {
          delMessageSpan.textContent = "Ingrese un Legajo.";
          delMessageSpan.style.color = "red";
          return;
        }
        if (allDoctorLegajos.includes(enteredLegajo)) {
          delMessageSpan.textContent = "Legajo verificado. Eliminando...";
          delMessageSpan.style.color = "green";
          const legajoToDelete = parseInt(enteredLegajo, 10);
          
          fetch(`${API_BASE}/doctors/${legajoToDelete}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json"
            }
          })
            .then(res => {
              if (!res.ok) {
                delMessageSpan.textContent = "Error al eliminar el médico.";
                delMessageSpan.style.color = "red";
              } else {
                delMessageSpan.textContent = "Médico eliminado exitosamente.";
                delMessageSpan.style.color = "green";
           
              }
            })
            .catch(err => {
              console.error("Error al eliminar:", err);
              delMessageSpan.textContent = "Error al eliminar el médico.";
              delMessageSpan.style.color = "red";
            });
        } else {
          delMessageSpan.textContent = "El Legajo ingresado no corresponde a ningún médico.";
          delMessageSpan.style.color = "red";
        }
      });
    }
  });

  btnContainer.appendChild(editBtn);
  btnContainer.appendChild(deleteBtn);

  doctorsSection.appendChild(btnContainer);
});


navPatients.addEventListener('click', async e => {
  e.preventDefault();

 
  await loadAndRender(patientsSection, '/patients', 'Pacientes', renderPatient);

  
  const patientItems = patientsSection.querySelectorAll('ul li');
  let allPatientIds = [];
  patientItems.forEach(item => {
    if (item.dataset.id) {
      allPatientIds.push(item.dataset.id);
    }
  });
  console.log("Todos los IDs de pacientes:", allPatientIds);

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.justifyContent = 'space-between';
  btnContainer.style.marginTop = '10px';

  const editBtn = document.createElement('button');
  editBtn.id = 'edit-patient-btn';
  editBtn.textContent = 'Editar';

  editBtn.addEventListener('click', () => {
    if (!document.getElementById('edit-fields-container')) {
      const editContainer = document.createElement('div');
      editContainer.id = 'edit-fields-container';
      editContainer.style.marginTop = '10px';

      
      const idLabel = document.createElement('label');
      idLabel.setAttribute('for', 'patient-id');
      idLabel.textContent = 'Ingrese el ID del paciente: ';
      const idInput = document.createElement('input');
      idInput.type = 'text';
      idInput.id = 'patient-id';
      
      const verifyBtn = document.createElement('button');
      verifyBtn.id = 'verify-btn';
      verifyBtn.textContent = 'Verificar';

      const verifyMessage = document.createElement('span');
      verifyMessage.id = 'verify-message';
      verifyMessage.style.marginLeft = '10px';

      
      const verifyContainer = document.createElement('div');
      verifyContainer.id = 'verify-container';
      verifyContainer.appendChild(idLabel);
      verifyContainer.appendChild(idInput);
      verifyContainer.appendChild(verifyBtn);
      verifyContainer.appendChild(verifyMessage); 

      editContainer.appendChild(verifyContainer);
      editContainer.appendChild(document.createElement('br'));

      
      const fieldsContainer = document.createElement('div');
      fieldsContainer.id = 'verified-fields-container';
      fieldsContainer.style.display = 'none'; 

      const nameLabel = document.createElement('label');
      nameLabel.setAttribute('for', 'new-name');
      nameLabel.textContent = 'Nuevo Nombre: ';
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.id = 'new-name';

      const emailLabel = document.createElement('label');
      emailLabel.setAttribute('for', 'new-email');
      emailLabel.textContent = 'Nuevo Email: ';
      const emailInput = document.createElement('input');
      emailInput.type = 'email';
      emailInput.id = 'new-email';

      const updateBtn = document.createElement('button');
      updateBtn.id = 'update-patient-btn';
      updateBtn.textContent = 'Actualizar';

      
      fieldsContainer.appendChild(document.createElement('br'));
      fieldsContainer.appendChild(nameLabel);
      fieldsContainer.appendChild(nameInput);
      fieldsContainer.appendChild(document.createElement('br'));
      fieldsContainer.appendChild(emailLabel);
      fieldsContainer.appendChild(emailInput);
      fieldsContainer.appendChild(document.createElement('br'));
      fieldsContainer.appendChild(updateBtn);

      editContainer.appendChild(fieldsContainer);

      patientsSection.appendChild(editContainer);

      

      verifyBtn.addEventListener('click', () => {
        const enteredId = idInput.value.trim();
        verifyMessage.textContent = "";
        if (!enteredId) {
          verifyMessage.textContent = "Ingrese un ID.";
          verifyMessage.style.color = "red";
          fieldsContainer.style.display = "none";
          return;
        }
        if (allPatientIds.includes(enteredId)) {
          verifyMessage.textContent = "ID verificado.";
          verifyMessage.style.color = "green";
          fieldsContainer.style.display = "block";
        } else {
          verifyMessage.textContent = "El ID ingresado no corresponde a ningún paciente.";
          verifyMessage.style.color = "red";
          fieldsContainer.style.display = "none";
        }
      });

      updateBtn.addEventListener('click', async () => {
        const newName = nameInput.value.trim();
        const newEmail = emailInput.value.trim();
        if (!newName || !newEmail) {
          verifyMessage.textContent = "Complete ambos campos.";
          verifyMessage.style.color = "red";
          return;
        }
        
        const updateData = {
          id: idInput.value.trim(),
          nuevoNombre: newName,
          nuevoEmail: newEmail
        };
        console.log("Datos a actualizar:", updateData);
        try {
          const res = await fetch(`${API_BASE}/patients/update`, {
            method: 'PUT', 
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
          });
          if (!res.ok) throw new Error(`Error ${res.status}`);
          const data = await res.json();
          console.log("Paciente actualizado:", data);
          verifyMessage.textContent = "Paciente actualizado correctamente.";
          verifyMessage.style.color = "green";
        } catch (error) {
          console.error("Error al actualizar el paciente:", error);
          verifyMessage.textContent = "Error al actualizar el paciente.";
          verifyMessage.style.color = "red";
        }
      });
    }
  });

  
const deleteBtn = document.createElement('button');
deleteBtn.id = 'delete-patient-btn';
deleteBtn.textContent = 'Eliminar';


deleteBtn.addEventListener('click', () => {
 
  if (!document.getElementById('delete-fields-container')) {
    const deleteContainer = document.createElement('div');
    deleteContainer.id = 'delete-fields-container';
    deleteContainer.style.marginTop = '10px';

  
    const idLabel = document.createElement('label');
    idLabel.setAttribute('for', 'delete-patient-id');
    idLabel.textContent = 'Ingrese el ID del paciente a eliminar: ';
    const idInput = document.createElement('input');
    idInput.type = 'text';
    idInput.id = 'delete-patient-id';

    
    const verifyBtn = document.createElement('button');
    verifyBtn.id = 'delete-verify-btn';
    verifyBtn.textContent = 'Verificar';

    
    const messageSpan = document.createElement('span');
    messageSpan.id = 'delete-verify-message';
    messageSpan.style.marginLeft = '10px';

    deleteContainer.appendChild(idLabel);
    deleteContainer.appendChild(idInput);
    deleteContainer.appendChild(verifyBtn);
    deleteContainer.appendChild(messageSpan);

   
    patientsSection.appendChild(deleteContainer);

    
    verifyBtn.addEventListener('click', () => {
      const enteredId = idInput.value.trim();
      messageSpan.textContent = "";

      if (!enteredId) {
        messageSpan.textContent = "Ingrese un ID.";
        messageSpan.style.color = "red";
        return;
      }

      if (allPatientIds.includes(enteredId)) {
        messageSpan.textContent = "ID verificado. Eliminando...";
        messageSpan.style.color = "green";

        
        const idToDelete = parseInt(enteredId, 10);

        
        fetch(`${API_BASE}/patients/${idToDelete}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          }
        })
          .then(res => {
            if (!res.ok) {
              messageSpan.textContent = "Error al eliminar el paciente.";
              messageSpan.style.color = "red";
            } else {
              messageSpan.textContent = "Paciente eliminado exitosamente.";
              messageSpan.style.color = "green";
              
            }
          })
          .catch(err => {
            console.error("Error al eliminar:", err);
            messageSpan.textContent = "Error al eliminar el paciente.";
            messageSpan.style.color = "red";
          });
      } else {
        messageSpan.textContent = "El ID ingresado no corresponde a ningún paciente.";
        messageSpan.style.color = "red";
      }
    });
  }
});


btnContainer.appendChild(editBtn);
btnContainer.appendChild(deleteBtn);


patientsSection.appendChild(btnContainer);
});




  showSection(homeSection);
});