import {EmbedBuilder} from "discord.js";

const auditChannel = process.env.AUDIT_CHANNEL_ID;

if (!auditChannel) {
    throw new Error("AUDIT_CHANNEL_ID is required.");
}

export async function publishPlayerAudit(discordClient, audit, player) {

    if (audit === null) {
        return;
    }

    const channel = await discordClient.channels.fetch(auditChannel);

    if (!channel || !channel.isSendable()) {
        throw new Error("Discord channel is unreachable/not set.");
    }

    const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("RML Audit")
        .addFields(
            {
                name: "Action",
                value: audit.action,
            },
            {
                name: "Staff",
                value: `<@${audit.actor_discord_user_id}>`,
            },
            {
                name: "Player",
                value: `<@${player.discord_user_id}> - ID ${audit.target_id}`,
            },
            {
                name: "Reason",
                value: audit.reason.slice(0, 1024),
            }
        )
        .setTimestamp(new Date(audit.created_at))
        .setFooter({
            text: `Audit ID: ${audit.audit_id}`,
        });

    await channel.send({
        embeds: [embed],
        allowedMentions: {parse: []},
    });

}

export async function publishTeamAudit(discordClient, audit, team) {

    if (audit === null) {
        return;
    }

    const channel = await discordClient.channels.fetch(auditChannel);

    if (!channel || !channel.isSendable()) {
        throw new Error("Discord channel is unreachable/not set.");
    }

    const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("RML Audit")
        .addFields(
            {
                name: "Action",
                value: audit.action,
            },
            {
                name: "Staff",
                value: `<@${audit.actor_discord_user_id}>`,
            },
            {
                name: "Team",
                value: `<@&${team}> - ID ${audit.target_id}`,
            },
            {
                name: "Reason",
                value: audit.reason.slice(0, 1024),
            }
        )
        .setTimestamp(new Date(audit.created_at))
        .setFooter({
            text: `Audit ID: ${audit.audit_id}`,
        });

    await channel.send({
        embeds: [embed],
        allowedMentions: {parse: []},
    });
}