const { EKSClient, CreateClusterCommand, DescribeClusterCommand } = require("@aws-sdk/client-eks");
const EKSToken = require("aws-eks-token");
const awsPluginLibrary = require("@kaholo/aws-plugin-library");

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

  const command = new DescribeClusterCommand({ name: clusterName });
  const { cluster } = await client.send(command);

  return {
    token,
    clusterHost: cluster.endpoint,
    clusterCA: cluster.certificateAuthority.data,
  };
}

const createCluster = awsPluginLibrary.generateAwsMethod(
  CreateClusterCommand,
  prepareCreateClusterPayload,
);

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
