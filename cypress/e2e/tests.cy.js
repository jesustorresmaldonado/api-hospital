describe("alta de paciente", () => {
  it("Dar de alta un paciente", () => {
    cy.visit("http://localhost:7050/");
    cy.get('button[id="load-users-btn"]').click();
    cy.get('button[id="choose-user-btn"]').click();
    cy.get('input[id="dni-input"]').type('11082375');
    cy.get('button[id="save-dni-btn"]').click();
    cy.get('button[id="btn-paciente-role"]').click();
    cy.get('input[id="password-input"]').type('holaCy!');
    cy.get('button[id="save-password-btn"]').click();
    cy.wait(1500);
    cy.get('a[id="nav-patients"]').click();
    cy.wait(3000);
  });
});

describe("alta de medico", () => {
  it("Dar de alta un medico", () => {
    cy.visit("http://localhost:7050/");
    cy.get('button[id="load-users-btn"]').click();
    cy.get('button[id="choose-user-btn"]').click();
    cy.get('input[id="dni-input"]').type('13041052');
    cy.get('button[id="save-dni-btn"]').click();
    cy.get('button[id="btn-medico-role"]').click();
    cy.get('input[id="id-especialidad-input"]').type('1');
    cy.get('input[id="dias-atencion-input"]').type('Lunes, Martes');
    cy.get('input[id="estado-input"]').type('Activo');
    cy.get('input[id="matricula-input"]').type('123123321321');
    cy.get('input[id="hora-inicio-input"]').type("08:00");
    cy.get('input[id="hora-fin-input"]').type("17:00");
    cy.get('button[id="guardar-medico-btn"]').click();
    cy.get('#nav-doctors').click();
    cy.wait(3000);
  });
});