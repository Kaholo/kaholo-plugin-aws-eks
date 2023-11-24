const path = require("path");

const { TOKEN_REGEXP } = require("./consts");

function splitDirectory(directory) {
  return [
    path.dirname(directory),
    path.basename(directory),
  ];
}

// Make sure command isn't trying to overrride something parameterized
function sanitizeParameters(command, authenticationParamsMap) {
  const sanitizedParameters = new Map();

  authenticationParamsMap.forEach((value, key) => {
    if (!command.includes(key)) {
      sanitizedParameters.set(key, value);
    }
  });

  return sanitizedParameters;
}

function generateEnvironmentalVariableName(parameterName) {
  const regex = /-/g;

  let result = parameterName.replace(regex, "_");

  if (result.startsWith("_")) {
    result = result.substring(1);
  }

  if (result.startsWith("_")) {
    result = result.substring(1);
  }

  result = `$${result.toUpperCase()}`;

  return result;
}

function paramsMapToParamsWithEnvironmentalVariablesArray(paramsMap) {
  return Array.from(
    paramsMap,
    ([key]) => ([key, generateEnvironmentalVariableName(key)]),
  ).flat();
}

function paramsMapToEnvironmentalVariablesObject(paramsMap) {
  return Object.fromEntries(
    Array.from(
      paramsMap,
      ([key, value]) => ([generateEnvironmentalVariableName(key).substring(1), value]),
    ),
  );
}

// Helm Docker image has ENTRYPOINT ["helm"]
function sanitizeCommand(command) {
  return command.startsWith("helm")
    ? command.slice(4).trim()
    : command;
}

function redactTokenValue(str) {
  return str.replace(TOKEN_REGEXP, "$1redacted$3");
}

module.exports = {
  splitDirectory,
  sanitizeParameters,
  paramsMapToParamsWithEnvironmentalVariablesArray,
  paramsMapToEnvironmentalVariablesObject,
  sanitizeCommand,
  redactTokenValue,
};
