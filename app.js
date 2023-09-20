const EKSToken = require("aws-eks-token");

const kaholo = require("@kaholo/aws-plugin-library");
const aws = require("aws-sdk");
const autocomplete = require("./autocomplete");

const { getTokenConfig } = require("./helpers");

const {
  createPayloadForCreateCluster,
} = require("./payload-functions");

async function getToken(client, parameters) {
  EKSToken.config = getTokenConfig(parameters);
  const {
    clusterName,
  } = parameters;

  // expiry is based in IAM role, setting here creates invalid token
  const token = await EKSToken.renew(
    clusterName,
  );

  const { cluster } = await client.describeCluster({ name: clusterName }).promise();
  return {
    token,
    clusterHost: cluster.endpoint,
    clusterCA: cluster.certificateAuthority.data,
  };
}

const createCluster = kaholo.generateAwsMethod("createCluster", createPayloadForCreateCluster);

module.exports = {
  ...kaholo.bootstrap(
    aws.EKS,
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
  ),
};
