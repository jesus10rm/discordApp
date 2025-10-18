// 🚫 Evitar ejecución doble entre contenedores en Render
if (process.env.PORT && process.env.RENDER_EXTERNAL_URL) {
  console.log("🛡️ Previniendo ejecución múltiple en Render (modo health check).");
  if (process.env.RENDER === "true" && process.env.NODE_ENV !== "production") {
    console.log("🛑 Render está iniciando una instancia de preview. Cancelando ejecución...");
    process.exit(0);
  }
}

// 🚫 Evitar ejecución doble dentro del mismo contenedor (Render bug)
if (global.hasRun) {
  console.log("⚠️ Instancia duplicada detectada en el mismo contenedor, deteniendo ejecución.");
  process.exit(0);
}
global.hasRun = true;

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const cron = require("node-cron");
const express = require("express");

// 🧠 Control adicional para evitar instancias duplicadas del bot
let botActivo = false;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Carga del token y canal
const TOKEN = process.env.TOKEN;
const ID_CANAL = "703279168175079534";

// 🟢 Servidor web para mantener Render activo
const app = express();
app.get("/", (req, res) => res.send("✅ Bot de Discord activo"));
app.listen(3000, () => console.log("🌐 Servidor web keep-alive en puerto 3000"));

// 🔹 Al conectarse el bot
client.once("ready", () => {
  if (botActivo) {
    console.log("⚠️ Segunda instancia detectada. Cerrando...");
    process.exit(0);
  }
  botActivo = true;

  console.log(`✅ Bot conectado como ${client.user.tag}`);
  console.log("🕒 Hora local Madrid:", new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" }));
});

// 🕗 COMUNICADOS AUTOMÁTICOS
cron.schedule(
  "0 20 * * 3",
  () => {
    const canal = client.channels.cache.get(ID_CANAL);
    if (!canal) return console.log("❌ No se encontró el canal de comunicados");

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("💰 Día de paga")
      .setDescription("✨ ¡ Día de paga!! Id entrando para terminar y cerrar vuestros tiempos!! ✨")
      .setTimestamp();

    canal.send({ content: "@everyone\n\n", embeds: [embed] });
    console.log("📢 Comunicado de miércoles enviado");
  },
  { timezone: "Europe/Madrid" }
);

cron.schedule(
  "0 20 * * 0",
  () => {
    const canal = client.channels.cache.get(ID_CANAL);
    if (!canal) return console.log("❌ No se encontró el canal de comunicados");

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("💰 Día de paga")
      .setDescription("✨ ¡ Día de paga general ! ✨")
      .setTimestamp();

    canal.send({ content: "@everyone\n\n", embeds: [embed] });
    console.log("📢 Comunicado de domingo enviado");
  },
  { timezone: "Europe/Madrid" }
);

// 🎙️ Comandos
const cooldown = new Set();

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ===============================
  // 🧩 BLOQUE 1: COMANDOS DEL FOUNDER
  // ===============================
  const rolFounder = message.guild.roles.cache.find(
    (r) => r.name.toLowerCase() === "founder"
  );

  if (rolFounder && message.member.roles.cache.has(rolFounder.id)) {
    // !say → el bot habla por ti
    if (message.content.startsWith("!say ")) {
      const texto = message.content.slice(5);
      try {
        await message.delete();
      } catch (err) {
        console.log("⚠️ No se pudo borrar el mensaje:", err.message);
      }
      message.channel.send(`@everyone\n\n${texto}`);
    }

    // !comunicado → crea un embed con título, texto e imagen
    if (message.content.startsWith("!comunicado ")) {
      const args = message.content.slice(12).split("|");
      const titulo = args[0]?.trim() || "Comunicado";
      const descripcion = args[1]?.trim() || "Sin contenido";
      const imagen = args[2]?.trim() || null;

      try {
        await message.delete();
      } catch (err) {
        console.log("⚠️ No se pudo borrar el mensaje:", err.message);
      }

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`📢 ${titulo}`)
        .setDescription(descripcion)
        .setFooter({ text: "Enviado por el equipo de Founders" })
        .setTimestamp();

      if (imagen) embed.setImage(imagen);

      message.channel.send({ content: "@everyone\n\n", embeds: [embed] });
    }
  }

// ===============================
// 🧩 BLOQUE 2: DIRECTOR DE EVENTOS (por NOMBRE)
// ===============================
if (
  message.content.startsWith("!rol ") ||
  message.content.startsWith("!removerol ") ||
  message.content === "!roles"
) {
  try { await message.delete(); } catch (err) {}

  // 🔐 Verificar rol del Director de Eventos (por nombre)
  const rolDirectorEventos = message.guild.roles.cache.find(
    (r) => r.name.toLowerCase() === "director de eventos"
  );

  if (!rolDirectorEventos || !message.member.roles.cache.has(rolDirectorEventos.id)) {
    return message.channel.send("🚫 No tienes permiso para usar este comando.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  // 📍 Solo canal permitido (puedes dejarlo por ID o también buscarlo por nombre)
  const canalPermitido = "1428366292913750146"; // ID ┃🏵️┃ɢᴇsᴛɪᴏɴ-ʀᴏʟᴇs
  if (message.channel.id !== canalPermitido) {
    return message.channel.send("🚫 Este comando solo puede usarse en el canal de gestión de roles.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  // 🕒 Cooldown
  if (cooldown.has(message.author.id)) {
    return message.channel.send("⏳ Espera unos segundos antes de usar este comando de nuevo.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }
  cooldown.add(message.author.id);
  setTimeout(() => cooldown.delete(message.author.id), 5000);

  // 📋 Lista blanca de roles de eventos (por nombre)
  const rolesPermitidos = [
    "Coordinador de Eventos",
    "Planeador de Eventos",
    "Reportero",
  ];

  // 🔹 Mostrar roles disponibles
  if (message.content === "!roles") {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("🎯 Roles disponibles de Eventos")
      .setDescription(rolesPermitidos.map((r) => `• **${r}**`).join("\n"))
      .setFooter({ text: "Usa !rol o !removerol para asignar o quitar un rol" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] })
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 10000));

    return;
  }

  // 🧩 Si es !rol o !removerol
  const esAsignar = message.content.toLowerCase().startsWith("!rol ");
  const action = esAsignar ? "asignar" : "remover";
  const comandoStr = esAsignar ? "!rol" : "!removerol";

  const args = message.content.split(" ").slice(1);
  const miembro = message.mentions.members.first();
  const nombreRol = args.slice(1).join(" ").trim();

  if (!miembro || !nombreRol) {
    return message.channel.send(`❗ Uso correcto: \`${comandoStr} @usuario Nombre del Rol\``)
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  const rol = message.guild.roles.cache.find(
    (r) => r.name.toLowerCase() === nombreRol.toLowerCase()
  );

  if (!rol || !rolesPermitidos.some((r) => r.toLowerCase() === nombreRol.toLowerCase())) {
    return message.channel.send("🚫 No puedes gestionar ese rol.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  // ⚡ Asignar o remover directamente
  try {
    if (action === "asignar") {
      await miembro.roles.add(rol);
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ Rol asignado correctamente")
        .setDescription(`${miembro} ahora tiene el rol **${rol.name}**.`)
        .setFooter({ text: "Sistema de Gestión de Roles EP" })
        .setTimestamp();

      message.channel.send({ embeds: [embed] })
        .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 7000));
    } else {
      await miembro.roles.remove(rol);
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("🗑️ Rol removido correctamente")
        .setDescription(`${miembro} ya no tiene el rol **${rol.name}**.`)
        .setFooter({ text: "Sistema de Gestión de Roles EP" })
        .setTimestamp();

      message.channel.send({ embeds: [embed] })
        .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 7000));
    }
  } catch (err) {
    console.error("❌ Error en comando de roles:", err);
    message.channel.send("⚠️ No se pudo completar la acción. Verifica permisos del bot.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }
}

// ===============================
// 🧩 BLOQUE 3: DIRECTOR DE RRHH (por NOMBRE)
// ===============================
if (
  message.content.startsWith("!rolrrhh ") ||
  message.content.startsWith("!removerolrrhh ") ||
  message.content === "!rolesrrhh"
) {
  try { await message.delete(); } catch (err) {}

  // 🔐 Verificar rol del Director de RRHH (por nombre)
  const rolDirectorRRHH = message.guild.roles.cache.find(
    (r) => r.name.toLowerCase() === "director de rrhh"
  );

  if (!rolDirectorRRHH || !message.member.roles.cache.has(rolDirectorRRHH.id)) {
    return message.channel.send("🚫 No tienes permiso para usar este comando.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  // 📍 Canal exclusivo de gestión RRHH
  const canalPermitidoRRHH = "1429153343539777708"; // ID ┃💼┃ɢᴇsᴛɪᴏɴ-ʀʀʜʜ
  if (message.channel.id !== canalPermitidoRRHH) {
    return message.channel.send("🚫 Este comando solo puede usarse en el canal de gestión de RRHH.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  // 🕒 Cooldown
  if (cooldown.has(message.author.id)) {
    return message.channel.send("⏳ Espera unos segundos antes de usar este comando de nuevo.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }
  cooldown.add(message.author.id);
  setTimeout(() => cooldown.delete(message.author.id), 5000);

  // 📋 Lista blanca de roles de RRHH (por nombre)
  const rolesPermitidosRRHH = [
    "Coordinador de RRHH",
    "Formación [RRHH]",
    "Control [RRHH]",
  ];

  // 🔹 Mostrar roles disponibles
  if (message.content === "!rolesrrhh") {
    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle("👥 Roles disponibles de RRHH")
      .setDescription(rolesPermitidosRRHH.map((r) => `• **${r}**`).join("\n"))
      .setFooter({ text: "Usa !rolrrhh o !removerolrrhh para asignar o quitar un rol" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] })
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 10000));

    return;
  }

  // 🧩 Si es !rolrrhh o !removerolrrhh
  const esAsignar = message.content.toLowerCase().startsWith("!rolrrhh ");
  const action = esAsignar ? "asignar" : "remover";
  const comandoStr = esAsignar ? "!rolrrhh" : "!removerolrrhh";

  const args = message.content.split(" ").slice(1);
  const miembro = message.mentions.members.first();
  const nombreRol = args.slice(1).join(" ").trim();

  if (!miembro || !nombreRol) {
    return message.channel.send(`❗ Uso correcto: \`${comandoStr} @usuario Nombre del Rol\``)
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  const rol = message.guild.roles.cache.find(
    (r) => r.name.toLowerCase() === nombreRol.toLowerCase()
  );

  if (!rol || !rolesPermitidosRRHH.some((r) => r.toLowerCase() === nombreRol.toLowerCase())) {
    return message.channel.send("🚫 No puedes gestionar ese rol.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  // ⚡ Asignar o remover directamente
  try {
    if (action === "asignar") {
      await miembro.roles.add(rol);
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ Rol asignado correctamente")
        .setDescription(`${miembro} ahora tiene el rol **${rol.name}**.`)
        .setFooter({ text: "Sistema de Gestión de RRHH EP" })
        .setTimestamp();

      message.channel.send({ embeds: [embed] })
        .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 7000));
    } else {
      await miembro.roles.remove(rol);
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("🗑️ Rol removido correctamente")
        .setDescription(`${miembro} ya no tiene el rol **${rol.name}**.`)
        .setFooter({ text: "Sistema de Gestión de RRHH EP" })
        .setTimestamp();

      message.channel.send({ embeds: [embed] })
        .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 7000));
    }
  } catch (err) {
    console.error("❌ Error en comando de roles RRHH:", err);
    message.channel.send("⚠️ No se pudo completar la acción. Verifica permisos del bot.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }
}
});

// 🧩 Verificación del token antes de iniciar
if (!TOKEN) {
  console.error("❌ No se detectó la variable TOKEN. Asegúrate de configurarla en Render.");
  process.exit(1);
} else {
  console.log("✅ TOKEN detectado correctamente en Render (oculto por seguridad).");
  client.login(TOKEN);
}
