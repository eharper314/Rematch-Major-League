import {
    LabelBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    UserSelectMenuBuilder,
    EmbedBuilder,
    Message
} from "discord.js";

import {teamDrafts} from "../states/draft-exports.js";    
import {createTeam, patchRoleForumId} from "../api/teams.client.js";
import {publishTeamAudit} from "../audit/publish-audit.js";

const registeredRoleId = process.env.REGISTERED_ROLE_ID;
const staffRoleId = process.env.STAFF_ROLE_ID;
const adminRoleId = process.env.ADMIN_ROLE_ID;
const forumChannelId = process.env.FORUM_CHANNEL_ID;
const managerRoleId = process.env.MANAGER_ROLE_ID;

function createTeamAcronymModal(interaction) {

    const [prefix, action, draftId] = interaction.customId.split(":");

    const input = new TextInputBuilder()
        .setCustomId("teamCreation:team-acronym")
        .setMaxLength(5)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Team acronym; if not provided, then put RML.")
        .setValue("RML")
        .setRequired(true)
    
    const label = new LabelBuilder()
        .setLabel("Team Acronym")
        .setTextInputComponent(input)

    return new ModalBuilder()
        .setCustomId(`teamCreation:teamAcronymSubmit:${draftId}`)
        .setTitle("Set/Update Team Acronym")
        .setLabelComponents(label)
}

function createTeamNameModal(interaction) {

    const [prefix, action, draftId] = interaction.customId.split(":");

    const input = new TextInputBuilder()
        .setCustomId("teamCreation:team-name")
        .setMaxLength(64)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("RML Team name")
        .setRequired(true)
    
    const label = new LabelBuilder()
        .setLabel("Team Name")
        .setTextInputComponent(input)

    return new ModalBuilder()
        .setCustomId(`teamCreation:teamNameSubmit:${draftId}`)
        .setTitle("Set/Update Team Name")
        .setLabelComponents(label)
}

function createTeamManagerModal(interaction) {

    const [prefix, action, draftId] = interaction.customId.split(":");

    const input = new UserSelectMenuBuilder()
        .setCustomId("teamCreation:team-manager")
        .setPlaceholder("RML Team Manager")
        .setMinValues(1)
        .setMaxValues(1)
        .setRequired(true)
    
    const label = new LabelBuilder()
        .setLabel("Team Manager")
        .setUserSelectMenuComponent(input)

    return new ModalBuilder()
        .setCustomId(`teamCreation:teamManagerSubmit:${draftId}`)
        .setTitle("Set/Update Team Manager")
        .setLabelComponents(label)
}

function createPrimaryColorModal(interaction) {

    const [prefix, action, draftId] = interaction.customId.split(":");

    const input = new TextInputBuilder()
        .setCustomId("teamCreation:primary-color")
        .setMaxLength(7)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Primary Color. Ex: #FF00FF")
        .setRequired(true)
    
    const label = new LabelBuilder()
        .setLabel("Primary Color")
        .setTextInputComponent(input)

    return new ModalBuilder()
        .setCustomId(`teamCreation:primaryColorSubmit:${draftId}`)
        .setTitle("Set/Update Primary Color")
        .setLabelComponents(label)
}

function createSecondaryColorModal(interaction) {

    const [prefix, action, draftId] = interaction.customId.split(":");

    const input = new TextInputBuilder()
        .setCustomId("teamCreation:secondary-color")
        .setMaxLength(7)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Secondary Color. Ex: #FF00FF")
        .setRequired(false)
    
    const label = new LabelBuilder()
        .setLabel("Secondary Color")
        .setTextInputComponent(input)

    return new ModalBuilder()
        .setCustomId(`teamCreation:secondaryColorSubmit:${draftId}`)
        .setTitle("Set/Update Secondary Color")
        .setLabelComponents(label)
}

export function buildTeamCreationEmbed(teamDraft) {
    const embed = new EmbedBuilder()
        .setColor(teamDraft.primaryColor ?? "#FFFFFF")
        .setTitle("RML Team Creation")
        .setDescription("Create the RML Team below.\n Use the buttons below to change the values.")

        .addFields(
            {
                name: "Team Acronym",
                value: teamDraft.teamAcronym ?? "Not set.",
            },
            {
                name: "Team Name",
                value: teamDraft.teamName ?? "Not set.",
            },
            {
                name: "Team Manager",
                value: teamDraft.teamManager ? `<@${teamDraft.teamManager}>`: "Not set.",
            },
            {
                name: "Primary Color",
                value: teamDraft.primaryColor ?? "Not set.",
            },
            {
                name: "Secondary Color",
                value: teamDraft.secondaryColor ?? "Not set.",
            },
        )
    
    return embed;
}

export async function handleTeamCreationButtons(interaction) {

    const [prefix, action, draftId] = interaction.customId.split(":");
    const draft = teamDrafts.get(draftId);

    if (!draft) {
        return interaction.reply({
            content: "Form expired.",
            flags: MessageFlags.Ephemeral,
        });
    }

    if (interaction.user.id !== draft.ownerId) {
        return interaction.reply({
            content: "You aren't allowed to do this action.",
            flags: MessageFlags.Ephemeral,
        });
    }

    if (action === "teamAcronym") {
        await interaction.showModal(createTeamAcronymModal(interaction));
        return;
    }

    if (action === "teamName") {
        await interaction.showModal(createTeamNameModal(interaction));
        return;
    }

    if (action === "teamManager") {
        await interaction.showModal(createTeamManagerModal(interaction));
        return;
    }

    if (action === "primaryColor") {
        await interaction.showModal(createPrimaryColorModal(interaction));
        return;
    }

    if (action === "secondaryColor") {
        await interaction.showModal(createSecondaryColorModal(interaction));
        return;
    }
}

export async function handleTeamCreationModalSubmit(interaction) {

    const [prefix, action, draftId] = interaction.customId.split(":");
    const draft = teamDrafts.get(draftId);

    if (!draft) {
        return interaction.reply({
            content: "Form expired.",
            flags: MessageFlags.Ephemeral,
        });
    }

    if (interaction.user.id !== draft.ownerId) {
        return interaction.reply({
            content: "You aren't allowed to do this action.",
            flags: MessageFlags.Ephemeral,
        });
    }

    if (action === "teamAcronymSubmit") {
        const acronym = interaction.fields
            .getTextInputValue("teamCreation:team-acronym")
            .trim();
        
        if (acronym.length < 2 || acronym.length > 5) {
            return interaction.reply({
                content: "The team acronym must be 2-5 characters long.",
                flags: MessageFlags.Ephemeral,
            });
        }

        draft.teamAcronym = acronym;

        await interaction.update({
            embeds:[buildTeamCreationEmbed(draft)],
        });
    }

    if (action === "teamNameSubmit") {
        const name = interaction.fields
            .getTextInputValue("teamCreation:team-name")
            .trim();
        
        if (name.length <= 0 || name.length > 64) {
            return interaction.reply({
                content: "The team name must be 1-64 characters long.",
                flags: MessageFlags.Ephemeral,
            });
        }

        draft.teamName = name;

        await interaction.update({
            embeds:[buildTeamCreationEmbed(draft)],
        });
    }

    if (action === "teamManagerSubmit") {
        const user = interaction.fields
            .getSelectedUsers("teamCreation:team-manager", true);
        
        const manager = user.first();

        const managerId = await interaction.guild.members.fetch(manager.id);

        if (!managerId.roles.cache.has(registeredRoleId)) {
            return interaction.reply({
                content: "That member must register before managing a team.",
                flags: MessageFlags.Ephemeral,
            });
        }

        draft.teamManager = manager.id;

        await interaction.update({
            embeds:[buildTeamCreationEmbed(draft)],
        });
    }

    if (action === "primaryColorSubmit") {
        const primaryColor = interaction.fields
            .getTextInputValue("teamCreation:primary-color")
            .trim();
        
        if (primaryColor.length !== 7) {
            return interaction.reply({
                content: "The primary color must be 7 characters long (include the #).",
                flags: MessageFlags.Ephemeral,
            });
        }

        draft.primaryColor = primaryColor.toUpperCase();

        await interaction.update({
            embeds:[buildTeamCreationEmbed(draft)],
        });
    }

    if (action === "secondaryColorSubmit") {
        const secondaryColor = interaction.fields
            .getTextInputValue("teamCreation:secondary-color")
            .trim();
        
        if (secondaryColor.length !== 7 && secondaryColor.length !== 0) {
            return interaction.reply({
                content: "The secondary color must be 7 characters long (include the #).",
                flags: MessageFlags.Ephemeral,
            });
        }

        draft.secondaryColor = secondaryColor === "" ? null : secondaryColor.toUpperCase();

        await interaction.update({
            embeds:[buildTeamCreationEmbed(draft)],
        });
    }

}

export async function handleTeamCreationSubmitButtons(interaction) {

    const [prefix, action, draftId] = interaction.customId.split(":");
    const draft = teamDrafts.get(draftId);

    if (!draft) {
        return interaction.reply({
            content: "Form expired.",
            flags: MessageFlags.Ephemeral,
        });
    }

    if (interaction.user.id !== draft.ownerId) {
        return interaction.reply({
            content: "You aren't allowed to do this action.",
            flags: MessageFlags.Ephemeral,
        });
    }


    if (action === "cancel") {
        teamDrafts.delete(draftId);
        return interaction.update({
            content: "Team creation canceled.",
            embeds: [],
            components: [],
        });
    }

    if (action === "submit") {
        if (draft.submitting) {
            return interaction.reply({
                content: "This team is already being submitted.",
                flags: MessageFlags.Ephemeral,
            });
        }

        if (!draft.teamName || !draft.teamManager || !draft.primaryColor) {
            return interaction.reply({
                content: "Please set the required values (team name, manager, and primary color) first.",
                flags: MessageFlags.Ephemeral,
            });
        }

        if (interaction.user.id !== draft.ownerId) {
            return interaction.reply({
                content: "You aren't allowed to do this action.",
                flags: MessageFlags.Ephemeral,
            });
        }

        draft.submitting = true;
        await interaction.deferUpdate();

        const staffMember = await interaction.guild.members.fetch(draft.ownerId);

        if (!staffMember.roles.cache.has(staffRoleId) && !staffMember.roles.cache.has(adminRoleId)) {
            return interaction.followUp({
                content: "You are not staff/admin. Cease all actions.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const managerId = await interaction.guild.members.fetch(draft.teamManager);

        if (!managerId.roles.cache.has(registeredRoleId)) {
            draft.submitting = false;
            return interaction.followUp({
                content: "That member must register before managing a team.",
                flags: MessageFlags.Ephemeral,
            });            
        }

        let result;

        try {
            result = await createTeam(draft.ownerId, draft.teamName, draft.teamManager, draft.primaryColor, draft.teamAcronym ?? "RML", draft.secondaryColor);
        } catch (error) {
            console.error("Team creation API request failed: ", error);
            await interaction.followUp({
                content: "Team creation failed. Please contact Vibe.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (!result.ok) {
            let message = "Team creation is unavailable at this time. Please try again later.";

            if (result.status === 400) {
                message = result.data.error;
            }

            if (result.status === 404) {
                message = "Could not find the manager. Make sure they are registered.";
            }

            if (result.status === 409) {
                message = "That team name is already registered.";
            }

            if (result.status === 500) {
                message = "Something cause team creation to fail, contact Vibe to check.";
            }
            await interaction.followUp({content: message, flags: MessageFlags.Ephemeral,});
            return;
        }

        const team = result.data.team;

        let newTeamRole;
        
        try {

            const supportsGradients = interaction.guild.features.includes("ENHANCED_ROLE_COLORS");
            const colors = {
                primaryColor: team.team_primary_color,
            };

            if (supportsGradients && team.team_secondary_color !== null) {
                colors.secondaryColor = team_team_secondary_color;
            }

            newTeamRole = await interaction.guild.roles.create({
                name: `${team.team_acronym} | ${team.team_name}`,
                colors: colors,
                mentionable: true,
                reason: "Team creation inside RML.",
            });
        } catch (error) {
            console.error("Team discord role creation failed: ", error)
            await interaction.followUp({
                content: "Failed to complete role creation.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // Team Role creation and assignment
        try {

            await managerId.roles.add(managerRoleId);
            await managerId.roles.add(newTeamRole.id);

        } catch (error) {
            console.error("Team disord role creation/assignment failed: ", error);
            await interaction.followUp({
                content: "Failed to complete the role creation/assignment.",
                flags: MessageFlags.Ephemeral,
            });
        }

        // Team forum post creation
        let forumPost;

        try {
            const forumChannel = await interaction.client.channels.fetch(forumChannelId);

            forumPost = await forumChannel.threads.create({
                name: `${team.team_acronym} | ${team.team_name}`,
                reason: "Team creation automatic post.",
                message: {
                    content: [
                        "# General Info",
                        "",
                        `**Team ID:** ${team.team_id}`,
                        `**Team Ping:** <@&${newTeamRole.id}>`,
                        `**Team Manager:** <@${managerId.id}>`,
                        "**Team Assistant Managers:**",
                        "ASSISTANT MANAGERS GO HERE",
                        "",
                        "**Team Roster:**",
                        "ROSTER GOES HERE",
                        "",
                        "## Season History",
                        "HISTORY GOES HERE",
                        "",
                        "## Team Awards",
                        "TEAM AWARDS GO HERE",
                    ].join("\n"),
                    allowedMentions: {parse: []},
                },
            });
        } catch (error) {
            console.error("Error making team forum post: ", error);
            await interaction.followUp({
                content: "Failed to complete the forum creation.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // Commit the role and forum to Database

        let patchResult;
        try {
            patchResult = await patchRoleForumId(team.team_id, newTeamRole.id, forumPost.id)
        } catch (error) {
            console.log("Patching the Role and Forum failed: ", error);
            await interaction.followUp({
                content: "Patching the discord role and the forum failed.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (!patchResult.ok) {
            let message = "Something failed during the Role/Forum patching. Contact Vibe."
            if (patchResult.status === 400) {
                message = result.data.error;
            }

            if (patchResult.status === 404) {
                message = "Couldn't find the team. Contact Vibe.";
            }

            if (patchResult.status === 500) {
                message = "Something went wrong. Contact Vibe to check.";
            }

            await interaction.followUp({content: message, flags: MessageFlags.Ephemeral,});
            return;
        }

        await interaction.editReply({
            content: "Interaction is finished. Refer to any follow up messages for any errors.",
            embeds: [],
            components: [],
        });

        try {
            await publishTeamAudit(interaction.client, result.data.audit, patchResult.data.discord);
        } catch (error) {
            console.error("Audit send failed: ", error);
        }
        teamDrafts.delete(draftId);
    }
}