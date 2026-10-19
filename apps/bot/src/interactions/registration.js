import {
    LabelBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} from "discord.js";
import {registerPlayer, updateIgn} from "../api/players.client.js";


const registeredRoleId = process.env.REGISTERED_ROLE_ID;

if (!registeredRoleId) {
  throw new Error("REGISTERED_ROLE_ID is required.");
}

function createRegistrationModal() {
    const input = new TextInputBuilder()
        .setCustomId("in-game-name")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Your current REMATCH display name.")
        .setRequired(true)
    
    const label = new LabelBuilder()
        .setLabel("In-game name")
        .setTextInputComponent(input)
    
    return new ModalBuilder()
        .setCustomId("registration:submit")
        .setTitle("Register for RML")
        .addLabelComponents(label)
}

function createUpdateIgnModal() {
    const input = new TextInputBuilder()
        .setCustomId("update-ign")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Your updated REMATCH display name.")
        .setRequired(true)
    
    const label = new LabelBuilder()
        .setLabel("IGN")
        .setTextInputComponent(input)
    
    return new ModalBuilder()
        .setCustomId("registration:update")
        .setTitle("Update your IGN")
        .addLabelComponents(label)
}

export async function handleRegistrationButtons(interaction) {
    if (interaction.customId === "registration:register") {
        await interaction.showModal(createRegistrationModal());
        return;
    }

    if (interaction.customId === "registration:updateIGN") {
        await interaction.showModal(createUpdateIgnModal());
        return;
    }
}

export async function handleRegistrationModalSubmit(interaction) {
    if (interaction.customId === "registration:submit") {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral,
        });

        const inGameName = interaction.fields.getTextInputValue("in-game-name");

        let result;
        
        try {
            result = await registerPlayer(interaction.user.id, inGameName);
        } catch (error) {
            console.error("Registration API request failed: ", error);

            await interaction.editReply({
                content: "I couldn't confirm your registration. " +
                "It may have completed, please contact staff before retrying.",
            });
            return;
        }

        if (!result.ok) {
            let message = "Registration is unavailable at this time. Please try again later.";

            if (result.status === 400) {
            message = result.data.error;
            }

            if (result.status === 409) {
                message = 
                "Your Discord account or that IGN is already registered. " + 
                "If you need your Registered role restored, contact staff.";
            }

            await interaction.editReply({content: message});
            return;
        }

        try {

            const member = await interaction.guild.members.fetch(interaction.user.id);

            await member.roles.add(
                registeredRoleId,
                "Player registered successfully through the RML API."
            );

            await member.setNickname(
                result.data.player.in_game_name,
                "Set nickname to registered RML IGN"
            );

        } catch (error) {
            console.error("Registered role assignment failed: ", error);

            await interaction.editReply({
                content: 
                "You are registered, but I couldn't finish assigning your role " +
                "or updating your nickname. Please contact staff; " + 
                "you don't need to register again.",
            });
            return;
        }
        
        await interaction.editReply({
            content: "You are registered! Your Registered role has been assigned, and nickname updated.",
        });
    }

    if (interaction.customId === "registration:update") {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral,
        });

        const inGameName = interaction.fields.getTextInputValue("update-ign");

        let result;

        try {
            result = await updateIgn(interaction.user.id, inGameName);
        } catch (error) {
            console.error("Update IGN API request failed: ", error);

            await interaction.editReply({
                content: "I couldn't confirm your name update. " +
                "It may have completed, please contact staff before retrying.",
            });
            return;
        }

        if (!result.ok) {
            let message = "IGN updating is unavailable at this time. Please try again later.";

            if (result.status === 400) {
                message = result.data.error;
            }

            if (result.status === 404) {
                message = "You are not registered with RML! Please use the Register button.";
            }
            
            if (result.status === 409) {
                if (result.data.code === "IGN_COOLDOWN") {
                    const allowedUpdateIgn = new Date(result.data.nextAllowedAt);
                    const updateTimestamp = Math.floor(allowedUpdateIgn.getTime() / 1000);
                    message = `You can't update your IGN until <t:${updateTimestamp}:R>`;
                } else {
                message = "That IGN is already registered. ";
                }
            }

            await interaction.editReply({content: message});
            return;
        }

        try {

            const member = await interaction.guild.members.fetch(interaction.user.id);

            await member.setNickname(
                result.player.in_game_name,
                "Updated nickname to registered RML IGN"
            );

        } catch (error) {
            console.error("Updating name request failed: ", error);

            await interaction.editReply({
                content: 
                "Your name got updated, but I couldn't finish " +
                "updating your nickname. Please contact staff; " + 
                "you don't need to try again.",
            });
            return;
        }
        
        await interaction.editReply({
            content: "Your name has been updated, and your display name synced!",
        });
    }

}
