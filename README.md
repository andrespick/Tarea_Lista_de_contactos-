# Lista de Contactos CRUD - Express + SQLite

Proyecto de lista de contactos con frontend en HTML, CSS y JavaScript vanilla, conectado a una API REST creada con Express y una base de datos SQLite.

## API

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/contacts` | Lista todos los contactos |
| POST | `/api/contacts` | Crea un contacto |
| PUT | `/api/contacts/:id` | Actualiza un contacto |
| DELETE | `/api/contacts/:id` | Elimina un contacto |

## Ejecutar

```bash
npm install
npm start
```

Luego abre:

```text
http://localhost:3000
```

La base de datos se crea automaticamente en `data/contacts.sqlite`.
