import { spawn } from "child_process";
import fs from "fs";

const configurationDir = import.meta.dir + "/configurations";

export const getPathToConfig = (configName: string) => {
  return configurationDir + "/" + configName;
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
  nameOfSave: string,
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
  let savedValuesJSON = {};
  if (rotatingVars.length) {
    savedValuesJSON = {
      ...rotatingVars.map((vName) => ({ [vName]: envAsJSON[vName] })),
    };
  } else {
    savedValuesJSON = envAsJSON;
  }
  const pathToConfig = getPathToConfig(configName);
  const pathToSaveJSON = pathToConfig + ".SAVE.json";
  const saveJSONFile = Bun.file(pathToSaveJSON);
  let saveJSON = {};
  if (await saveJSONFile.exists()) {
    const saveJSONContent = await saveJSONFile.text();
    saveJSON = JSON.parse(saveJSONContent);
  }
  const newSAVEJSON = { ...saveJSON, [nameOfSave]: savedValuesJSON };
  const newSaveJSONString = JSON.stringify(newSAVEJSON);
  await Bun.write(saveJSONFile, newSaveJSONString);
};