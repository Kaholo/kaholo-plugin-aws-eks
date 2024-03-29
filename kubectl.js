const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { docker, helpers } = require("@kaholo/plugin-library");

const { generateRandomString } = require("./helpers");
const { KUBECTL_DOCKER_IMAGE } = require("./consts");

const environmentalVariablesNames = {
  kubeCertificate: "KUBE_CERT",
  kubeToken: "KUBE_TOKEN",
  kubeApiServer: "KUBE_API_SERVER",
  namespace: "KUBE_NAMESPACE",
};

function sanitizeCommand(command) {
  return command.startsWith("kubectl") ? command : `kubectl ${command}`;
}

async function runCommand(params) {
  const {
    kubeCertificate,
    kubeToken,
    kubeApiServer,
    command,
    workingDirectory,
  } = params;

  const shellEnvironmentalVariables = {};
  shellEnvironmentalVariables[environmentalVariablesNames.kubeCertificate] = kubeCertificate;
  shellEnvironmentalVariables[environmentalVariablesNames.kubeToken] = kubeToken;
  shellEnvironmentalVariables[environmentalVariablesNames.kubeApiServer] = kubeApiServer;

  const workDir = workingDirectory || await helpers.analyzePath("./");
  const absoluteWorkingDirectory = workDir.absolutePath;

  const workingDirectoryVolumeDefinition = docker.createVolumeDefinition(absoluteWorkingDirectory);
  // eslint-disable-next-line max-len
  shellEnvironmentalVariables[workingDirectoryVolumeDefinition.path.name] = workingDirectoryVolumeDefinition.path.value;
  // eslint-disable-next-line max-len
  shellEnvironmentalVariables[workingDirectoryVolumeDefinition.mountPoint.name] = workingDirectoryVolumeDefinition.mountPoint.value;

  const clusterName = `cluster_${generateRandomString()}`;
  const userName = `user_${generateRandomString()}`;
  const contextName = `context_${generateRandomString()}`;

  // First command doesn't need kubectl prefix
  const aggregatedCommand = `\
sh -c "\
kubectl config set-cluster ${clusterName} --server=$${environmentalVariablesNames.kubeApiServer} >/dev/null && \
kubectl config set clusters.${clusterName}.certificate-authority-data $${environmentalVariablesNames.kubeCertificate} >/dev/null  && \
kubectl config set-context ${contextName} --cluster=${clusterName} --user=${userName} >/dev/null && \
kubectl config set current-context ${contextName} >/dev/null && \
kubectl config set-credentials ${userName} --token=$${environmentalVariablesNames.kubeToken} >/dev/null && \
${sanitizeCommand(command)}\
"`;

  const dockerCommand = docker.buildDockerCommand({
    command: aggregatedCommand,
    image: KUBECTL_DOCKER_IMAGE,
    additionalArguments: ["--entrypoint", "\"\""], // ignores default entrypoint and allows to call any command
    volumeDefinitionsArray: [workingDirectoryVolumeDefinition],
    workingDirectory: `$${workingDirectoryVolumeDefinition.mountPoint.name}`,
  });

  const {
    stdout,
    stderr,
  } = await exec(dockerCommand, {
    env: shellEnvironmentalVariables,
  });

  if (stderr && !stdout) {
    throw stderr;
  }

  return stdout;
}

module.exports = {
  runCommand,
};
