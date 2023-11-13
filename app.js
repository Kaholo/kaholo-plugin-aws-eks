const awsPluginLibrary = require("@kaholo/aws-plugin-library");
const {
  EKSClient,
  CreateClusterCommand,
  DescribeClusterCommand,
  waitUntilClusterActive,
} = require("@aws-sdk/client-eks");

const autocomplete = require("./autocomplete");
const { fetchToken } = require("./helpers");
const { prepareCreateClusterPayload } = require("./payload-functions");
const { CREDENTIAL_KEYS } = require("./consts");

async function getToken(client, parameters) {
  const { clusterName } = parameters;

  const { cluster } = await client.send(
    new DescribeClusterCommand({ name: clusterName }),
  );
  const token = await fetchToken(parameters);

  return {
    token,
    clusterHost: cluster.endpoint,
    clusterCA: cluster.certificateAuthority.data,
  };
}

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

module.exports = awsPluginLibrary.bootstrap(
  EKSClient,
  {
    getToken,
    createCluster,
  },
  autocomplete,
  CREDENTIAL_KEYS,
);
