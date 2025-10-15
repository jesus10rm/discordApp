const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const cron = require("node-cron");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const TOKEN = "TU_TOKEN_AQUI"; // ⚠️ Reemplaza con tu token

client.once("ready", () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

// !say → el bot habla por ti
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!say ")) {
    const texto = message.content.slice(5);
    await message.delete(); // Borra tu mensaje para que solo se vea el del bot
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
      .setFooter({ text: "Enviado por el equipo de comunicación" })
      .setTimestamp();

    if (imagen) embed.setImage(imagen);

    message.channel.send({ embeds: [embed] });
  }
});

// 🔁 Ejemplo de mensaje programado (cada lunes a las 10:00)
cron.schedule("0 10 * * 1", () => {
  const canal = client.channels.cache.get("ID_CANAL_AQUI");
  if (canal)
    canal.send("🗓️ ¡Feliz lunes! Recuerda revisar las novedades de la semana.");
});

client.login(TOKEN);
