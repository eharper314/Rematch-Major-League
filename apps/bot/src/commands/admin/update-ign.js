import {
    MessageFlags,
    SlashCommandBuilder

 } from "discord.js";
import {staffUpdateIgn} from "../../api/players.client.js";
import {publishAudit} from "../../audit/publish-audit.js";    

const adminRoleId = process.env.ADMIN_ROLE_ID;
const staffRoleId = process.env.STAFF_ROLE_ID;

if (!adminRoleId) {
    throw new Error("ADMIN_ROLE_ID is required.");
}

if (!staffRoleId) {
    throw new Error("STAFF_ROLE_ID is required.");
}

export const data = new SlashCommandBuilder()
 .setName("update-ign")
 .setDescription("STAFF Command: Bypasses the update cooldown for updating an IGN.")
 .addUserOption((option) =>
    option
        .setName("user")
        .setDescription("The player needing their name updated.")
        .setRequired(true)
 )

 .addStringOption((option) =>
    option
        .setName("ign")
        .setDescription("The new IGN for the player.")
        .setRequired(true)
        .setMaxLength(32)
 )
 .addStringOption((option) =>
    option
        .setName("reason")
        .setDescription("Why the override is needed.")
        .setRequired(true)
 );
 


export async function execute(interaction) {
    if (!interaction.inGuild()) {
        return interaction.reply({
            content: "This command must be run in a server.",
            flags: MessageFlags.Ephemeral,
        });
    }

    const staffMember = await interaction.guild.members.fetch(interaction.user.id);
    let targetPlayer = interaction.options.getUser("user", true);
    targetPlayer = targetPlayer.id;
    const newIgn = interaction.options.getString("ign", true);
    const reason = interaction.options.getString("reason", true);

    if (!staffMember.roles.cache.has(adminRoleId) && !staffMember.roles.cache.has(staffRoleId)) {
        return interaction.reply({
            content: "You do not have permission running this command.",
            flags: MessageFlags.Ephemeral,
        });
    }

    await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
    });

    let result;
    
    try {
        result = await staffUpdateIgn(interaction.user.id, targetPlayer, newIgn, reason);
    } catch (error) {
        console.error("Staff override failed: ", error);

        await interaction.editReply({
            content: "I couldn't confirm if the update finished. Please let Vibe know.",
        });
        
        return;
    }

    if (!result.ok) {
        let message = "Staff override is not possible right now.";

        if (result.status === 400) {
            message = result.data.error;
        }

        if (result.status === 404) {
            message = "Player doesn't exist. Have them register.";
        }

        if (result.status === 409) {
            message = "That IGN is registered in RML already.";
        }

        await interaction.editReply({content: message});
        return;
    }

    try {
        await publishAudit(interaction.client, result.data.audit, result.data.player);
    } catch (error) {
        console.error("Audit send failed: ", error);
    }

    try {

        const member = await interaction.guild.members.fetch(targetPlayer);

        await member.setNickname(
            result.data.player.in_game_name,
            "Updated nickname to registered RML IGN"
        );

    } catch (error) {
        console.error("Updating name request failed: ", error);

        await interaction.editReply({
            content: 
            "The nickname edit could not happen, but the update saved. Manually change their nickname.",
        });
        return;
    }

    await interaction.editReply({
        content: "Display name has been synced.",
    });
}
