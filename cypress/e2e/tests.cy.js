// cypress/e2e/tests.cy.js
// Este archivo contiene las pruebas de End-to-End para la aplicación de Gestión de Personas.

// <reference types="cypress" />

// Describe un conjunto de pruebas para la gestión de personas
describe('Gestión de Personas - Funcionalidades CRUD y Filtrado', () => {
  const BASE_URL = 'http://localhost:7050'; // La URL de tu aplicación
  const TEST_DNI = 99999999; // DNI para la persona de prueba (para alta/baja/modificación general)
  const TEST_NAME = 'Cypress';
  const TEST_LASTNAME = 'Tester';
  const UPDATED_NAME = 'Cypress Modificado';

  // Antes de cada prueba, visita la URL base de la aplicación
  beforeEach(() => {
    cy.visit(BASE_URL, { timeout: 20000 }); // Espera hasta 20 segundos para cargar la página
  });

  // Limpia los datos de prueba después de que todas las pruebas en este bloque hayan terminado.
  // Esto es importante para asegurar que las pruebas sean idempotentes (puedan ejecutarse múltiples veces sin problemas).
  after(() => {
    cy.log('Corriendo limpieza final de datos de prueba...');
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/${TEST_DNI}`, failOnStatusCode: false });
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000001`, failOnStatusCode: false });
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000002`, failOnStatusCode: false });
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000003`, failOnStatusCode: false });
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000004`, failOnStatusCode: false });
    cy.log('Limpieza final de datos de prueba completada.');
  });

  // Prueba: Navegación y verificación de secciones
  it('Debe navegar a las diferentes secciones y cargar las listas correctamente', () => {
    cy.get('#home-section').should('be.visible', { timeout: 15000 });
    cy.get('#home-section h2').should('contain', 'Bienvenido al Sistema Simplificado').and('be.visible', { timeout: 15000 });

    cy.get('#nav-users').click();
    cy.get('#users-section').should('be.visible');
    cy.contains('#users-section h2', 'Gestión de Personas').should('be.visible');
    
    cy.get('#users-section .data-list-container ul', { timeout: 10000 }).should('exist');
    cy.get('#users-section .data-list-container ul li').its('length').should('be.gte', 0);

    cy.get('#users-section .data-list-container').then($list => {
      if ($list.find('ul li').length) {
        cy.get('#users-section .data-list-container ul li').should('have.length.at.least', 1);
      } else {
        cy.get('#users-section .data-list-container p').should('contain', 'No hay lista completa de personas disponibles.');
      }
    });
  });

  // Prueba: Crear una nueva persona
  it('Debe permitir dar de alta una nueva persona', () => {
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/${TEST_DNI}`, failOnStatusCode: false });
    
    cy.get('#load-users-btn').click();
    cy.get('#create-user-section').should('be.visible');
    cy.contains('h2', 'Alta de Personas').should('be.visible');

    cy.get('#dni').type(TEST_DNI);
    cy.get('#nombre').type(TEST_NAME);
    cy.get('#apellido').type(TEST_LASTNAME);
    cy.get('#email').type('cypress.test@example.com');
    cy.get('#telefono').type('123456789');
    cy.get('#id_rol').type('1');

    cy.get('#create-persona-form button[type="submit"]').click();

    cy.get('#create-persona-message').should('contain', 'Persona creada exitosamente.').and('have.css', 'color', 'rgb(21, 87, 36)');
    
    cy.get('#nav-users').click();
    cy.get('#users-section').should('be.visible');
    cy.get('#users-section .data-list-container ul', { timeout: 10000 }).should('exist').and('contain', `DNI: ${TEST_DNI}, Nombre: ${TEST_NAME} ${TEST_LASTNAME}`);
  });

  // Prueba: Actualizar una persona existente
  it('Debe permitir actualizar una persona existente', () => {
    //  Asegurarse de que la persona de prueba exista con TODOS los campos iniciales requeridos usando PUT.
    // Esto actúa como un "upsert": si ya existe, la actualiza; si no, la crea.
    cy.request('PUT', `${BASE_URL}/api/personas/${TEST_DNI}`, {
      dni: TEST_DNI,
      nombre: TEST_NAME,
      apellido: TEST_LASTNAME,
      email: 'cypress.test.original@example.com', // Email original
      telefono: '1122334455', // Telefono original
      id_rol: 1 // Rol original
    }).then(response => {
      // Puedes verificar el status code aquí si necesitas debuggear, pero failOnStatusCode: false lo ignora.
      // cy.log(`Status de la creación/actualización de persona para el test: ${response.status}`);
    });

    cy.get('#nav-users').click();
    cy.get('#users-section').should('be.visible');

    // Rellenar el formulario de actualización con DNI, el nuevo nombre, y los demás campos obligatorios con los valores originales (o vacíos si no cambiaron)
    cy.get('#update-dni').type(TEST_DNI);
    cy.get('#update-nombre').type(UPDATED_NAME); // Cambia solo el nombre
    cy.get('#update-apellido').type(TEST_LASTNAME); // Mantiene el apellido
    cy.get('#update-email').type('cypress.test.update@example.com'); // Un nuevo email para ver el cambio
    cy.get('#update-telefono').type('5544332211'); // Un nuevo teléfono
    cy.get('#update-id_rol').type('2'); // Cambia el rol a Médico (ID 2)

    cy.get('#update-persona-form button[type="submit"]').click();

    //  Añadir una pequeña espera para la visualización del mensaje
    cy.wait(100); 
    cy.get('#update-persona-message').should('contain', 'Persona dada de alta/actualizada exitosamente.').and('have.css', 'color', 'rgb(21, 87, 36)');
    
    cy.get('#nav-users').click();
    cy.get('#users-section').should('be.visible');
    cy.get('#users-section .data-list-container ul', { timeout: 10000 }).should('exist').and('contain', `DNI: ${TEST_DNI}`).and('contain', `Nombre: ${UPDATED_NAME} ${TEST_LASTNAME}`).and('contain', 'Rol: Medico'); // Verifica también el rol actualizado
  });

  // Prueba: Eliminar una persona
  it('Debe permitir eliminar una persona', () => {
    cy.request('PUT', `${BASE_URL}/api/personas/${TEST_DNI}`, {
      dni: TEST_DNI,
      nombre: TEST_NAME,
      apellido: TEST_LASTNAME,
      id_rol: 1
    });

    cy.get('#nav-users').click();
    cy.get('#users-section').should('be.visible');

    cy.get('#delete-dni').type(TEST_DNI);
    cy.get('#btn-delete-persona').click();

    cy.wait(100); 
    
    cy.get('#delete-persona-message').should('contain', 'Persona eliminada exitosamente.').and('have.css', 'color', 'rgb(21, 87, 36)');
    
    cy.get('#nav-users').click();
    cy.get('#users-section').should('be.visible');
    cy.get('#users-section .data-list-container ul', { timeout: 10000 }).should('exist'); 
    cy.get('#users-section .data-list-container').should('not.contain', `DNI: ${TEST_DNI}`); 
  });

  // Prueba: Buscar una persona por DNI
  it('Debe permitir buscar una persona por DNI', () => {
    cy.request('PUT', `${BASE_URL}/api/personas/${TEST_DNI}`, {
      dni: TEST_DNI,
      nombre: TEST_NAME,
      apellido: TEST_LASTNAME,
      id_rol: 1
    });

    cy.get('#nav-users').click();
    cy.get('#users-section').should('be.visible');

    cy.get('#search-dni').type(TEST_DNI);
    cy.get('#btn-search-dni').click();

    cy.get('#search-result').should('contain', `DNI: ${TEST_DNI}`);
    cy.get('#search-result').should('contain', `Nombre: ${TEST_NAME} ${TEST_LASTNAME}`);
    cy.get('#search-result').should('contain', 'Rol: Paciente');
  });

  // Prueba: Verificar la lista de Pacientes
  it('Debe mostrar solo las personas con rol "Paciente" en la sección Pacientes', () => {
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000001`, failOnStatusCode: false });
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000002`, failOnStatusCode: false });

    cy.request('POST', `${BASE_URL}/api/personas`, { dni: 10000001, nombre: 'PacienteTest', apellido: 'P', id_rol: 1, email: 'paciente@test.com', telefono: '111111111' });
    cy.request('POST', `${BASE_URL}/api/personas`, { dni: 10000002, nombre: 'MedicoTest', apellido: 'M', id_rol: 2, email: 'medico@test.com', telefono: '222222222' });

    cy.get('#nav-patients').click();
    cy.get('#patients-section').should('be.visible');
    
    cy.get('#patients-section .data-list-container ul', { timeout: 10000 })
      .should('exist')
      .and('contain', `DNI: 10000001`);

    cy.get('#patients-section .data-list-container ul li').each($li => {
      cy.wrap($li).should('contain', 'Rol: Paciente');
      cy.wrap($li).should('not.contain', 'Rol: Medico');
      cy.wrap($li).should('not.contain', 'Rol: Administrador');
    });

    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000001`, failOnStatusCode: false });
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000002`, failOnStatusCode: false });
  });

  // Prueba: Verificar la lista de Médicos
  it('Debe mostrar solo las personas con rol "Médico" en la sección Médicos', () => {
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000003`, failOnStatusCode: false });
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000004`, failOnStatusCode: false });

    cy.request('POST', `${BASE_URL}/api/personas`, { dni: 10000003, nombre: 'MedicoTest2', apellido: 'M2', id_rol: 2, email: 'medico2@test.com', telefono: '333333333' });
    cy.request('POST', `${BASE_URL}/api/personas`, { dni: 10000004, nombre: 'PacienteTest2', apellido: 'P2', id_rol: 1, email: 'paciente2@test.com', telefono: '444444444' });

    cy.get('#nav-doctors').click();
    cy.get('#doctors-section').should('be.visible');

    cy.get('#doctors-section .data-list-container ul', { timeout: 10000 })
      .should('exist')
      .and('contain', `DNI: 10000003`);

    cy.get('#doctors-section .data-list-container ul li').each($li => {
      cy.wrap($li).should('contain', 'Rol: Medico');
      cy.wrap($li).should('not.contain', 'Rol: Paciente');
      cy.wrap($li).should('not.contain', 'Rol: Administrador');
    });

    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000003`, failOnStatusCode: false });
    cy.request({ method: 'DELETE', url: `${BASE_URL}/api/personas/10000004`, failOnStatusCode: false });
  });
});