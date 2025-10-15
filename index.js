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

//const TOKEN = "MTQyODA2MTgyMTcyMTM4MzA0NA.GxdUs9.v4W2cy_9x-Bva3_vklebzTMcWjzFB8zJHpMLCQ";
const TOKEN = process.env.TOKEN;
const ID_CANAL = "703279168175079534";

// 🔹 Keep-alive: pequeño servidor web para mantener Replit activo
const app = express();
app.get("/", (req, res) => res.send("✅ Bot de Discord activo"));
app.listen(3000, () =>
  console.log("🌐 Servidor web keep-alive en puerto 3000"),
);

// 🔹 Al conectarse el bot
client.once("clientReady", () => {
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
    .setDescription(
      "✨ ¡ Día de paga!! Id entrando para terminar y cerrar vuestros tiempos!! ✨",
    )
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

// !say → el bot habla por ti
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
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

client.login(TOKEN);
