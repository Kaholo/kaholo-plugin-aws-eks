const dayjs = require("dayjs");
const EKSToken = require("aws-eks-token");

const kaholo = require("@kaholo/aws-plugin-library");
const aws = require("aws-sdk");
const autocomplete = require("./autocomplete");

const { getTokenConfig } = require("./helpers");

const {
  createPayloadForCreateCluster,
} = require("./payload-functions");

async function getToken(parameters) {
  console.error(`TOP of getToken`)
  EKSToken.config = getTokenConfig(parameters);
  console.error(`EKSTOKEN: ${JSON.stringify(EKSToken.config)}`)
  const {
    clusterName,
    expires
  } = parameters;
  const reqTime = dayjs();
  const dateFormat = "YYYY-MM-DDTHH:mm:ss[Z]";

  console.error(`CALLING EKSToken.renew`)
  const token = await EKSToken.renew(
    clusterName,
    expires,
    reqTime.utc().format(dateFormat),
  );
  console.error(`TOKEN: ${JSON.stringify(token)}`)

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
    }
  ),
};
