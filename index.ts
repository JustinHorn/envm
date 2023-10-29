#! /usr/bin/env bun
import { exit } from "process";

let jsonSave: { [key: string]: string } = require("./save.json") as {
  [key: string]: string;
};

const getEnv = async (variableName: string) => {
  variableName += "=";
  const file = Bun.file(path);
  const text = await file.text();

  const index = text.indexOf(variableName);
  const newLineIndex = text.indexOf("\n", index + variableName.length);

  return text.slice(index + variableName.length, newLineIndex);
};

const saveToJson = async (valueOne: string, valueTwo: string) => {
  const file = Bun.file(import.meta.dir + "/save.json");
  jsonSave = { ...jsonSave, [valueOne]: valueTwo };

  await Bun.write(file, JSON.stringify(jsonSave));
};

const setEnv = async (variableName: string, variableValue: string) => {
  variableName += "=";
  const file = Bun.file(path);
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

const removeEnv = async (variableName: string) => {
  const variableNameMatcher = variableName + "=";
  const file = Bun.file(path);
  const text = await file.text();

  let newFileText = "";

  const index = text.indexOf(variableNameMatcher);

  if (index === -1) {
    console.error(
      `variable with name "${variableName}" does not exist in .env`
    );
    exit();
  } else {
    const nextNewLineAfterVariable = text.indexOf("\n", index);
    if (nextNewLineAfterVariable === -1) {
      newFileText = text.slice(0, index);
    } else {
      newFileText =
        text.slice(0, index) + text.slice(nextNewLineAfterVariable + 1);
    }
  }

  await Bun.write(file, newFileText);
  console.log(`Removed variable ${variableName} successfully`);
};

const firstParam = Bun.argv[2];
const secondParam = Bun.argv[3];

const removeVariable = firstParam === "-r";
const printVariable = firstParam === "-g";
const getDictionary = firstParam === "-d";
const setEnvDictionarStyle = getDictionary && !isNaN(parseInt(secondParam));
const saveCurrentVariables = firstParam === "-s";

if (setEnvDictionarStyle) {
  const index = parseInt(secondParam);
  const url = Object.keys(jsonSave)[index];
  const access_token = jsonSave[url];
  await setEnv(URL_NAME, url);
  await setEnv(ACCESS_NAME, access_token);

  exit();
}

if (getDictionary) {
  console.log(
    Object.keys(jsonSave).reduce(
      (p, c, i) => p + (i === 0 ? "" : "\n") + i + ": " + c,
      ""
    )
  );
  exit();
}

if (saveCurrentVariables) {
  const v1 = await getEnv(URL_NAME);
  const v2 = await getEnv(ACCESS_NAME);

  await saveToJson(v1, v2);
  console.log("Save is now:");
  console.log(jsonSave);
  exit();
}

if (printVariable) {
  const value = await getEnv("VITE_ACROLINX_ONE_URL");
  console.log(value);
  exit();
}

if (!firstParam) {
  console.error("No variable name given!");
  exit();
}

if (!secondParam) {
  console.error("No variable value given!");
  exit();
}

if (removeVariable) {
  removeEnv(secondParam);
} else {
  setEnv(firstParam, secondParam);
}
