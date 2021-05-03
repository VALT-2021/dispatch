const fs = require('fs')

const config = require('./config.json')

const log = require('./log.js')
const random = require('./random.js')
const randomText = require('./randomText.js')

const Discord = require('discord.js')
const client = new Discord.Client()
const embed = new Discord.MessageEmbed()
const cooldown = new Discord.Collection()

const edb = require("@betadv/easy-db")
const db = new edb()

client.on('ready', async ready => {
    log(`Logged in as ${client.user.tag}`,1)
    const command1 = (await client.api.applications(client.user.id).commands.get()).find(c => c.name === 'dispatch')
    const command2 = (await client.api.applications(client.user.id).commands.get()).find(c => c.name === 'dispatchmetastats')
    if (!command1 && !command2) {
        log('Created Interaction Command',2)
        client.api.applications(client.user.id).commands.post({
            data: {
                name: "dispatch",
                description: "Play some loud audio in your voice channel",
                    options: [
                        {
                        name: 'audio',
                        description: 'A custom audio to play in the voice channel',
                        type: 3,
                        required: false,
                        choices: [
                            {
                                name: 'Default',
                                value: 'default'
                            },
                            {
                                name: 'Among Us',
                                value: 'among-us'
                            },
                            {
                                name: 'Another One',
                                value: 'another-one'
                            },
                            {
                                name: 'Cow Moo',
                                value: 'cow-moo'
                            },
                            {
                                name: 'Didgeridoo',
                                value: 'didgeridoo'
                            },
                            {
                                name: 'Owen Wilson',
                                value: 'owen-wilson'
                            },
                            {
                                name: 'Robot Man',
                                value: 'robot-man'
                            },
                            {
                                name: 'Vuvuzela',
                                value: 'vuvuzela'
                            },
                            {
                                name: 'Wow',
                                value: 'wow'
                            },
                            {
                                name: 'Random',
                                value: 'random'
                            }
                        ]
                    }
                ]
            }
        })
        client.api.applications(client.user.id).commands.post({
            data: {
                name: "dispatchmetastats",
                description: "Get the dispatch stats",
                options: [
                    {
                        name: 'user',
                        description: 'Check the stats of a user',
                        type: 6,
                        required: false
                    }
                ]
            }
        })
        return db.set('total',1)
    }
    client.user.setActivity('loud blows', {
        type: 'STREAMING',
        url: 'https://www.twitch.tv/videos/829455220'
    })
})

client.on('disconnect', async disconnect => {
    log(`Logged out as ${client.user.tag}`,3)
})

client.on('guildCreate', async guild => {
    db.set(guild.id,1)
})

client.on('guildDelete', async guild => {
    db.delete(guild.id)
})

client.ws.on('INTERACTION_CREATE', async interaction => {
    async function interactionReply(contentString, ephemeralBoolean) {
        if (!contentString) return log('No data was provided to return',3)
        if (ephemeralBoolean === true) return client.api.interactions(interaction.id, interaction.token).callback.post({data:{type:4,data:{content:contentString,flags:1<<6}}})
        else client.api.interactions(interaction.id, interaction.token).callback.post({data:{type:4,data:{content:contentString,flags:0}}})
    }

    if (!interaction.guild_id || !interaction.member.user.id) return interactionReply('This command can be invoked in a guild only',true)
    if (!client.guilds.cache.has(interaction.guild_id)) return interactionReply('The bot was not found in the guild',true)
    const guild = await client.guilds.fetch(interaction.guild_id)
    const guildMember = await guild.members.fetch(interaction.member.user.id)
    if (!guildMember) return interactionReply('You were not found in the guild',true)
    const botGuildMember = await guild.members.fetch(client.user.id)
    if (!botGuildMember) return interactionReply('The bot was not found in the guild',true)

    if (interaction.data.name === 'dispatch') {
        if (interaction.member.user.verified == false) return interactionReply('Only verified users can dispatch audio', true)
        const guilduser = guild.members.fetch(interaction.member.user.id)
        const sounds = ['default', 'among-us', 'another-one', 'cow-moo', 'didgeridoo', 'owen-wilson', 'robot-man', 'vuvzela', 'wow']
        const cooldownTime = 60000
        const lastUsed = cooldown.get(interaction.member.user.id)
        if (lastUsed && cooldownTime - (Date.now() - lastUsed) > 0) {
            let timeObj = Math.round((cooldownTime - (Date.now() - lastUsed))/1000)
            return interactionReply(`Wait ${timeObj} seconds before dispatching again`,true)
        }
        const botVoiceChannel = botGuildMember.voice.channel 
        const voiceChannel = guildMember.voice.channel
        if (botVoiceChannel) return interactionReply('The bot is busy in another voice channel',true)
        if (!voiceChannel) return interactionReply('You need to be in a voice channel',true)
        try {
            fetchedVoiceChannel = await client.channels.fetch(voiceChannel.id,{
            withOverwrites: true
            })
        } catch (error) {return interactionReply('The bot could not join the voice channel',true)
        }
        if (!fetchedVoiceChannel) return interactionReply(`You need to be in a voice channel`, true)
        if (!botGuildMember.permissionsIn(fetchedVoiceChannel).has('CONNECT')) return interactionReply('The bot could not connect to the voice channel',true)
        interactionReply(`Dispatching audio...`,false)
        const connection = await fetchedVoiceChannel.join()
        let soundName = 'default'
        if (interaction.data.options) {
            interaction.data.options.forEach((option) => {
                if (option.name === 'sound') {
                  if (option.value === 'random') {
                      soundName = `${randomText(sounds,10)}`
                  }
                  else {
                      soundName == `${option.value}`
                  }
                }
              })
        }
        soundName = soundName.toLowerCase()
        const player = await connection.play(fs.createReadStream(`./src/streams/${soundName}.ogg`), {
            type: 'ogg/opus',
        })
        player.on('finish', () => {
            connection.disconnect()
        })
        cooldown.set(interaction.member.user.id, Discord.SnowflakeUtil.deconstruct(interaction.id).timestamp)
        setTimeout(() => {
            cooldown.delete(interaction.member.user.id)
        }, 60000)
        db.add('total',1)
        db.add(interaction.guild_id,1)
        if (db.has(interaction.member.user.id)) {
            db.add(interaction.member.user.id,1)
        }
        else return db.set(interaction.member.user.id,1)
    }
    if (interaction.data.name === 'dispatchmetastats') {
        interactionReply('Beep boop! Boop beep?',true)
        let user = interaction.member.user.id
        if (interaction.data.options) {
            interaction.data.options.forEach((option) => {
                if (option.name === 'user') {
                    user = option.value
                }
              })
        }
        let userScore = 0
        if (db.has(user)) {
            userScore = db.get(user)
        }
        const totalScore = await db.get('total')
        const guildScore = await db.get(interaction.guild_id)
        async function interactionEditReply(content) {
            client.api.webhooks(client.user.id, interaction.token).messages('@original').patch({data: {content:content}})
        }
        if (user === interaction.member.user.id) return interactionEditReply(`**Statistics**\nGlobal: ${totalScore}\nGuild: ${guildScore}\nYou: ${userScore}`)
        else return interactionEditReply(`User: ${userScore}`)
    }
})

client.login(config.token)
