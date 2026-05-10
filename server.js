const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'contacts.sqlite');

fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lastname TEXT NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const countRow = db.prepare('SELECT COUNT(*) AS total FROM contacts').get();
if (countRow.total === 0) {
  const seedContact = db.prepare(`
    INSERT INTO contacts (name, lastname, sex, phone, city, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  [
    ['Pepito', 'Perez', 'male', '3001234567', 'Cali', 'Av. 3N #23CN-84'],
    ['Fabiola', 'Perea', 'female', '3017654321', 'Palmira', 'Cra. 27 #45-10']
  ].forEach((contact) => seedContact.run(...contact));
}

const findAllContacts = db.prepare(`
  SELECT id, name, lastname, sex, phone, city, address
  FROM contacts
  ORDER BY id DESC
`);
const findContactById = db.prepare(`
  SELECT id, name, lastname, sex, phone, city, address
  FROM contacts
  WHERE id = ?
`);
const createContact = db.prepare(`
  INSERT INTO contacts (name, lastname, sex, phone, city, address)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const updateContact = db.prepare(`
  UPDATE contacts
  SET name = ?, lastname = ?, sex = ?, phone = ?, city = ?, address = ?
  WHERE id = ?
`);
const deleteContact = db.prepare('DELETE FROM contacts WHERE id = ?');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function normalizeContact(body) {
  return {
    name: String(body.name || '').trim(),
    lastname: String(body.lastname || '').trim(),
    sex: String(body.sex || body.gender || '').trim(),
    phone: String(body.phone || '').trim(),
    city: String(body.city || '').trim(),
    address: String(body.address || '').trim()
  };
}

function validateContact(contact) {
  if (Object.values(contact).some((value) => !value)) {
    return 'Todos los campos son obligatorios';
  }

  if (!['male', 'female'].includes(contact.sex)) {
    return 'El sexo debe ser masculino o femenino';
  }

  if (!/^[0-9+\-\s()]{7,20}$/.test(contact.phone)) {
    return 'El telefono debe contener entre 7 y 20 caracteres validos';
  }

  return '';
}

app.get('/api/contacts', (req, res) => {
  res.json(findAllContacts.all());
});

app.post('/api/contacts', (req, res) => {
  const contact = normalizeContact(req.body);
  const error = validateContact(contact);

  if (error) {
    return res.status(400).json({ error });
  }

  const result = createContact.run(
    contact.name,
    contact.lastname,
    contact.sex,
    contact.phone,
    contact.city,
    contact.address
  );

  return res.status(201).json(findContactById.get(result.lastInsertRowid));
});

app.put('/api/contacts/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id de contacto invalido' });
  }

  const contact = normalizeContact(req.body);
  const error = validateContact(contact);

  if (error) {
    return res.status(400).json({ error });
  }

  const result = updateContact.run(
    contact.name,
    contact.lastname,
    contact.sex,
    contact.phone,
    contact.city,
    contact.address,
    id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Contacto no encontrado' });
  }

  return res.json(findContactById.get(id));
});

app.delete('/api/contacts/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id de contacto invalido' });
  }

  const result = deleteContact.run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Contacto no encontrado' });
  }

  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en http://localhost:${PORT}`);
});
