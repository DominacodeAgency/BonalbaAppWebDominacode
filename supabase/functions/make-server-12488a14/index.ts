import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";

type Role = "admin" | "encargado" | "empleado";
type Area = "cocina" | "sala" | null;

type Profile = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: Role;
  area: Area;
  active: boolean;
};

const app = new Hono();

// =======================
// DEBUG / HELPERS
// =======================
const DEBUG = true; // ponlo a false en prod si no quieres tanto detalle
const FUNCTION_NAME = "make-server-12488a14";

function reqId() {
  return crypto.randomUUID();
}

function jsonError(
  c: any,
  status: number,
  message: string,
  extra?: Record<string, unknown>
) {
  const id = c.get("requestId");
  return c.json(
    {
      ok: false,
      error: message,
      requestId: id,
      method: c.req.method,
      path: c.req.path,
      ...(extra ?? {}),
    },
    status
  );
}

const getBearer = (authHeader?: string | null) =>
  authHeader?.split(" ")[1] || null;

// =======================
// MIDDLEWARES
// =======================
app.use("*", async (c, next) => {
  if (DEBUG) {
    console.log("➡️ INCOMING", {
      method: c.req.method,
      path: c.req.path,
      url: c.req.url,
    });
  }
  await next();
});

// Logger + CORS
app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 600,
  })
);

// Preflight explícito
app.options("*", (c) => c.text("", 204));

// =======================
// SUPABASE CLIENT (Service Role)
// =======================
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// =======================
// AUTH HELPERS
// =======================
async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,username,full_name,role,area,active")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Profile) ?? null;
}

async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,username,full_name,role,area,active")
    .eq("username", username)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Profile) ?? null;
}

async function requireAuth(c: any) {
  const token = getBearer(c.req.header("Authorization"));
  if (!token) return { error: jsonError(c, 401, "No autorizado (sin token)") };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: jsonError(c, 401, "No autorizado (token inválido)") };
  }

  const profile = await getProfileById(data.user.id);
  if (!profile || !profile.active) {
    return { error: jsonError(c, 401, "No autorizado (perfil inactivo)") };
  }

  return { token, user: data.user, profile };
}

function isAdmin(profile: Profile) {
  return profile.role === "admin" && profile.active;
}

// =======================
// GLOBAL ERROR HANDLING
// =======================

// Si una ruta NO existe -> JSON claro
app.notFound((c) =>
  jsonError(c, 404, "Ruta no encontrada", {
    hint: "Revisa el path/método. Si esperabas esta ruta, asegúrate de haber hecho deploy de la función.",
  })
);

// Si algo revienta -> JSON claro + stack (solo en DEBUG)
app.onError((err, c) => {
  console.error("❌ Unhandled error", {
    requestId: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    message: err?.message,
    stack: err?.stack,
  });

  return jsonError(c, 500, "Error interno del servidor", {
    details: DEBUG ? err?.message : undefined,
  });
});

// =======================
// ROUTES
// =======================

// Health
app.get("/health", (c) => c.json({ ok: true, status: "ok" }));

// Init (seed KV; NO crea users por defecto)
app.post("/init", async (c) => {
  const checklists = [
    {
      id: "apertura-cocina",
      name: "Apertura de cocina",
      type: "cocina",
      shift: "apertura",
    },
    {
      id: "apertura-sala",
      name: "Apertura de sala",
      type: "sala",
      shift: "apertura",
    },
    {
      id: "cierre-cocina",
      name: "Cierre de cocina",
      type: "cocina",
      shift: "cierre",
    },
    {
      id: "cierre-sala",
      name: "Cierre de sala",
      type: "sala",
      shift: "cierre",
    },
  ];
  await kv.set("checklists", checklists);

  const tasks = {
    "apertura-cocina": [
      {
        id: "1",
        title: "Revisar temperatura de cámaras frigoríficas",
        description: "Verificar que estén entre 0-4°C",
        priority: "alta",
      },
      {
        id: "2",
        title: "Comprobar estado de aceites de freidoras",
        description: "Verificar color y olor",
        priority: "alta",
      },
      {
        id: "3",
        title: "Revisar fechas de caducidad de productos",
        description: "Retirar productos caducados",
        priority: "alta",
      },
      {
        id: "4",
        title: "Limpiar superficies de trabajo",
        description: "Desinfectar mesas y tablas",
        priority: "media",
      },
      {
        id: "5",
        title: "Verificar stock de ingredientes del día",
        description: "Comprobar disponibilidad",
        priority: "media",
      },
    ],
    "apertura-sala": [
      {
        id: "1",
        title: "Revisar limpieza de mesas y sillas",
        description: "Asegurar que estén limpias",
        priority: "alta",
      },
      {
        id: "2",
        title: "Preparar cubertería y cristalería",
        description: "Colocar en posición",
        priority: "media",
      },
      {
        id: "3",
        title: "Verificar reservas del día",
        description: "Revisar sistema de reservas",
        priority: "alta",
      },
      {
        id: "4",
        title: "Comprobar nivel de carta de bebidas",
        description: "Verificar stock de bar",
        priority: "media",
      },
      {
        id: "5",
        title: "Revisar baños",
        description: "Comprobar limpieza y productos",
        priority: "media",
      },
    ],
    "cierre-cocina": [
      {
        id: "1",
        title: "Registrar temperaturas finales",
        description: "Anotar temperaturas de cámaras",
        priority: "alta",
      },
      {
        id: "2",
        title: "Limpiar y desinfectar zona de trabajo",
        description: "Limpieza profunda",
        priority: "alta",
      },
      {
        id: "3",
        title: "Almacenar alimentos correctamente",
        description: "Film y etiquetado",
        priority: "alta",
      },
      {
        id: "4",
        title: "Apagar equipos",
        description: "Verificar apagado de hornos y fuegos",
        priority: "alta",
      },
      {
        id: "5",
        title: "Sacar basuras",
        description: "Retirar residuos",
        priority: "media",
      },
    ],
    "cierre-sala": [
      {
        id: "1",
        title: "Limpiar mesas y superficies",
        description: "Limpieza completa",
        priority: "alta",
      },
      {
        id: "2",
        title: "Recoger cubertería y cristalería",
        description: "Lavar y guardar",
        priority: "alta",
      },
      {
        id: "3",
        title: "Barrer y fregar suelos",
        description: "Limpieza de suelos",
        priority: "alta",
      },
      {
        id: "4",
        title: "Cerrar caja del día",
        description: "Arqueo de caja",
        priority: "alta",
      },
      {
        id: "5",
        title: "Revisar cierre de puertas y ventanas",
        description: "Seguridad",
        priority: "alta",
      },
    ],
  };
  await kv.set("checklist-tasks", tasks);

  const equipment = [
    {
      id: "camara-1",
      name: "Cámara frigorífica 1",
      type: "camara",
      status: "ok",
      lastCheck: new Date().toISOString(),
    },
    {
      id: "camara-2",
      name: "Cámara frigorífica 2",
      type: "camara",
      status: "ok",
      lastCheck: new Date().toISOString(),
    },
    {
      id: "camara-3",
      name: "Congelador",
      type: "camara",
      status: "ok",
      lastCheck: new Date().toISOString(),
    },
    {
      id: "freidora-1",
      name: "Freidora 1",
      type: "freidora",
      status: "ok",
      lastCheck: new Date().toISOString(),
    },
    {
      id: "freidora-2",
      name: "Freidora 2",
      type: "freidora",
      status: "ok",
      lastCheck: new Date().toISOString(),
    },
  ];
  await kv.set("equipment", equipment);

  return c.json({ ok: true, message: "KV inicializado correctamente" });
});

// AUTH
app.post("/auth/login", async (c) => {
  const { username, password } = await c.req.json();

  const prof = await getProfileByUsername(username);
  if (!prof || !prof.active)
    return jsonError(c, 401, "Credenciales incorrectas");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: prof.email,
    password,
  });

  if (error) return jsonError(c, 401, "Credenciales incorrectas");

  return c.json({
    ok: true,
    user: {
      id: prof.id,
      email: prof.email,
      username: prof.username,
      role: prof.role,
      area: prof.area,
      name: prof.full_name,
    },
    accessToken: data.session.access_token,
  });
});

app.get("/auth/me", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  return c.json({
    ok: true,
    user: {
      id: prof.id,
      email: prof.email,
      username: prof.username,
      role: prof.role,
      area: prof.area,
      name: prof.full_name,
    },
  });
});

// CHECKLISTS
app.get("/checklists", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const checklists = (await kv.get("checklists")) || [];
  const dailyProgress = (await kv.get("daily-progress")) || {};
  const incidencias = (await kv.get("incidencias")) || [];

  const today = new Date().toISOString().split("T")[0];
  const todayProgress = dailyProgress[today] || {};

  const checklistsWithProgress = checklists.map((checklist: any) => {
    const progress = todayProgress[checklist.id] || { completed: 0, total: 0 };
    const checklistIncidencias = incidencias.filter(
      (inc: any) =>
        inc.checklistId === checklist.id && inc.date.startsWith(today)
    );

    return {
      ...checklist,
      progress,
      incidencias: checklistIncidencias.length,
    };
  });

  return c.json({ ok: true, data: checklistsWithProgress });
});

app.get("/checklists/:id", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const checklistId = c.req.param("id");
  const allTasks = (await kv.get("checklist-tasks")) || {};
  const tasks = allTasks[checklistId] || [];

  const dailyProgress = (await kv.get("daily-progress")) || {};
  const today = new Date().toISOString().split("T")[0];
  const todayProgress = dailyProgress[today] || {};
  const checklistProgress = todayProgress[checklistId] || {};

  const tasksWithStatus = tasks.map((task: any) => ({
    ...task,
    status: checklistProgress.tasks?.[task.id]?.status || "pending",
    observations: checklistProgress.tasks?.[task.id]?.observations || "",
    completedBy: checklistProgress.tasks?.[task.id]?.completedBy || null,
    completedAt: checklistProgress.tasks?.[task.id]?.completedAt || null,
  }));

  return c.json({ ok: true, data: { tasks: tasksWithStatus } });
});

app.post("/checklists/:id/tasks/:taskId/complete", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  const checklistId = c.req.param("id");
  const taskId = c.req.param("taskId");
  const { observations } = await c.req.json();

  const dailyProgress = (await kv.get("daily-progress")) || {};
  const today = new Date().toISOString().split("T")[0];

  if (!dailyProgress[today]) dailyProgress[today] = {};
  if (!dailyProgress[today][checklistId])
    dailyProgress[today][checklistId] = { tasks: {} };

  dailyProgress[today][checklistId].tasks[taskId] = {
    status: "completed",
    observations,
    completedBy: prof.full_name ?? prof.username,
    completedAt: new Date().toISOString(),
  };

  const allTasks = (await kv.get("checklist-tasks")) || {};
  const tasks = allTasks[checklistId] || [];
  const completed = Object.values(
    dailyProgress[today][checklistId].tasks
  ).filter((t: any) => t.status === "completed").length;

  dailyProgress[today][checklistId].completed = completed;
  dailyProgress[today][checklistId].total = tasks.length;

  await kv.set("daily-progress", dailyProgress);

  const historico = (await kv.get("historico")) || [];
  historico.unshift({
    id: `hist-${Date.now()}`,
    type: "checklist",
    action: "Tarea completada",
    user: prof.full_name ?? prof.username,
    userId: prof.id,
    checklistId,
    taskId,
    observations,
    date: new Date().toISOString(),
  });
  await kv.set("historico", historico.slice(0, 500));

  return c.json({ ok: true });
});

// INCIDENCIAS
app.get("/incidencias", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const incidencias = (await kv.get("incidencias")) || [];
  return c.json({ ok: true, data: incidencias });
});

app.post("/incidencias", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  const { title, description, priority, checklistId, taskId, photoData } =
    await c.req.json();

  const incidencias = (await kv.get("incidencias")) || [];
  const newIncidencia = {
    id: `inc-${Date.now()}`,
    title,
    description,
    priority,
    status: "abierta",
    checklistId,
    taskId,
    userId: prof.id,
    userName: prof.full_name ?? prof.username,
    photoData: photoData || null,
    date: new Date().toISOString(),
    updates: [],
  };

  incidencias.unshift(newIncidencia);
  await kv.set("incidencias", incidencias);

  const historico = (await kv.get("historico")) || [];
  historico.unshift({
    id: `hist-${Date.now()}`,
    type: "incidencia",
    action: "Incidencia creada",
    user: prof.full_name ?? prof.username,
    userId: prof.id,
    incidenciaId: newIncidencia.id,
    title,
    date: new Date().toISOString(),
  });
  await kv.set("historico", historico.slice(0, 500));

  return c.json({ ok: true, data: newIncidencia });
});

app.put("/incidencias/:id/status", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  const incidenciaId = c.req.param("id");
  const { status, comment } = await c.req.json();

  const incidencias = (await kv.get("incidencias")) || [];
  const idx = incidencias.findIndex((inc: any) => inc.id === incidenciaId);
  if (idx === -1) return jsonError(c, 404, "Incidencia no encontrada");

  incidencias[idx].status = status;
  incidencias[idx].updates.push({
    date: new Date().toISOString(),
    user: prof.full_name ?? prof.username,
    action: `Estado cambiado a: ${status}`,
    comment,
  });

  await kv.set("incidencias", incidencias);
  return c.json({ ok: true, data: incidencias[idx] });
});

// ✅ DELETE incidencias (esto te faltaba)
app.delete("/incidencias/:id", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  if (!isAdmin(prof)) return jsonError(c, 401, "No autorizado (solo admin)");

  const incidenciaId = c.req.param("id");
  const incidencias = (await kv.get("incidencias")) || [];

  const idx = incidencias.findIndex((inc: any) => inc.id === incidenciaId);
  if (idx === -1) return jsonError(c, 404, "Incidencia no encontrada");

  const [deleted] = incidencias.splice(idx, 1);
  await kv.set("incidencias", incidencias);

  const historico = (await kv.get("historico")) || [];
  historico.unshift({
    id: `hist-${Date.now()}`,
    type: "incidencia",
    action: "Incidencia eliminada",
    user: prof.full_name ?? prof.username,
    userId: prof.id,
    incidenciaId,
    title: deleted?.title ?? "",
    date: new Date().toISOString(),
  });
  await kv.set("historico", historico.slice(0, 500));

  return c.json({ ok: true, data: { success: true } });
});

// APPCC
app.get("/appcc/registros", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const registros = (await kv.get("appcc-registros")) || [];
  return c.json({ ok: true, data: registros });
});

app.post("/appcc/temperatura", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  const { equipmentId, temperature, observations } = await c.req.json();

  const registros = (await kv.get("appcc-registros")) || [];
  const newRegistro = {
    id: `appcc-${Date.now()}`,
    type: "temperatura",
    equipmentId,
    temperature,
    observations,
    userId: prof.id,
    userName: prof.full_name ?? prof.username,
    date: new Date().toISOString(),
  };

  registros.unshift(newRegistro);
  await kv.set("appcc-registros", registros.slice(0, 1000));

  const historico = (await kv.get("historico")) || [];
  historico.unshift({
    id: `hist-${Date.now()}`,
    type: "appcc",
    action: "Temperatura registrada",
    user: prof.full_name ?? prof.username,
    userId: prof.id,
    equipmentId,
    temperature,
    date: new Date().toISOString(),
  });
  await kv.set("historico", historico.slice(0, 500));

  return c.json({ ok: true, data: newRegistro });
});

app.post("/appcc/aceite", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  const { equipmentId, tipo, motivo, observations } = await c.req.json();

  const registros = (await kv.get("appcc-registros")) || [];
  const newRegistro = {
    id: `appcc-${Date.now()}`,
    type: "aceite",
    equipmentId,
    tipo,
    motivo,
    observations,
    userId: prof.id,
    userName: prof.full_name ?? prof.username,
    date: new Date().toISOString(),
  };

  registros.unshift(newRegistro);
  await kv.set("appcc-registros", registros.slice(0, 1000));

  const historico = (await kv.get("historico")) || [];
  historico.unshift({
    id: `hist-${Date.now()}`,
    type: "appcc",
    action: "Cambio de aceite registrado",
    user: prof.full_name ?? prof.username,
    userId: prof.id,
    equipmentId,
    tipo,
    date: new Date().toISOString(),
  });
  await kv.set("historico", historico.slice(0, 500));

  return c.json({ ok: true, data: newRegistro });
});

// EQUIPMENT
app.get("/equipment", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const equipment = (await kv.get("equipment")) || [];
  return c.json({ ok: true, data: equipment });
});

app.post("/equipment", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  if (!isAdmin(prof)) return jsonError(c, 401, "No autorizado (solo admin)");

  const { name, type } = await c.req.json();
  const equipment = (await kv.get("equipment")) || [];

  const newEquipment = {
    id: `eq-${Date.now()}`,
    name,
    type,
    status: "ok",
    lastCheck: new Date().toISOString(),
  };

  equipment.push(newEquipment);
  await kv.set("equipment", equipment);

  return c.json({ ok: true, data: newEquipment });
});

app.delete("/equipment/:id", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  if (!isAdmin(prof)) return jsonError(c, 401, "No autorizado (solo admin)");

  const equipmentId = c.req.param("id");
  const equipment = (await kv.get("equipment")) || [];
  const filtered = equipment.filter((eq: any) => eq.id !== equipmentId);

  await kv.set("equipment", filtered);
  return c.json({ ok: true, data: { success: true } });
});

// HISTORICO
app.get("/historico", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const historico = (await kv.get("historico")) || [];
  return c.json({ ok: true, data: historico });
});

// USERS (ADMIN)
app.get("/users", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  if (!isAdmin(prof)) return jsonError(c, 401, "No autorizado (solo admin)");

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id,email,username,full_name,role,area,active,created_at");

  if (pErr)
    return jsonError(c, 500, "Error al obtener perfiles", {
      details: pErr.message,
    });

  return c.json({ ok: true, data: profiles ?? [] });
});

app.post("/users", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const adminProf = auth.profile as Profile;
  if (!isAdmin(adminProf))
    return jsonError(c, 401, "No autorizado (solo admin)");

  const { email, password, username, role, area, full_name } =
    await c.req.json();

  if (!["admin", "encargado", "empleado"].includes(role)) {
    return jsonError(c, 400, "role inválido");
  }
  if (area && !["cocina", "sala"].includes(area)) {
    return jsonError(c, 400, "area inválida");
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, role, area, name: full_name },
  });

  if (error)
    return jsonError(c, 400, "Error al crear usuario", {
      details: error.message,
    });

  await supabase
    .from("profiles")
    .update({
      username,
      role,
      area: area ?? null,
      full_name: full_name ?? null,
      active: true,
    })
    .eq("id", data.user.id);

  return c.json({
    ok: true,
    data: {
      success: true,
      id: data.user.id,
      email,
      username,
      role,
      area,
      full_name,
    },
  });
});

app.delete("/users/:id", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  if (!isAdmin(prof)) return jsonError(c, 401, "No autorizado (solo admin)");

  const userId = c.req.param("id");
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error)
    return jsonError(c, 400, "Error al eliminar usuario", {
      details: error.message,
    });

  return c.json({ ok: true, data: { success: true } });
});

// =======================
// PENDING USERS (ADMIN)
// =======================
app.get("/admin/pending-users", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  if (!isAdmin(prof)) return jsonError(c, 401, "No autorizado (solo admin)");

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,email,username,full_name,role,area,active,created_at,phone,address"
    )
    .eq("active", false)
    .order("created_at", { ascending: true });

  if (error)
    return jsonError(c, 500, "Error al obtener pendientes", {
      details: error.message,
    });

  return c.json({ ok: true, data: data ?? [] });
});

app.post("/admin/approve-user", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const adminProf = auth.profile as Profile;
  if (!isAdmin(adminProf))
    return jsonError(c, 401, "No autorizado (solo admin)");

  const { profileId, role, area } = await c.req.json();

  if (!profileId) return jsonError(c, 400, "Falta profileId");
  if (!["admin", "encargado", "empleado"].includes(role))
    return jsonError(c, 400, "role inválido");
  if (area && !["cocina", "sala"].includes(area))
    return jsonError(c, 400, "area inválida");

  const { error } = await supabase
    .from("profiles")
    .update({ active: true, role, area: area ?? null })
    .eq("id", profileId);

  if (error)
    return jsonError(c, 500, "Error al aprobar", { details: error.message });

  return c.json({ ok: true });
});

// EXAMS
app.get("/exams", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const exams = (await kv.get("exams")) || [];
  return c.json({ ok: true, data: exams });
});

app.post("/exams", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  if (!isAdmin(prof)) return jsonError(c, 401, "No autorizado (solo admin)");

  const { title, description, questions } = await c.req.json();
  const exams = (await kv.get("exams")) || [];

  const newExam = {
    id: `exam-${Date.now()}`,
    title,
    description,
    questions,
    createdBy: prof.full_name ?? prof.username,
    createdAt: new Date().toISOString(),
  };

  exams.push(newExam);
  await kv.set("exams", exams);

  return c.json({ ok: true, data: newExam });
});

app.post("/exams/:id/submit", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  const examId = c.req.param("id");
  const { answers } = await c.req.json();

  const results = (await kv.get("exam-results")) || [];
  const exams = (await kv.get("exams")) || [];
  const exam = exams.find((e: any) => e.id === examId);

  if (!exam) return jsonError(c, 404, "Examen no encontrado");

  let correct = 0;
  exam.questions.forEach((q: any, i: number) => {
    if (answers[i] === q.correctAnswer) correct++;
  });

  const score = (correct / exam.questions.length) * 100;

  const newResult = {
    id: `result-${Date.now()}`,
    examId,
    userId: prof.id,
    userName: prof.full_name ?? prof.username,
    answers,
    score,
    correct,
    total: exam.questions.length,
    date: new Date().toISOString(),
  };

  results.push(newResult);
  await kv.set("exam-results", results);

  return c.json({ ok: true, data: newResult });
});

app.get("/exams/results", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  if (!isAdmin(prof)) return jsonError(c, 401, "No autorizado (solo admin)");

  const results = (await kv.get("exam-results")) || [];
  return c.json({ ok: true, data: results });
});

// MESSAGES
app.get("/messages", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  const messages = (await kv.get("messages")) || [];

  if (prof.role === "admin") return c.json({ ok: true, data: messages });

  const userMessages = messages.filter(
    (msg: any) => msg.recipientId === prof.id || msg.recipientId === "all"
  );
  return c.json({ ok: true, data: userMessages });
});

app.post("/messages", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const prof = auth.profile as Profile;
  if (!isAdmin(prof)) return jsonError(c, 401, "No autorizado (solo admin)");

  const { recipientId, subject, message } = await c.req.json();
  const messages = (await kv.get("messages")) || [];

  const newMessage = {
    id: `msg-${Date.now()}`,
    senderId: prof.id,
    senderName: prof.full_name ?? prof.username,
    recipientId,
    subject,
    message,
    read: false,
    date: new Date().toISOString(),
  };

  messages.unshift(newMessage);
  await kv.set("messages", messages);

  return c.json({ ok: true, data: newMessage });
});

app.put("/messages/:id/read", async (c) => {
  const auth = await requireAuth(c);
  if (auth.error) return auth.error;

  const messageId = c.req.param("id");
  const messages = (await kv.get("messages")) || [];

  const idx = messages.findIndex((m: any) => m.id === messageId);
  if (idx !== -1) {
    messages[idx].read = true;
    await kv.set("messages", messages);
  }

  return c.json({ ok: true, data: { success: true } });
});
Deno.serve((req) => {
  const url = new URL(req.url);

  const prefixes = [`/functions/v1/${FUNCTION_NAME}`, `/${FUNCTION_NAME}`];

  for (const p of prefixes) {
    if (url.pathname.startsWith(p)) {
      url.pathname = url.pathname.slice(p.length) || "/";
      break;
    }
  }

  return app.fetch(new Request(url.toString(), req));
});
