#! /usr/bin/env bun

import { spawn } from "child_process";
// let jsonSave: { exit } = require("./save.json") as {
//   [key: string]: string;
// };

import { exit } from "process";

import {
  createConfig,
  deleteRotationFromJSON,
  doesConfigExist,
  doesSafeExists,
  doesTheUserWantToCreateANewConfig,
  doesTheUserWantsToDeleteASpecificSafe,
  getEnv,
  getPathToConfig,
  printSafesToConsole,
  saveRotationToJSON,
} from "./utils";
import { loadConfig, openConfigWithNano, printEnvToConsole } from "./utils";

const originalConfigName = process.env.PWD?.replaceAll("/", ".");
let configName = originalConfigName;
let configOffset = "";
if (!configName || !originalConfigName) {
  console.error("Could not retrieve current directory location");
  exit();
}

let configExists = await doesConfigExist(configName);

// go up the directories and check for config existence
while (!configExists && configName.split(".").length >= 2) {
  configOffset += "../";
  configName = configName!.split(".").slice(0, -1).join(".");
  configExists = await doesConfigExist(configName);
}

if (!configExists) {
  const wantNewConfig = await doesTheUserWantToCreateANewConfig();
  if (!wantNewConfig) exit();
  // we could not find a config so create one
  configName = originalConfigName;
  await createConfig(configName);
  await openConfigWithNano(configName);
}
const config = await loadConfig(configName);
const argOne = Bun.argv[2];
const argTwo = Bun.argv[3];

const envLocation = configOffset + config.envLocation;

switch (argOne) {
  case "-l":
    // list saves and their names:
    const safeToList = argTwo;
    await printSafesToConsole(configName, safeToList);
    exit();
  case "-ld":
    // delete from save
    const safeToGetDeleted = argTwo;
    const saveExists = await doesSafeExists(configName, safeToGetDeleted);
    if (!saveExists) {
      console.error(
        `Safe "${safeToGetDeleted}" does not exist and can therefore not get deleted`
      );
      exit();
    }
    const userConfirmedDeletion = await doesTheUserWantsToDeleteASpecificSafe(
      configName,
      safeToGetDeleted
    );
    if (userConfirmedDeletion)
      await deleteRotationFromJSON(configName, safeToGetDeleted);
    exit();
  case "-s":
    // save variables in current env as rotation
    const saveName = argTwo;
    if (saveName) {
      await saveRotationToJSON(
        config.rotatingVars,
        saveName,
        configName,
        envLocation
      );
    } else {
      console.error(
        `You need to provide a second argument as name for the save: setenv -s nameOfSave...`
      );
    }
    exit();
  case "-g":
    // get variables in current env
    const nameOfVariable = argTwo;
    if (!argTwo) {
      await printEnvToConsole(envLocation);
    } else {
      console.log(await getEnv(nameOfVariable, envLocation));
    }
    exit();
  case "-o":
    await openConfigWithNano(configName);
  default:
    exit();
}

// const saveToJson = async (valueOne: string, valueTwo: string) => {
//   const file = Bun.file(import.meta.dir + "/save.json");
//   jsonSave = { ...jsonSave, [valueOne]: valueTwo };

//   await Bun.write(file, JSON.stringify(jsonSave));
// };

// const setEnv = async (variableName: string, variableValue: string) => {
//   variableName += "=";
//   const file = Bun.file(path);
//   const text = await file.text();

//   let newFileText = "";

//   const index = text.indexOf(variableName);

//   if (index !== -1) {
//     // if variable already exists
//     const newLineIndex = text.indexOf("\n", index + variableName.length);
//     newFileText =
//       text.slice(0, index + variableName.length) +
//       variableValue +
//       text.slice(newLineIndex);
//   } else {
//     newFileText = variableName + variableValue + "\n" + text;
//   }

//   Bun.write(file, newFileText);
//   console.log(`Set variable ${variableName} successfully`);
// };

// const removeEnv = async (variableName: string) => {
//   const variableNameMatcher = variableName + "=";
//   const file = Bun.file(path);
//   const text = await file.text();

//   let newFileText = "";

//   const index = text.indexOf(variableNameMatcher);

//   if (index === -1) {
//     console.error(
//       `variable with name "${variableName}" does not exist in .env`
//     );
//     exit();
//   } else {
//     const nextNewLineAfterVariable = text.indexOf("\n", index);
//     if (nextNewLineAfterVariable === -1) {
//       newFileText = text.slice(0, index);
//     } else {
//       newFileText =
//         text.slice(0, index) + text.slice(nextNewLineAfterVariable + 1);
//     }
//   }

//   await Bun.write(file, newFileText);
//   console.log(`Removed variable ${variableName} successfully`);
// };

// const firstParam = Bun.argv[2];
// const secondParam = Bun.argv[3];

// const removeVariable = firstParam === "-r";
// const printVariable = firstParam === "-g";
// const getDictionary = firstParam === "-d";
// const setEnvDictionarStyle = getDictionary && !isNaN(parseInt(secondParam));
// const saveCurrentVariables = firstParam === "-s";

// if (setEnvDictionarStyle) {
//   const index = parseInt(secondParam);
//   const url = Object.keys(jsonSave)[index];
//   const access_token = jsonSave[url];
//   await setEnv(URL_NAME, url);
//   await setEnv(ACCESS_NAME, access_token);

//   exit();
// }

// if (getDictionary) {
//   console.log(
//     Object.keys(jsonSave).reduce(
//       (p, c, i) => p + (i === 0 ? "" : "\n") + i + ": " + c,
//       ""
//     )
//   );
//   exit();
// }

// if (saveCurrentVariables) {
//   const v1 = await getEnv(URL_NAME);
//   const v2 = await getEnv(ACCESS_NAME);

//   await saveToJson(v1, v2);
//   console.log("Save is now:");
//   console.log(jsonSave);
//   exit();
// }

// if (printVariable) {
//   const value = await getEnv("VITE_ACROLINX_ONE_URL");
//   console.log(value);
//   exit();
// }

// if (!firstParam) {
//   console.error("No variable name given!");
//   exit();
// }

// if (!secondParam) {
//   console.error("No variable value given!");
//   exit();
// }

// if (removeVariable) {
//   removeEnv(secondParam);
// } else {
//   setEnv(firstParam, secondParam);
// }
