import { 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    SlashCommandBuilder

} from "discord.js";

import {teamDrafts} from "../../states/draft-exports.js";
import {buildTeamCreationEmbed} from "../../interactions/team-creation.js";

const adminRoleId = process.env.ADMIN_ROLE_ID;
const staffRoleId = process.env.STAFF_ROLE_ID;


if (!adminRoleId || !staffRoleId) {
    throw new Error("Role IDs need to be set.");
}

export const data = new SlashCommandBuilder()
    .setName("create-team")
    .setDescription("STAFF COMMAND: Allows the creation of a team in RML.")

export async function execute(interaction) {
    if (!interaction.inGuild()) {
        return interaction.reply({
            content: "This command must be run in a server.",
            flags: MessageFlags.Ephemeral,
        });
    }

    const staffMember = await interaction.guild.members.fetch(interaction.user.id);

    if (!staffMember.roles.cache.has(adminRoleId) && !staffMember.roles.cache.has(staffRoleId)) {
        return interaction.reply({
            content: "You do not have permission to run this command.",
            flags: MessageFlags.Ephemeral,
        });
    }
   
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
    });

    const teamDraft = {
        teamAcronym: null,
        teamName: null,
        teamManager: null,
        primaryColor: null,
        secondaryColor: null,
        ownerId: interaction.user.id
    };
    const draftId = interaction.id;
    teamDrafts.set(draftId, teamDraft);
    
    const teamsButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`teamCreation:teamAcronym:${draftId}`)
            .setLabel("Set Team Acronym")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`teamCreation:teamName:${draftId}`)
            .setLabel("Set Team Name")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`teamCreation:teamManager:${draftId}`)
            .setLabel("Set Team Manager")
            .setStyle(ButtonStyle.Secondary),
            
    );
    const colorsButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`teamCreation:primaryColor:${draftId}`)
            .setLabel("Set Primary Color")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`teamCreation:secondaryColor:${draftId}`)
            .setLabel("Set Secondary Color")
            .setStyle(ButtonStyle.Secondary)
    );
    const finalButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`finalTeamCreation:submit:${draftId}`)
            .setLabel("Submit")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`finalTeamCreation:cancel:${draftId}`)
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Danger)
    );
    

    await interaction.editReply({
        embeds: [buildTeamCreationEmbed(teamDraft)],
        components: [teamsButtons, colorsButtons, finalButtons],
    });
}

