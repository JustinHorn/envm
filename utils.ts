import { spawn } from "child_process";
import fs, { exists } from "fs";

const configurationDir = import.meta.dir + "/configurations";

export const getPathToConfig = (configName: string) => {
  return configurationDir + "/" + configName;
};

export const getPathToJSON = (configName: string) => {
  return getPathToConfig(configName) + ".SAFE.json";
};

const checkConfigDirExistence = () => {
  if (!fs.existsSync(configurationDir)) {
    fs.mkdirSync(configurationDir, { recursive: true });
  }
};

export const createConfig = async (configName: string) => {
  checkConfigDirExistence();
  const file = Bun.file(getPathToConfig(configName));
  const defaultConfigContent = "envLocation=.\nrotatingVars=\n";
  await Bun.write(file, defaultConfigContent);
};

export type Config = {
  envLocation: string;
  rotatingVars: string[];
};

export const doesConfigExist = async (configName: string) => {
  const pathToConfig = getPathToConfig(configName);
  const config = Bun.file(pathToConfig);
  return await config.exists();
};

export const loadConfig = async (configName: string) => {
  const pathToConfig = getPathToConfig(configName);
  const config = Bun.file(pathToConfig);
  if (!(await config.exists())) {
    throw Error(`Config with name ${configName}, does not exist`);
  }
  const text = await config.text();
  const keyValuePairs = text.split("\n");
  if (keyValuePairs.length !== 3) {
    throw Error("Wrong number of config options in .env!");
  }

  // TODO give this proper error handling PLEASE!!!!
  const pairs = keyValuePairs.reduce(
    (p, c, i) => ({ ...p, [c.split("=")[0]]: c.split("=")[1] }),
    {}
  ) as { rotatingVars: string; envLocation: string };

  const rotatingVars = pairs.rotatingVars ? pairs.rotatingVars.split(",") : [];
  return { ...pairs, rotatingVars } as Config;
};

export const openConfigWithNano = async (configName: string) => {
  checkConfigDirExistence();
  const pathToConfig = getPathToConfig(configName);
  if (!(await Bun.file(pathToConfig).exists())) {
    createConfig(configName);
  }

  var nano = spawn("nano", [pathToConfig], {
    stdio: "inherit",
    detached: true,
  });

  nano.on("error", (err) => {
    console.error("Failed to start nano: ");
    console.error(err);
  });

  nano.on("data", function (data: any) {
    process.stdout.pipe(data);
  });
  await new Promise((resolve) => {
    nano.on("close", resolve);
  });
};

export const getEnv = async (variableName: string, envPath: string) => {
  variableName += "=";
  const file = Bun.file(envPath);
  const text = await file.text();

  const index = text.indexOf(variableName);
  const newLineIndex = text.indexOf("\n", index + variableName.length);

  return text.slice(index + variableName.length, newLineIndex);
};

export const printEnvToConsole = async (envPath: string) => {
  const file = Bun.file(envPath);
  const text = await file.text();
  console.log(`.env at location "${envPath}":`);
  console.log(text);
};

export const saveRotationToJSON = async (
  rotatingVars: string[],
  nameOfRotation: string,
  configName: string,
  envLocation: string
) => {
  const envFile = Bun.file(envLocation);
  const envContent = await envFile.text();
  const lines = envContent.split("\n");
  const keyValuePairs = lines.map((l) => l.split("="));
  const envAsJSON = keyValuePairs.reduce(
    (p, c, i) => ({ ...p, [c[0]]: c[1] }),
    {}
  ) as { [key: string]: string };
  let rotation = {};
  if (rotatingVars.length) {
    rotation = rotatingVars
      .map((vName) => ({ [vName]: envAsJSON[vName] }))
      .reduce((p, c) => ({ ...p, ...c }), {});
  } else {
    rotation = envAsJSON;
  }
  const pathToSafeJSON = getPathToJSON(configName);
  const safeJSONFile = Bun.file(pathToSafeJSON);
  let safeJSON = {};
  if (await safeJSONFile.exists()) {
    const safeJSONContent = await safeJSONFile.text();
    safeJSON = JSON.parse(safeJSONContent);
  }
  const newSafeJSON = { ...safeJSON, [nameOfRotation]: rotation };
  const newSafeJSONString = JSON.stringify(newSafeJSON);
  await Bun.write(safeJSONFile, newSafeJSONString);
};

export const doesTheUserWantToCreateANewConfig = async (): Promise<boolean> => {
  console.log(
    "No setenv config exists in the scope of this directory. Shall a new one at this location get created? (Y/N)"
  );
  for await (const line of console) {
    const argument = line.trim();
    switch (argument) {
      case "Y":
        return true;
      case "N":
        return false;
      default:
        console.log(
          "You need to enter Y or N. Shall a new setenv config be created? (Y/N)"
        );
    }
  }
  throw Error("Error reading user input");
};

export const printRotationNamesOrRotationContent = async (
  configName: string,
  nameOfRotation?: string
) => {
  const pathToJSON = getPathToJSON(configName);
  const jsonFile = Bun.file(pathToJSON);
  if (!(await jsonFile.exists())) {
    console.warn("No safes of rotations for config of current dir exists");
    return;
  }
  const jsonContent = await jsonFile.text();
  const json = JSON.parse(jsonContent);
  if (typeof json === "object" && json !== null) {
    if (!nameOfRotation) {
      const keys = Object.keys(json);
      keys.forEach((k) => console.log(k));
    } else {
      const rotation = json[nameOfRotation];
      if (rotation) {
        const keys = Object.keys(rotation);
        keys.forEach((k) => console.log(`${k}=${rotation[k]}`));
      } else {
        console.error(`No rotation with the name "${nameOfRotation}" exists`);
      }
    }
  }
};

export const doesTheUserWantsToDeleteRotationX = async (
  configName: string,
  nameOfRotation: string
): Promise<boolean> => {
  console.log(
    `Are you sure that you want to delete the rotation "${nameOfRotation}"?\nIt contains:`
  );
  await printRotationNamesOrRotationContent(configName, nameOfRotation);
  console.log("-------");
  console.log("If yes enter Y or else N");
  for await (const line of console) {
    const argument = line.trim();
    switch (argument) {
      case "Y":
        return true;
      case "N":
        return false;
      default:
        console.log(
          `You need to enter Y or N. Shall the rotation "${nameOfRotation}" get deleted? (Y/N)`
        );
    }
  }
  throw Error("Error reading user input");
};

export const doesRotationExists = async (
  configName: string,
  nameOfRotation: string
) => {
  const pathToJSON = getPathToJSON(configName);
  const jsonFile = Bun.file(pathToJSON);
  if (!(await jsonFile.exists())) {
    console.warn("No safes of rotations for config of current dir exist");
    return false;
  }
  const jsonContent = await jsonFile.text();
  const json = JSON.parse(jsonContent);
  if (typeof json === "object" && json !== null) {
    const rotation = json[nameOfRotation];
    if (rotation) {
      return true;
    }
  }
  return false;
};

export const deleteRotationFromJSON = async (
  configName: string,
  nameOfRotation: string
) => {
  const pathToSafeJSON = getPathToJSON(configName);
  const safeJSONFile = Bun.file(pathToSafeJSON);
  let safeJSON = {};
  if (await safeJSONFile.exists()) {
    const safeJSONContent = await safeJSONFile.text();
    safeJSON = JSON.parse(safeJSONContent);
  }
  const newSafeJSON = { ...safeJSON, [nameOfRotation]: undefined };
  const newSafeJSONString = JSON.stringify(newSafeJSON);
  await Bun.write(safeJSONFile, newSafeJSONString);
  console.log(`Deleted rotation "${nameOfRotation}"`);
};

export const loadRotation = async (
  configName: string,
  rotationName: string
): Promise<{ [key: string]: string } | false> => {
  const pathToJSON = getPathToJSON(configName);
  const jsonFile = Bun.file(pathToJSON);
  if (!(await jsonFile.exists())) {
    throw Error("No safes for config of current dir exists");
  }
  const jsonContent = await jsonFile.text();
  const json = JSON.parse(jsonContent);
  if (typeof json === "object" && json !== null) {
    const rotation = json[rotationName];
    if (rotation) {
      return rotation;
    } else {
      return false;
    }
  }
  return false;
};

export const applyRotation = async (
  rotation: { [key: string]: string },
  envLocation: string
) => {
  const keys = Object.keys(rotation);
  for (const key of keys) {
    await setEnv(key, rotation[key], envLocation);
  }
};

const setEnv = async (
  variableName: string,
  variableValue: string,
  envLocation: string
) => {
  variableName += "=";
  const file = Bun.file(envLocation);
  const text = await file.text();

  let newFileText = "";

  const index = text.indexOf(variableName);

  if (index !== -1) {
    // if variable already exists
    const newLineIndex = text.indexOf("\n", index + variableName.length);
    newFileText =
      text.slice(0, index + variableName.length) +
      variableValue +
      text.slice(newLineIndex);
  } else {
    newFileText = variableName + variableValue + "\n" + text;
  }

  Bun.write(file, newFileText);
  console.log(`Set variable ${variableName} successfully`);
};
