#! /usr/bin/env bun
import { exit } from "process";

const path = "/Users/justinhorn/Code/test/testdir/folder/deeperFolder/.env";

const variableName = Bun.argv[2];
const newVariableValue = Bun.argv[3];

const removeVariable = variableName === "-r";

if (!variableName) {
  console.error("No variable name given!");
  exit();
}

if (!newVariableValue) {
  console.error("No variable value given!");
  exit();
}

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
  console.log("Set variable successfully");
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
  console.log("Removed variable successfully");
};

if (removeVariable) {
  removeEnv(newVariableValue);
} else {
  setEnv(variableName, newVariableValue);
}
