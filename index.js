const { Client, GatewayIntentBits } = require("discord.js");
const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const distube = new DisTube(client, {
  leaveOnEmpty: false,
  leaveOnStop: false,
  leaveOnFinish: false,
  emitAddSongWhenCreatingQueue: true,
  emitAddListWhenCreatingQueue: true,
  plugins: [ new SpotifyPlugin() ]
});

client.on("messageCreate", async message => {
  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "play") {
    if (!message.member.voice.channel)
      return message.reply("🎧 You need to join a voice channel first!");
    const query = args.join(" ");
    if (!query) return message.reply("❌ Please provide a song name or link!");
    distube.play(message.member.voice.channel, query, {
      textChannel: message.channel,
      member: message.member
    });
  }

  if (command === "skip") {
    const queue = distube.getQueue(message);
    if (!queue) return message.channel.send("🚫 Nothing is playing!");
    distube.skip(message);
    message.channel.send("⏭️ Skipped!");
  }

  if (command === "stop") {
    const queue = distube.getQueue(message);
    if (!queue) return message.channel.send("🚫 Nothing is playing!");
    distube.stop(message);
    message.channel.send("⏹️ Stopped the music!");
  }

  if (command === "queue") {
    const queue = distube.getQueue(message);
    if (!queue) return message.channel.send("🚫 Queue is empty.");
    message.channel.send(
      "🎶 Current Queue:\n" +
        queue.songs.map((song, i) => `${i === 0 ? "▶️" : `${i}.`} ${song.name} - \`${song.formattedDuration}\``).join("\n")
    );
  }
});

distube
  .on("playSong", (queue, song) =>
    queue.textChannel.send(`🎵 Now playing: **${song.name}** - \`${song.formattedDuration}\``)
  )
  .on("addSong", (queue, song) =>
    queue.textChannel.send(`➕ Added: **${song.name}** - \`${song.formattedDuration}\``)
  )
  .on("addList", (queue, playlist) =>
    queue.textChannel.send(`📑 Added playlist: **${playlist.name}** (${playlist.songs.length} songs)`)
  )
  .on("finish", queue =>
    queue.textChannel.send("✅ Queue finished! Autoplaying similar songs...")
  )
  .on("error", (channel, e) => {
    if (channel) channel.send("❌ An error occurred: " + e.toString().slice(0, 2000));
    else console.error(e);
  });

client.login(process.env.TOKEN);
