import { 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder

 } from "discord.js";


const adminRoleId = process.env.ADMIN_ROLE_ID;
const registeredRoleId = process.env.REGISTERED_ROLE_ID;

if (!adminRoleId) {
    throw new Error("ADMIN_ROLE_ID is required.");
}

if (!registeredRoleId) {
    throw new Error("REGISTERED_ROLE_ID is required.");
}

export const data = new SlashCommandBuilder()
 .setName("setup-registration")
 .setDescription("ADMIN COMMAND: Posts the RML player registration panel.");

export async function execute(interaction) {
    if (!interaction.inGuild()) {
        return interaction.reply({
            content: "This command must be run in a server.",
            flags: MessageFlags.Ephemeral,
        });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (!member.roles.cache.has(adminRoleId)) {
        return interaction.reply({
            content: "You do not have permission running this command.",
            flags: MessageFlags.Ephemeral,
        });
    }

    await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
    });

    const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("RML Player Registration")
        .setDescription(
            "Register yourself as an RML player below.\n\n" +
            "If you are already registered and need to change your IGN, " +
            "use the **Update IGN** button."
        )

        .addFields(
            {
                name: "Register",
                value: "Use this if you have never registered for RML before.",
            },
            {
                name: "Update IGN",
                value: "Use this if you need to update your In-game name.",
            },
        )

        .setFooter({
            text: "Players can update their IGN once every 7 days. If you need to update it and can't, make a ticket.",
        });

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("register:register")
            .setLabel("Register")
            .setStyle(ButtonStyle.Success),
        
        new ButtonBuilder()
            .setCustomId("register:updateIGN")
            .setLabel("Update IGN")
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({
        embeds: [embed],
        components: [buttons],
    });

    await interaction.editReply({
        content: "Registration panel posted.",
    });
}