import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Health check endpoint
app.get("/make-server-12488a14/health", (c) => {
  return c.json({ status: "ok" });
});

// Initialize database with demo data
app.post("/make-server-12488a14/init", async (c) => {
  try {
    // Create demo users in Supabase Auth
    const users = [
      {
        email: "admin@bonalba.com",
        password: "123456",
        username: "admin",
        role: "admin",
        name: "Administrador"
      },
      {
        email: "empleado@bonalba.com",
        password: "123456",
        username: "empleado",
        role: "personal_sala",
        name: "María García"
      },
      {
        email: "cocina@bonalba.com",
        password: "123456",
        username: "cocinero",
        role: "personal_cocina",
        name: "Carlos Martínez"
      },
      {
        email: "encargado.cocina@bonalba.com",
        password: "123456",
        username: "encargado_cocina",
        role: "encargado_cocina",
        name: "Luis Fernández"
      }
    ];

    for (const user of users) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser.users.some(u => u.email === user.email);
      
      if (!userExists) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            username: user.username,
            role: user.role,
            name: user.name
          }
        });
        
        if (error) {
          console.log(`Error creating user ${user.email}:`, error);
        }
      }
    }

    // Initialize checklists
    const checklists = [
      { id: "apertura-cocina", name: "Apertura de cocina", type: "cocina", shift: "apertura" },
      { id: "apertura-sala", name: "Apertura de sala", type: "sala", shift: "apertura" },
      { id: "cierre-cocina", name: "Cierre de cocina", type: "cocina", shift: "cierre" },
      { id: "cierre-sala", name: "Cierre de sala", type: "sala", shift: "cierre" }
    ];

    await kv.set("checklists", checklists);

    // Initialize checklist tasks
    const tasks = {
      "apertura-cocina": [
        { id: "1", title: "Revisar temperatura de cámaras frigoríficas", description: "Verificar que estén entre 0-4°C", priority: "alta" },
        { id: "2", title: "Comprobar estado de aceites de freidoras", description: "Verificar color y olor", priority: "alta" },
        { id: "3", title: "Revisar fechas de caducidad de productos", description: "Retirar productos caducados", priority: "alta" },
        { id: "4", title: "Limpiar superficies de trabajo", description: "Desinfectar mesas y tablas", priority: "media" },
        { id: "5", title: "Verificar stock de ingredientes del día", description: "Comprobar disponibilidad", priority: "media" }
      ],
      "apertura-sala": [
        { id: "1", title: "Revisar limpieza de mesas y sillas", description: "Asegurar que estén limpias", priority: "alta" },
        { id: "2", title: "Preparar cubertería y cristalería", description: "Colocar en posición", priority: "media" },
        { id: "3", title: "Verificar reservas del día", description: "Revisar sistema de reservas", priority: "alta" },
        { id: "4", title: "Comprobar nivel de carta de bebidas", description: "Verificar stock de bar", priority: "media" },
        { id: "5", title: "Revisar baños", description: "Comprobar limpieza y productos", priority: "media" }
      ],
      "cierre-cocina": [
        { id: "1", title: "Registrar temperaturas finales", description: "Anotar temperaturas de cámaras", priority: "alta" },
        { id: "2", title: "Limpiar y desinfectar zona de trabajo", description: "Limpieza profunda", priority: "alta" },
        { id: "3", title: "Almacenar alimentos correctamente", description: "Film y etiquetado", priority: "alta" },
        { id: "4", title: "Apagar equipos", description: "Verificar apagado de hornos y fuegos", priority: "alta" },
        { id: "5", title: "Sacar basuras", description: "Retirar residuos", priority: "media" }
      ],
      "cierre-sala": [
        { id: "1", title: "Limpiar mesas y superficies", description: "Limpieza completa", priority: "alta" },
        { id: "2", title: "Recoger cubertería y cristalería", description: "Lavar y guardar", priority: "alta" },
        { id: "3", title: "Barrer y fregar suelos", description: "Limpieza de suelos", priority: "alta" },
        { id: "4", title: "Cerrar caja del día", description: "Arqueo de caja", priority: "alta" },
        { id: "5", title: "Revisar cierre de puertas y ventanas", description: "Seguridad", priority: "alta" }
      ]
    };

    await kv.set("checklist-tasks", tasks);

    // Initialize equipment
    const equipment = [
      { id: "camara-1", name: "Cámara frigorífica 1", type: "camara", status: "ok", lastCheck: new Date().toISOString() },
      { id: "camara-2", name: "Cámara frigorífica 2", type: "camara", status: "ok", lastCheck: new Date().toISOString() },
      { id: "camara-3", name: "Congelador", type: "camara", status: "ok", lastCheck: new Date().toISOString() },
      { id: "freidora-1", name: "Freidora 1", type: "freidora", status: "ok", lastCheck: new Date().toISOString() },
      { id: "freidora-2", name: "Freidora 2", type: "freidora", status: "ok", lastCheck: new Date().toISOString() }
    ];

    await kv.set("equipment", equipment);

    return c.json({ success: true, message: "Base de datos inicializada correctamente" });
  } catch (error) {
    console.error("Error initializing database:", error);
    return c.json({ error: "Error al inicializar la base de datos: " + error.message }, 500);
  }
});

// AUTH ROUTES
app.post("/make-server-12488a14/auth/login", async (c) => {
  try {
    const { username, password } = await c.req.json();

    // Map username to email
    const emailMap: Record<string, string> = {
      "admin": "admin@bonalba.com",
      "empleado": "empleado@bonalba.com",
      "cocinero": "cocina@bonalba.com",
      "encargado_cocina": "encargado.cocina@bonalba.com"
    };

    const email = emailMap[username] || `${username}@bonalba.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return c.json({ error: "Credenciales incorrectas" }, 401);
    }

    const user = {
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata.username,
      role: data.user.user_metadata.role,
      name: data.user.user_metadata.name
    };

    return c.json({ user, accessToken: data.session.access_token });
  } catch (error) {
    console.error("Error during login:", error);
    return c.json({ error: "Error al iniciar sesión: " + error.message }, 500);
  }
});

app.get("/make-server-12488a14/auth/me", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const user = {
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata.username,
      role: data.user.user_metadata.role,
      name: data.user.user_metadata.name
    };

    return c.json({ user });
  } catch (error) {
    console.error("Error getting user:", error);
    return c.json({ error: "Error al obtener usuario: " + error.message }, 500);
  }
});

// CHECKLIST ROUTES
app.get("/make-server-12488a14/checklists", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const checklists = await kv.get("checklists") || [];
    const dailyProgress = await kv.get("daily-progress") || {};
    const incidencias = await kv.get("incidencias") || [];

    const today = new Date().toISOString().split('T')[0];
    const todayProgress = dailyProgress[today] || {};

    const checklistsWithProgress = checklists.map((checklist: any) => {
      const progress = todayProgress[checklist.id] || { completed: 0, total: 0 };
      const checklistIncidencias = incidencias.filter((inc: any) => 
        inc.checklistId === checklist.id && inc.date.startsWith(today)
      );

      return {
        ...checklist,
        progress,
        incidencias: checklistIncidencias.length
      };
    });

    return c.json(checklistsWithProgress);
  } catch (error) {
    console.error("Error fetching checklists:", error);
    return c.json({ error: "Error al obtener checklists: " + error.message }, 500);
  }
});

app.get("/make-server-12488a14/checklists/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const checklistId = c.req.param('id');
    const allTasks = await kv.get("checklist-tasks") || {};
    const tasks = allTasks[checklistId] || [];
    
    const dailyProgress = await kv.get("daily-progress") || {};
    const today = new Date().toISOString().split('T')[0];
    const todayProgress = dailyProgress[today] || {};
    const checklistProgress = todayProgress[checklistId] || {};

    const tasksWithStatus = tasks.map((task: any) => ({
      ...task,
      status: checklistProgress.tasks?.[task.id]?.status || "pending",
      observations: checklistProgress.tasks?.[task.id]?.observations || "",
      completedBy: checklistProgress.tasks?.[task.id]?.completedBy || null,
      completedAt: checklistProgress.tasks?.[task.id]?.completedAt || null
    }));

    return c.json({ tasks: tasksWithStatus });
  } catch (error) {
    console.error("Error fetching checklist tasks:", error);
    return c.json({ error: "Error al obtener tareas: " + error.message }, 500);
  }
});

app.post("/make-server-12488a14/checklists/:id/tasks/:taskId/complete", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const checklistId = c.req.param('id');
    const taskId = c.req.param('taskId');
    const { observations } = await c.req.json();

    const dailyProgress = await kv.get("daily-progress") || {};
    const today = new Date().toISOString().split('T')[0];
    
    if (!dailyProgress[today]) {
      dailyProgress[today] = {};
    }
    if (!dailyProgress[today][checklistId]) {
      dailyProgress[today][checklistId] = { tasks: {} };
    }

    dailyProgress[today][checklistId].tasks[taskId] = {
      status: "completed",
      observations,
      completedBy: user.user_metadata.name,
      completedAt: new Date().toISOString()
    };

    // Recalcular progreso
    const allTasks = await kv.get("checklist-tasks") || {};
    const tasks = allTasks[checklistId] || [];
    const completed = Object.values(dailyProgress[today][checklistId].tasks).filter(
      (t: any) => t.status === "completed"
    ).length;

    dailyProgress[today][checklistId].completed = completed;
    dailyProgress[today][checklistId].total = tasks.length;

    await kv.set("daily-progress", dailyProgress);

    // Registrar en histórico
    const historico = await kv.get("historico") || [];
    historico.unshift({
      id: `hist-${Date.now()}`,
      type: "checklist",
      action: "Tarea completada",
      user: user.user_metadata.name,
      userId: user.id,
      checklistId,
      taskId,
      observations,
      date: new Date().toISOString()
    });
    await kv.set("historico", historico.slice(0, 500)); // Mantener últimos 500

    return c.json({ success: true });
  } catch (error) {
    console.error("Error completing task:", error);
    return c.json({ error: "Error al completar tarea: " + error.message }, 500);
  }
});

// INCIDENCIAS ROUTES
app.get("/make-server-12488a14/incidencias", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const incidencias = await kv.get("incidencias") || [];
    
    return c.json(incidencias);
  } catch (error) {
    console.error("Error fetching incidencias:", error);
    return c.json({ error: "Error al obtener incidencias: " + error.message }, 500);
  }
});

app.post("/make-server-12488a14/incidencias", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { title, description, priority, checklistId, taskId, photoData } = await c.req.json();

    const incidencias = await kv.get("incidencias") || [];
    
    const newIncidencia = {
      id: `inc-${Date.now()}`,
      title,
      description,
      priority,
      status: "abierta",
      checklistId,
      taskId,
      userId: user.id,
      userName: user.user_metadata.name,
      photoData: photoData || null,
      date: new Date().toISOString(),
      updates: []
    };

    incidencias.unshift(newIncidencia);
    await kv.set("incidencias", incidencias);

    // Registrar en histórico
    const historico = await kv.get("historico") || [];
    historico.unshift({
      id: `hist-${Date.now()}`,
      type: "incidencia",
      action: "Incidencia creada",
      user: user.user_metadata.name,
      userId: user.id,
      incidenciaId: newIncidencia.id,
      title,
      date: new Date().toISOString()
    });
    await kv.set("historico", historico.slice(0, 500));

    return c.json(newIncidencia);
  } catch (error) {
    console.error("Error creating incidencia:", error);
    return c.json({ error: "Error al crear incidencia: " + error.message }, 500);
  }
});

app.put("/make-server-12488a14/incidencias/:id/status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const incidenciaId = c.req.param('id');
    const { status, comment } = await c.req.json();

    const incidencias = await kv.get("incidencias") || [];
    const incidenciaIndex = incidencias.findIndex((inc: any) => inc.id === incidenciaId);

    if (incidenciaIndex === -1) {
      return c.json({ error: "Incidencia no encontrada" }, 404);
    }

    incidencias[incidenciaIndex].status = status;
    incidencias[incidenciaIndex].updates.push({
      date: new Date().toISOString(),
      user: user.user_metadata.name,
      action: `Estado cambiado a: ${status}`,
      comment
    });

    await kv.set("incidencias", incidencias);

    return c.json(incidencias[incidenciaIndex]);
  } catch (error) {
    console.error("Error updating incidencia:", error);
    return c.json({ error: "Error al actualizar incidencia: " + error.message }, 500);
  }
});

// APPCC ROUTES
app.get("/make-server-12488a14/appcc/registros", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const registros = await kv.get("appcc-registros") || [];
    
    return c.json(registros);
  } catch (error) {
    console.error("Error fetching APPCC registros:", error);
    return c.json({ error: "Error al obtener registros APPCC: " + error.message }, 500);
  }
});

app.post("/make-server-12488a14/appcc/temperatura", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { equipmentId, temperature, observations } = await c.req.json();

    const registros = await kv.get("appcc-registros") || [];
    
    const newRegistro = {
      id: `appcc-${Date.now()}`,
      type: "temperatura",
      equipmentId,
      temperature,
      observations,
      userId: user.id,
      userName: user.user_metadata.name,
      date: new Date().toISOString()
    };

    registros.unshift(newRegistro);
    await kv.set("appcc-registros", registros.slice(0, 1000));

    // Registrar en histórico
    const historico = await kv.get("historico") || [];
    historico.unshift({
      id: `hist-${Date.now()}`,
      type: "appcc",
      action: "Temperatura registrada",
      user: user.user_metadata.name,
      userId: user.id,
      equipmentId,
      temperature,
      date: new Date().toISOString()
    });
    await kv.set("historico", historico.slice(0, 500));

    return c.json(newRegistro);
  } catch (error) {
    console.error("Error creating temperatura registro:", error);
    return c.json({ error: "Error al registrar temperatura: " + error.message }, 500);
  }
});

app.post("/make-server-12488a14/appcc/aceite", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { equipmentId, tipo, motivo, observations } = await c.req.json();

    const registros = await kv.get("appcc-registros") || [];
    
    const newRegistro = {
      id: `appcc-${Date.now()}`,
      type: "aceite",
      equipmentId,
      tipo,
      motivo,
      observations,
      userId: user.id,
      userName: user.user_metadata.name,
      date: new Date().toISOString()
    };

    registros.unshift(newRegistro);
    await kv.set("appcc-registros", registros.slice(0, 1000));

    // Registrar en histórico
    const historico = await kv.get("historico") || [];
    historico.unshift({
      id: `hist-${Date.now()}`,
      type: "appcc",
      action: "Cambio de aceite registrado",
      user: user.user_metadata.name,
      userId: user.id,
      equipmentId,
      tipo,
      date: new Date().toISOString()
    });
    await kv.set("historico", historico.slice(0, 500));

    return c.json(newRegistro);
  } catch (error) {
    console.error("Error creating aceite registro:", error);
    return c.json({ error: "Error al registrar cambio de aceite: " + error.message }, 500);
  }
});

// EQUIPMENT ROUTES
app.get("/make-server-12488a14/equipment", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const equipment = await kv.get("equipment") || [];
    
    return c.json(equipment);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return c.json({ error: "Error al obtener equipos: " + error.message }, 500);
  }
});

app.post("/make-server-12488a14/equipment", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.user_metadata.role !== 'admin') {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { name, type } = await c.req.json();

    const equipment = await kv.get("equipment") || [];
    
    const newEquipment = {
      id: `eq-${Date.now()}`,
      name,
      type,
      status: "ok",
      lastCheck: new Date().toISOString()
    };

    equipment.push(newEquipment);
    await kv.set("equipment", equipment);

    return c.json(newEquipment);
  } catch (error) {
    console.error("Error creating equipment:", error);
    return c.json({ error: "Error al crear equipo: " + error.message }, 500);
  }
});

app.delete("/make-server-12488a14/equipment/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.user_metadata.role !== 'admin') {
      return c.json({ error: "No autorizado" }, 401);
    }

    const equipmentId = c.req.param('id');
    const equipment = await kv.get("equipment") || [];
    
    const filteredEquipment = equipment.filter((eq: any) => eq.id !== equipmentId);
    await kv.set("equipment", filteredEquipment);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return c.json({ error: "Error al eliminar equipo: " + error.message }, 500);
  }
});

// HISTORICO ROUTES
app.get("/make-server-12488a14/historico", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const historico = await kv.get("historico") || [];
    
    return c.json(historico);
  } catch (error) {
    console.error("Error fetching historico:", error);
    return c.json({ error: "Error al obtener histórico: " + error.message }, 500);
  }
});

// USERS MANAGEMENT (ADMIN ONLY)
app.get("/make-server-12488a14/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.user_metadata.role !== 'admin') {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return c.json({ error: "Error al obtener usuarios: " + error.message }, 500);
    }

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.user_metadata.username,
      role: u.user_metadata.role,
      name: u.user_metadata.name,
      created_at: u.created_at
    }));

    return c.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Error al obtener usuarios: " + error.message }, 500);
  }
});

app.post("/make-server-12488a14/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.user_metadata.role !== 'admin') {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { email, password, username, role, name } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role, name }
    });

    if (error) {
      return c.json({ error: "Error al crear usuario: " + error.message }, 400);
    }

    return c.json({
      id: data.user.id,
      email: data.user.email,
      username,
      role,
      name
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return c.json({ error: "Error al crear usuario: " + error.message }, 500);
  }
});

app.delete("/make-server-12488a14/users/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.user_metadata.role !== 'admin') {
      return c.json({ error: "No autorizado" }, 401);
    }

    const userId = c.req.param('id');

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      return c.json({ error: "Error al eliminar usuario: " + error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "Error al eliminar usuario: " + error.message }, 500);
  }
});

// EXAMS ROUTES (ADMIN ONLY)
app.get("/make-server-12488a14/exams", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const exams = await kv.get("exams") || [];
    
    return c.json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return c.json({ error: "Error al obtener exámenes: " + error.message }, 500);
  }
});

app.post("/make-server-12488a14/exams", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.user_metadata.role !== 'admin') {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { title, description, questions } = await c.req.json();

    const exams = await kv.get("exams") || [];
    
    const newExam = {
      id: `exam-${Date.now()}`,
      title,
      description,
      questions,
      createdBy: user.user_metadata.name,
      createdAt: new Date().toISOString()
    };

    exams.push(newExam);
    await kv.set("exams", exams);

    return c.json(newExam);
  } catch (error) {
    console.error("Error creating exam:", error);
    return c.json({ error: "Error al crear examen: " + error.message }, 500);
  }
});

app.post("/make-server-12488a14/exams/:id/submit", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const examId = c.req.param('id');
    const { answers } = await c.req.json();

    const results = await kv.get("exam-results") || [];
    
    const exams = await kv.get("exams") || [];
    const exam = exams.find((e: any) => e.id === examId);

    if (!exam) {
      return c.json({ error: "Examen no encontrado" }, 404);
    }

    // Calculate score
    let correct = 0;
    exam.questions.forEach((q: any, index: number) => {
      if (answers[index] === q.correctAnswer) {
        correct++;
      }
    });

    const score = (correct / exam.questions.length) * 100;

    const newResult = {
      id: `result-${Date.now()}`,
      examId,
      userId: user.id,
      userName: user.user_metadata.name,
      answers,
      score,
      correct,
      total: exam.questions.length,
      date: new Date().toISOString()
    };

    results.push(newResult);
    await kv.set("exam-results", results);

    return c.json(newResult);
  } catch (error) {
    console.error("Error submitting exam:", error);
    return c.json({ error: "Error al enviar examen: " + error.message }, 500);
  }
});

app.get("/make-server-12488a14/exams/results", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.user_metadata.role !== 'admin') {
      return c.json({ error: "No autorizado" }, 401);
    }

    const results = await kv.get("exam-results") || [];
    
    return c.json(results);
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return c.json({ error: "Error al obtener resultados: " + error.message }, 500);
  }
});

// MESSAGES ROUTES
app.get("/make-server-12488a14/messages", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const messages = await kv.get("messages") || [];
    
    // Filter messages for current user (if not admin, only show their messages)
    if (user.user_metadata.role === 'admin') {
      return c.json(messages);
    } else {
      const userMessages = messages.filter((msg: any) => 
        msg.recipientId === user.id || msg.recipientId === 'all'
      );
      return c.json(userMessages);
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    return c.json({ error: "Error al obtener mensajes: " + error.message }, 500);
  }
});

app.post("/make-server-12488a14/messages", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user || user.user_metadata.role !== 'admin') {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { recipientId, subject, message } = await c.req.json();

    const messages = await kv.get("messages") || [];
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.user_metadata.name,
      recipientId,
      subject,
      message,
      read: false,
      date: new Date().toISOString()
    };

    messages.unshift(newMessage);
    await kv.set("messages", messages);

    return c.json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    return c.json({ error: "Error al crear mensaje: " + error.message }, 500);
  }
});

app.put("/make-server-12488a14/messages/:id/read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const messageId = c.req.param('id');
    const messages = await kv.get("messages") || [];
    
    const messageIndex = messages.findIndex((msg: any) => msg.id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex].read = true;
      await kv.set("messages", messages);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return c.json({ error: "Error al marcar mensaje: " + error.message }, 500);
  }
});

Deno.serve(app.fetch);