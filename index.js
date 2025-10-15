// 🛡️ Evitar que Render arranque doble instancia (preview o health check)
if (process.env.RENDER === "true" && process.env.NODE_ENV !== "production") {
  console.log("🛑 Render está iniciando una instancia de preview. Cancelando ejecución...");
  process.exit(0);
}

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const cron = require("node-cron");
const express = require("express");

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
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

// 🕗 COMUNICADOS AUTOMÁTICOS

// Miércoles a las 20:00
cron.schedule("0 20 * * 3", () => {
  const canal = client.channels.cache.get(ID_CANAL);
  if (!canal) return console.log("❌ No se encontró el canal de comunicados");

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle("💰 Día de paga")
    .setDescription("✨ ¡ Día de paga!! Id entrando para terminar y cerrar vuestros tiempos!! ✨")
    .setTimestamp();

  canal.send({ embeds: [embed] });
  console.log("📢 Comunicado de miércoles enviado");
});

// Domingo a las 20:00
cron.schedule("0 20 * * 0", () => {
  const canal = client.channels.cache.get(ID_CANAL);
  if (!canal) return console.log("❌ No se encontró el canal de comunicados");

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("💰 Día de paga")
    .setDescription("✨ ¡ Día de paga general ! ✨")
    .setTimestamp();

  canal.send({ embeds: [embed] });
  console.log("📢 Comunicado de domingo enviado");
});

// 🎙️ Comandos
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ✅ Solo usuarios con el rol "Founder" pueden usar comandos
  const rolPermitido = message.guild.roles.cache.find(
    (r) => r.name.toLowerCase() === "founder" // cámbialo si tu rol es “fundador”
  );

  if (!rolPermitido) {
    console.log("⚠️ No se encontró el rol 'Founder' en el servidor.");
    return;
  }

  const tieneRol = message.member.roles.cache.has(rolPermitido.id);

  // ❌ Si no tiene el rol, avisar y borrar el aviso tras 5s
  if (!tieneRol) {
    return message
      .reply("🚫 No tienes permiso para usar este comando.")
      .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
  }

  // !say → el bot habla por ti
  if (message.content.startsWith("!say ")) {
    const texto = message.content.slice(5);
    try {
      await message.delete();
    } catch (err) {
      console.log("⚠️ No se pudo borrar el mensaje:", err.message);
    }
    message.channel.send(texto);
  }

  // !comunicado → crea un embed con título, texto e imagen
  if (message.content.startsWith("!comunicado ")) {
    const args = message.content.slice(12).split("|");
    const titulo = args[0]?.trim() || "Comunicado";
    const descripcion = args[1]?.trim() || "Sin contenido";
    const imagen = args[2]?.trim() || null;

    // 🗑️ Borra el mensaje original del usuario
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

    message.channel.send({ embeds: [embed] });
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
