const awsPluginLibrary = require("@kaholo/aws-plugin-library");
const {
  EKSClient,
  CreateClusterCommand,
  DescribeClusterCommand,
  waitUntilClusterActive,
} = require("@aws-sdk/client-eks");

const autocomplete = require("./autocomplete");
const { fetchToken } = require("./helpers");
const { extractUserFromJWT } = require(".helpers-helm");
const { prepareCreateClusterPayload } = require("./payload-functions");
const { CREDENTIAL_KEYS } = require("./consts");
const kubectl = require("./kubectl");
const helmCli = require("./helm-cli");

async function createCluster(client, params, region) {
  const awsCreateCluster = awsPluginLibrary.generateAwsMethod(
    CreateClusterCommand,
    prepareCreateClusterPayload,
  );
  const { cluster } = await awsCreateCluster(client, params, region);

  if (!params.waitForActiveStatus) {
    return cluster;
  }

  const clusterName = cluster.name;
  await waitUntilClusterActive({ client }, {
    name: clusterName,
  });
  return client.send(
    new DescribeClusterCommand({ name: clusterName }),
  );
}

async function runKubectlCommand(client, parameters) {
  const {
    clusterName,
    command,
    workingDirectory,
  } = parameters;

  const { cluster } = await client.send(
    new DescribeClusterCommand({ name: clusterName }),
  );
  const token = await fetchToken(parameters);

  const kubeCtlConfig = {
    kubeToken: token,
    kubeApiServer: cluster.endpoint,
    kubeCertificate: cluster.certificateAuthority.data,
    command,
    workingDirectory,
  };

  return kubectl.runCommand(kubeCtlConfig);
}

async function runHelmCommand(client, parameters) {
  const {
    clusterName,
    command,
    workingDirectory,
  } = parameters;

  const { cluster } = await client.send(
    new DescribeClusterCommand({ name: clusterName }),
  );
  const token = await fetchToken(parameters);

  const kubeUser = extractUserFromJWT(token);

  const helmConfig = {
    kubeToken: token,
    kubeApiServer: cluster.endpoint,
    kubeCertificate: cluster.certificateAuthority.data,
    kubeUser,
    command,
    workingDirectory,
  };

  return helmCli.runCommand(helmConfig);
}

module.exports = awsPluginLibrary.bootstrap(
  EKSClient,
  {
    createCluster,
    runKubectlCommand,
    runHelmCommand,
  },
  autocomplete,
  CREDENTIAL_KEYS,
);
