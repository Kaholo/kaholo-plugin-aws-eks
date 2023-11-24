const {
  docker,
  helpers,
} = require("@kaholo/plugin-library");
const { promisify } = require("util");
const tmp = require('tmp');
const fs = require('fs');
const path = require('path');
const exec = promisify(require("child_process").exec);

const { HELM_DOCKER_IMAGE, TOKEN_REGEXP } = require("./consts")

async function runCommand(helmConfig) {
  const {
    kubeToken,
    kubeApiServer,
    kubeCertificate,
    command,
    workingDirectory,
  } = helmConfig;

  const tmpfile = tmp.fileSync({ prefix: 'kubeCAcert-', postfix: '.tmp' });
  fs.writeFileSync(tmpfile.name, atob(kubeCertificate));
  const certificateFilePath = tmpfile.name;

  // this probably because Helm caches things in user's home folder
  const additionalArguments = [
    "-v /tmp/root:/root",
  ];

  const [certificatePath, certificateFileName] = splitDirectory(certificateFilePath);
  const certificateVolumeDefinition = docker.createVolumeDefinition(certificatePath);
  const volumeDefinitions = [
    certificateVolumeDefinition,
  ];

  const workDir = workingDirectory || await helpers.analyzePath("./");
  const workingDirectoryVolumeDefinition = docker.createVolumeDefinition(
    workDir.absolutePath,
  );
  volumeDefinitions.push(workingDirectoryVolumeDefinition);
  additionalArguments.push("-w", `$${workingDirectoryVolumeDefinition.mountPoint.name}`);

  console.error(`KUBECAFILE: ${certificateVolumeDefinition.mountPoint.value}/${certificateFileName}`)

  const authenticationParametersMap = new Map([
    ["--kube-ca-file", `${certificateVolumeDefinition.mountPoint.value}/${certificateFileName}`],
    ["--kube-token", kubeToken],
    ["--kube-apiserver", kubeApiServer],
  ]);

  const sanitizedParametersMap = sanitizeParameters(
    command,
    authenticationParametersMap,
  );

  console.error(`sanitizedPARAMSMap: ${JSON.stringify(sanitizedParametersMap)}`)
  // eslint-disable-next-line max-len
  const parametersWithEnvironmentalVariablesArray = paramsMapToParamsWithEnvironmentalVariablesArray(
    sanitizedParametersMap,
  );
  const environmentalVariablesContainingParametersObject = paramsMapToEnvironmentalVariablesObject(
    sanitizedParametersMap,
  );

  const dockerEnvironmentalVariables = volumeDefinitions.reduce(
    (acc, cur) => ({
      ...acc,
      [cur.mountPoint.name]: cur.mountPoint.value,
    }),
    {},
  );

  const shellEnvironmentalVariables = volumeDefinitions.reduce(
    (acc, cur) => ({
      ...acc,
      [cur.path.name]: cur.path.value,
    }),
    {
      ...dockerEnvironmentalVariables,
      ...environmentalVariablesContainingParametersObject,
    },
  );

  const helmCommand = `\
${sanitizeCommand(command)} \
${parametersWithEnvironmentalVariablesArray.join(" ")}`;

  const completeCommand = docker.buildDockerCommand({
    command: helmCommand,
    image: HELM_DOCKER_IMAGE,
    environmentVariables: dockerEnvironmentalVariables,
    volumeDefinitionsArray: volumeDefinitions,
    additionalArguments,
  });

  console.error(`Executing ${completeCommand}`);

  const result = await exec(completeCommand, {
    env: shellEnvironmentalVariables,
  });

  return {
    stderr: result.stderr,
    stdout: redactTokenValue(result.stdout),
  };
}

function paramsMapToParamsWithEnvironmentalVariablesArray(paramsMap) {
  return Array.from(
    paramsMap,
    ([key]) => ([key, generateEnvironmentalVariableName(key)]),
  ).flat();
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

// Helm Docker image has ENTRYPOINT ["helm"]
function sanitizeCommand(command) {
  return command.startsWith("helm")
    ? command.slice(4).trim()
    : command;
}

// Make sure command isn't overrriding something
function sanitizeParameters(command, authenticationParamsMap) {
  const sanitizedParameters = new Map();

  authenticationParamsMap.forEach((value, key) => {
    if (!command.includes(key)) {
      sanitizedParameters.set(key, value);
    }
  });

  return sanitizedParameters;
}


function splitDirectory(directory) {
  return [
    path.dirname(directory),
    path.basename(directory),
  ];
}

function paramsMapToEnvironmentalVariablesObject(paramsMap) {
  return Object.fromEntries(
    Array.from(
      paramsMap,
      ([key, value]) => ([generateEnvironmentalVariableName(key).substring(1), value]),
    ),
  );
}

function redactTokenValue(str) {
  return str.replace(TOKEN_REGEXP, "$1redacted$3");
}

module.exports = {
  runCommand,
};
