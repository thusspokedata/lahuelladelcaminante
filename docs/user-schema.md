# Esquema de Usuarios

## Modelos

### User

Representa a un usuario registrado en la plataforma.

| Campo     | Tipo       | Descripción                                   |
| --------- | ---------- | --------------------------------------------- |
| id        | String     | Identificador único (CUID)                    |
| clerkId   | String     | ID del usuario en Clerk (autenticación)       |
| email     | String     | Correo electrónico (único)                    |
| name      | String?    | Nombre del usuario (opcional)                 |
| role      | UserRole   | Rol del usuario (USER, ARTIST, ADMIN)         |
| status    | UserStatus | Estado del usuario (PENDING, ACTIVE, BLOCKED) |
| createdAt | DateTime   | Fecha de creación                             |
| updatedAt | DateTime   | Fecha de última actualización                 |

### Relaciones

- **User → Event**: Un usuario puede crear múltiples eventos (`createdEvents`)
- **User → Artist**: Un usuario puede tener un perfil de artista (`artistProfile`)

## Enumeraciones

### UserRole

Define los roles disponibles para los usuarios:

- **USER**: Usuario regular que puede navegar por eventos y artistas.
- **ARTIST**: Usuario que tiene un perfil de artista asociado y puede crear/gestionar eventos.
- **ADMIN**: Usuario con permisos administrativos completos.

### UserStatus

Define los estados posibles de una cuenta de usuario:

- **PENDING**: Cuenta creada pero pendiente de aprobación.
- **ACTIVE**: Cuenta activa y funcional.
- **BLOCKED**: Cuenta bloqueada por motivos administrativos.

## Cambios en Modelos Existentes

### Event

Se añadió la relación con el usuario creador:

| Campo nuevo | Tipo    | Descripción                       |
| ----------- | ------- | --------------------------------- |
| createdById | String? | ID del usuario que creó el evento |
| createdBy   | User?   | Relación con el usuario creador   |

### Artist

Se añadió la relación con el usuario:

| Campo nuevo | Tipo    | Descripción                                  |
| ----------- | ------- | -------------------------------------------- |
| userId      | String? | ID del usuario asociado al perfil de artista |
| user        | User?   | Relación con el usuario                      |

## Flujo de Autenticación y Autorización

1. Un usuario se registra a través de Clerk.
2. Se crea automáticamente un registro en nuestro modelo `User` con el `clerkId`.
3. Por defecto, el usuario tiene rol `USER` y estado `PENDING`.
4. Un administrador puede cambiar el rol a `ARTIST` y asociarlo a un perfil de artista.
5. El estado cambia a `ACTIVE` cuando se aprueba la cuenta.

## Consideraciones de Seguridad

- Los IDs de Clerk se almacenan para vincular nuestra base de datos con la autenticación externa.
- Las contraseñas no se almacenan en nuestra base de datos (gestionadas por Clerk).
- El campo `status` permite implementar un sistema de moderación de usuarios.
- Las relaciones definidas permiten control de acceso basado en roles.
