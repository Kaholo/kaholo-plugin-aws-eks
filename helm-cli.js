const {
  docker,
  helpers,
} = require("@kaholo/plugin-library");
const { promisify } = require("util");
const tmp = require("tmp");
const fs = require("fs");
const exec = promisify(require("child_process").exec);

const helmhelp = require("./helpers-helm");
const { HELM_DOCKER_IMAGE } = require("./consts");

async function runCommand(helmConfig) {
  const {
    kubeToken,
    kubeApiServer,
    kubeCertificate,
    command,
    workingDirectory,
  } = helmConfig;

  const tmpfile = tmp.fileSync({ prefix: "kubeCAcert-", postfix: ".tmp" });
  fs.writeFileSync(tmpfile.name, atob(kubeCertificate));
  const certificateFilePath = tmpfile.name;

  // this probably because Helm caches things in user's home folder
  const additionalArguments = [
    "-v /tmp/root:/root",
  ];

  const [certificatePath, certificateFileName] = helmhelp.splitDirectory(certificateFilePath);
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
  ]);

  const sanitizedParametersMap = helmhelp.sanitizeParameters(
    command,
    authenticationParametersMap,
  );

  // eslint-disable-next-line max-len
  const parametersWithEnvironmentalVariablesArray = helmhelp.paramsMapToParamsWithEnvironmentalVariablesArray(
    sanitizedParametersMap,
  );
  // eslint-disable-next-line max-len
  const environmentalVariablesContainingParametersObject = helmhelp.paramsMapToEnvironmentalVariablesObject(
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
${helmhelp.sanitizeCommand(command)} \
${parametersWithEnvironmentalVariablesArray.join(" ")}`;

  const completeCommand = docker.buildDockerCommand({
    command: helmCommand,
    image: HELM_DOCKER_IMAGE,
    environmentVariables: dockerEnvironmentalVariables,
    volumeDefinitionsArray: volumeDefinitions,
    additionalArguments,
  });

  const result = await exec(completeCommand, {
    env: shellEnvironmentalVariables,
  });

  if (result.stdout && !result.stderr) {
    return helmhelp.redactTokenValue(result.stdout);
  }

  return {
    stderr: result.stderr,
    stdout: helmhelp.redactTokenValue(result.stdout),
  };
}

module.exports = {
  runCommand,
};
