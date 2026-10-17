import {
    LabelBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} from "discord.js";
import {registerPlayer} from "../api/players.client.js";


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
        .setLabel("In-game name")
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
            console.log("Registration API request failed: ", error);

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

        const inGameName = interaction.fields.getTextInputValue("in-game-name");

        const result = await registerPlayer(interaction.user.id, inGameName);

        //API Handling etc
    }

}
