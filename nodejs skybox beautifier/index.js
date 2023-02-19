#!/usr/bin/env mode
import chalk from "chalk";
import inquirer from "inquirer";
import gradient from "gradient-string";
import chalkAnimation from "chalk-animation";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import sharp from "sharp";
import path from "path";

const indexToFaceName = {
  0: "Left",
  1: "Front",
  2: "Right",
  3: "Back",
  4: "Top",
  5: "Bottom"
};

const layouts = {
  "Top/Up face above front face and bottom/down face below front face": [
    { left: 0, top: 1 },
    { left: 1, top: 1 },
    { left: 2, top: 1 },
    { left: 3, top: 1 },
    { left: 1, top: 0 },
    { left: 1, top: 2 },
  ],
  "Top/up face above right face and bottom/down face below right face": [
    { left: 0, top: 1 },
    { left: 1, top: 1 },
    { left: 2, top: 1 },
    { left: 3, top: 1 },
    { left: 2, top: 0 },
    { left: 2, top: 2 },
  ]
};

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
    choices: Object.keys(layouts)
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
  if (typeof parameters !== 'object' || parameters === null) {
    console.error('Invalid input parameter. Expected an object.');
    return;
  }

  console.log(chalk.bgCyanBright('Processing image with following parameters:'));

  Object.keys(parameters).forEach((key) => {
    console.log(chalk.bgCyanBright(`• ${key}: ${parameters[key]}`));
  });
}

/**
 * Returns the appropriate obejct depending of ``layout``.
 * @param {number} faceSize 
 * @param {string} layout 
 * @returns 
 */
function layoutToOptions(faceSize, layout) {
  const options = layouts[layout];
  const base = { width: faceSize, height: faceSize };

  return options.map(({ left, top }) => ({ ...base, left: left * faceSize, top: top * faceSize }));
}

/**
 * Skybox editing code that extracts smaller faces from 
 * the main image.
 * @param {object} data
 */
async function processTexture(data) {
  const spinner = createSpinner("Processing, do not interrupt...").start();
  const options = layoutToOptions(data.faceSize, data.layout);

  try {
    await sleep();

    const start = Date.now();

    await Promise.all(options.map(async (option, i) => {
      const fileName = path.join(data.savePath, `${indexToFaceName[i]}.png`);

      await sharp(data.path).extract(option).toFile(fileName);
    }));

    const end = Date.now();
    spinner.success({ text: `Success! Saved image faces at ${data.savePath}` });
    console.log(chalk.blueBright(`Process took ${end - start} ms`));
  } catch(err) {
    spinner.error({ text: "Failed to process skybox!" });
    console.log(err);
    throw err;
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