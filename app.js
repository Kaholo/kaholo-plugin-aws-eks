const dayjs = require("dayjs");
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
    expires,
  } = parameters;
  const reqTime = dayjs();
  const dateFormat = "YYYY-MM-DDTHH:mm:ss[Z]";

  const token = await EKSToken.renew(
    clusterName,
    expires,
    reqTime.utc().format(dateFormat),
  );

  const { cluster } = await client.describeCluster({ name: clusterName }).promise();
  const expirationTimestamp = reqTime.add(expires, "s").utc().format(dateFormat);
  return {
    expirationTimestamp,
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
