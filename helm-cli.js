const {
  docker,
  helpers,
} = require("@kaholo/plugin-library");
const { promisify } = require("util");
const tmp = require('tmp');
const fs = require('fs');
const exec = promisify(require("child_process").exec);
const path = require("path");
const { HELM_DOCKER_IMAGE } = require("consts")

async function runCommand(helmConfig) {
  const {
    kubeToken,
    kubeApiServer,
    kubeCertificate,
    kubeUser,
    command,
    workingDirectory,
  } = helmConfig;

  const tmpfile = tmp.fileSync({ mode: 0o644, prefix: 'kubeCAcert-', postfix: '.tmp' });
  fs.writeFileSync(tmpfile.name, kubeCertificate);
  const certificateFilePath = tmpfile.name;
  console.error(`CERTPATH: ${certificateFilePath}`);
  console.error(`TMPFILE: ${JSON.stringify(tmpfile)}`);

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

  const authenticationParametersMap = new Map([
    ["--kube-ca-file", `${certificateVolumeDefinition.mountPoint.value}/${certificateFileName}`],
    ["--kube-token", kubeToken],
    ["--kube-apiserver", kubeApiServer],
    ["--kube-as-user", kubeUser],
  ]);

  const sanitizedParametersMap = sanitizeParameters(
    command,
    authenticationParametersMap,
  );
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

function extractChartPathFromCommand(command) {
  const paths = helpers.extractPathsFromCommand(command);

  if (paths.length < 1 || !paths[0].path) {
    return null;
  }

  return paths[0].path;
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

module.exports = {
  runCommand,
};
