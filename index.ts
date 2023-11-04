#! /usr/bin/env bun

import { exit } from "process";

import {
  applyRotation,
  createConfig,
  deleteRotationFromJSON,
  doesConfigExist,
  doesRotationExists,
  doesTheUserWantToCreateANewConfig,
  doesTheUserWantsToDeleteRotationX,
  getEnv,
  getPathToConfig,
  loadRotation,
  printRotationNamesOrRotationContent,
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
  case "-a":
    // apply a safe
    const safeToBeApplied = argTwo;
    if (!safeToBeApplied) {
      console.error(
        "You need to provide a safe version to apply: setenv -a nameOfSafe"
      );
      exit();
    }
    const safe = await loadRotation(configName, safeToBeApplied);
    if (!safe) {
      console.error(
        `Safe "${safeToBeApplied}" does not exist and can therefore not be applied.`
      );
      exit();
    }
    await applyRotation(safe, envLocation);
    console.log("Set all variables successfully.");
    exit();
  case "-l":
    // list safes and their names:
    const nameOfRotation = argTwo;
    await printRotationNamesOrRotationContent(configName, nameOfRotation);
    exit();
  case "-ld":
    // delete rotation from safe
    const rotationToGetDeleted = argTwo;
    const saveExists = await doesRotationExists(
      configName,
      rotationToGetDeleted
    );
    if (!saveExists) {
      console.error(
        `Safe "${rotationToGetDeleted}" does not exist and can therefore not get deleted`
      );
      exit();
    }
    const userConfirmedDeletion = await doesTheUserWantsToDeleteRotationX(
      configName,
      rotationToGetDeleted
    );
    if (userConfirmedDeletion)
      await deleteRotationFromJSON(configName, rotationToGetDeleted);
    exit();
  case "-s":
    // save variables in current env as rotation
    const rotationName = argTwo;
    if (rotationName) {
      await saveRotationToJSON(
        config.rotatingVars,
        rotationName,
        configName,
        envLocation
      );
    } else {
      console.error(
        `You need to provide a second argument as name for the rotation: setenv -s nameOfRotation...`
      );
    }
    console.log(`Saved current rotation as "${rotationName}"`);
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
