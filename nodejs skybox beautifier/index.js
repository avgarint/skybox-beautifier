#!/usr/bin/env mode
import chalk from "chalk";
import inquirer from "inquirer";
import gradient from "gradient-string";
import chalkAnimation from "chalk-animation";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import sharp from "sharp";

const indexToFaceName = {
    0: "Left",
    1: "Front",
    2: "Right",
    3: "Back",
    4: "Top",
    5: "Bottom"
};

const layouts = [
    "Top/Up face above front face and bottom/down face below front face",
    "Top/up face above right face and bottom/down face below right face"
];

/**
 * Sleeps for ms miliseconds (default is 2000).
 * @param {number} ms
 * @returns
 */
const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

/**
 * Show the welcome messages.
 */
async function welcome() {
    figlet("Skybox Beautifier", (err, data) => {
        if(err) {
            console.log(err);
            return;
        }

        console.log(gradient.pastel.multiline(data));
    });

    await sleep();

    const welcomeMessage = chalkAnimation.rainbow(
        "Hello, I'm here to help you convert a skybox texture to multiple faces!"
    );

    welcomeMessage.start();
        
    await sleep();

    welcomeMessage.stop();
}

/**
 * Asks the user to enter the texture path.
 * @returns path
 */
async function askPath() {
    const prompt = await inquirer.prompt({
        name: "path",
        type: "input",
        message: "Select the texture path:"
    });

    return prompt.path;
}

/**
 * Asks the user to enter the face size.
 * @returns faceSize
 */
async function askFaceSize() {
    const prompt = await inquirer.prompt({
        name: "face_size",
        type: "number",
        message: "Select face size:"
    });

    return prompt.face_size;
}

/**
 * Asks the user to enter the save path.
 * @returns savePath
 */
async function askSavePath() {
    const prompt =  await inquirer.prompt({
        name: "save_directory",
        type: "input",
        message: "Select the save directory:"
    });

    return prompt.save_directory;
}

/**
 * Asks the user to enter the layout.
 * @returns layout
 */
async function askLayout() {
    const prompt = await inquirer.prompt({
        name: "layout",
        type: "list",
        message: "Select the texture layout:",
        choices: layouts
    });

    return prompt.layout;
}

/**
 * Asks the user to confirm parameters.
 * @returns confirmation
 */
async function askConfirmation(data) {
    printParameters(data);

    const prompt = await inquirer.prompt({
        name: "confirmation",
        type: "confirm",
        message: "Confirm all parameters are correct?",
    });

    return prompt.confirmation;
}

/**
 * Logs the parameters to the console with beautiful formatting.
 * @param {object} parameters 
 */
function printParameters(parameters) {
    console.log(
        chalk.bgCyanBright("Processing image with following parameters:")
    );

    for (const [key, value] of Object.entries(parameters)) {
        console.log(chalk.bgCyanBright(`• ${key}: ${value}`));
    }
}

/**
 * Returns the appropriate obejct depending of ``layout``.
 * @param {number} faceSize 
 * @param {string} layout 
 * @returns 
 */
function layoutToOptions(faceSize, layout) {
    const base = { width: faceSize, height: faceSize };

    switch(layout) {
        case layouts[0]:
            return [
                { ...base, left: 0, top: faceSize },            // Left
                { ...base, left: faceSize, top: faceSize },     // Front
                { ...base, left: faceSize * 2, top: faceSize }, // Right
                { ...base, left: faceSize * 3, top: faceSize }, // Back
                { ...base, left: faceSize, top: 0 },            // Top/up
                { ...base, left: faceSize, top: faceSize * 2 }, // Bottom/down
            ];
        
        case layouts[1]:
            return [
                { ...base, left: 0, top: faceSize },                // Left
                { ...base, left: faceSize, top: faceSize },         // Front
                { ...base, left: faceSize * 2, top: faceSize },     // Right
                { ...base, left: faceSize * 3, top: faceSize },     // Back
                { ...base, left: faceSize * 2, top: 0 },            // Top/up
                { ...base, left: faceSize * 2, top: faceSize * 2 }, // Bottom/down
            ];

        default:
            break;
    }
}

/**
 * Skybox editing code that extracts smaller faces from 
 * the main image.
 * @param {object} data
 */
async function processTexture(data) {
    const spinner = createSpinner("Processing, do not interrupt...").start();
    const options = layoutToOptions(data.faceSize, data.layout);

    await sleep();

    const start = Date.now();

    for(let i = 0; i < options.length; i++) {
        const fileName = `${data.savePath}\\${indexToFaceName[i]}.png`;

        sharp(data.path).extract(options[i]).toFile(fileName)
            .then(() => {
                const end = Date.now();
                spinner.success({ text: `Success! Saved image faces at ${data.savePath}` });
                console.log(chalk.blueBright(`Process took ${end - start} ms`));
                process.exit(0);
            })
            .catch((err) => {
                spinner.error({ text: "Failed to process skybox!" });
                console.log(err);
                process.exit(1);
            }
        );
    }
}

console.clear();

await welcome();

const data = {
    path:     await askPath(),
    faceSize: await askFaceSize(),
    savePath: await askSavePath(), 
    layout:   await askLayout()
};

askConfirmation(data).then((confirmation) => {
    if(confirmation) {
        processTexture(data);
    } else {
        console.log(chalk.bgCyan("Aborting process..."));
        process.exit(1);
    }
});