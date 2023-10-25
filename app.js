const EKSToken = require("aws-eks-token");
const awsPluginLibrary = require("@kaholo/aws-plugin-library");
const {
  EKSClient,
  CreateClusterCommand,
  DescribeClusterCommand,
  waitUntilClusterActive,
} = require("@aws-sdk/client-eks");

const autocomplete = require("./autocomplete");
const { getTokenConfig } = require("./helpers");
const {
  prepareCreateClusterPayload,
} = require("./payload-functions");

async function getToken(client, parameters) {
  const {
    clusterName,
  } = parameters;
  EKSToken.config = getTokenConfig(parameters);

  // expiry is based in IAM role, setting here creates invalid token
  const token = await EKSToken.renew(
    clusterName,
  );

  const { cluster } = await client.send(
    new DescribeClusterCommand({ name: clusterName }),
  );

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
  {
    ACCESS_KEY: "accessKeyId",
    SECRET_KEY: "secretAccessKey",
    REGION: "region",
  },
);
