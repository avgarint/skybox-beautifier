#!/usr/bin/env mode

import chalk from "chalk";
import inquirer from "inquirer";
import gradient from "gradient-string";
import chalkAnimation from "chalk-animation";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import sharp from "sharp";

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

async function askPath() {
    const prompt = await inquirer.prompt({
        name: "path",
        type: "input",
        message: "Select the texture path:"
    });

    return prompt.path;
}

async function askFaceSize() {
    const prompt = await inquirer.prompt({
        name: "face_size",
        type: "number",
        message: "Select face size:"
    });

    return prompt.face_size;
}

async function askSavePath() {
    const prompt =  await inquirer.prompt({
        name: "save_directory",
        type: "input",
        message: "Select the save directory:"
    });

    return prompt.save_directory;
}

async function askLayout() {
    const prompt = await inquirer.prompt({
        name: "layout",
        type: "list",
        message: "Select the texture layout:",
        choices: [
            "Top/Up face above front face and bottom/down face below front face",
            "Top/up face above right face and bottom/down face below right face",
        ],
    });

    return prompt.layout;
}

async function askConfirmation() {
    const prompt = await inquirer.prompt({
        name: "confirmation",
        type: "confirm",
        message: "Confirm all parameters are correct?",
    });

    return prompt.confirmation;
}

/**
 * Skybox editing code that extracts smaller faces from 
 * the main image.
 * @param {string} path
 * @param {string} faceSize
 * @param {string} savePath
 * @param {string} layout
 */
async function processSkyboxTexture(path, faceSize, savePath, layout) {
    printParameters(path, faceSize, savePath, layout);

    await askConfirmation().then((confirmation) => {
        if(confirmation === false) {
            console.log(chalk.bgCyan("Aborting process..."));
            process.exit(1);
        }
    });

    const spinner = createSpinner("Processing, do not interrupt...").start();

    await sleep();

    let otpions = [
        {width: faceSize, height: faceSize, left: 0, top: faceSize},            // Left
        {width: faceSize, height: faceSize, left: faceSize, top: faceSize},     // Front
        {width: faceSize, height: faceSize, left: faceSize * 2, top: faceSize}, // Top
        {width: faceSize, height: faceSize, left: faceSize * 3, top: faceSize}, // Back
        {width: faceSize, height: faceSize, left: faceSize, top: 0},            // Top
        {width: faceSize, height: faceSize, left: faceSize, top: faceSize * 2}, // Bottom
    ];

    for(let i = 0; i < otpions.length; i++) {    
        sharp(path).extract(otpions[i]).toFile(`${savePath}\\${i}.png`)
            .then(() => {
                spinner.success({text: `Success! Saved image faces at ${savePath}`});
                process.exit(0);
            })
            .catch((err) => {
                spinner.error({text: "Failed to process skybox!"});
                process.exit(1);
            }
        );
    }
}

/**
 * Logs the parameters to the console with beautiful formatting.
 * @param {string} path 
 * @param {string} savePath 
 * @param {number} faceSize 
 * @param {string} layout 
 */
function printParameters(path, savePath, faceSize, layout) {
    console.log(chalk.bgCyanBright("Processing image with following parameters:"));
    console.log(chalk.bgBlueBright(`• Path: ${path}`));
    console.log(chalk.bgBlueBright(`• Face size: ${faceSize}`));
    console.log(chalk.bgBlueBright(`• Save directory : ${savePath}`));
    console.log(chalk.bgBlueBright(`• Layout: ${layout}`));
}

console.clear();

await welcome();

processSkyboxTexture(
    await askPath(), 
    await askFaceSize(), 
    await askSavePath(), 
    await askLayout()
);