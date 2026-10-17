import {
    LabelBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";

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