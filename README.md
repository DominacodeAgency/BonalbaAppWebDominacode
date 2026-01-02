# Restaurant Management App

This is a code bundle for Restaurant Management App. The original project is available at https://www.figma.com/design/VcghAUnZ8un6OW6VhyrZtS/Restaurant-Management-App.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Aquí irá un registro de las actividades que se van haciendo

Rafa

Día 1:

Cominezo con la creación de la base de datos para el registro o acceso con las credenciales del usuario
-Base de datos de prueba en Supabase
-Creación de 6 perfiles (2 admins, 2 encargados, 2 empleados)
-Copia de datos en el utils/info.tsx
-Instalación plugin Deno para manejar Supabase (prueba primaria)
-Instalación SupabaseCli para la prueba. Comandos:
-->Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
--> scoop install supabase
-Modificación de clases index.ts y kv_store.ts

Día 2:

-Creación del .env
-Actualización de dependencias
-Comprobación de que la URL que empleo apunta al endpoint correcto de Supabase.
NOTA: SI SE CAMBIA EL .ENV O SE ACTUALIZA, HAY QUE REINICIAR EL SERVIDOR
-Creación en src/lib/api.ts que permite centralizar todo el proyecto y evitar código repetitivo
-Creación de api.ts auth.ps y authServices para manejar el estado de inicio de sesion (login +token +/auth/me)

- Prueba con ÉXITO de inicio de sesión
