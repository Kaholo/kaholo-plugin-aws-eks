const dayjs = require("dayjs");
const EKSToken = require("aws-eks-token");
const AWS = require("aws-sdk");
const autocomplete = require("./autocomplete");
const { CLUSTER_REQUIRED_MESSAGE, EXPIRES_INVALID_MESSAGE } = require("./consts");
const parsers = require("./parsers");

async function getToken({ params }, settings) {
  const clusterName = parsers.string(params.clusterName);
  const region = parsers.autocomplete(params.region);
  const expires = parsers.integer(params.expires) || 60;
  const secretAccessKey = parsers.string(params.secretAccessKey || settings.secretAccessKey);
  const accessKeyId = parsers.string(params.accessKeyId || settings.accessKeyId);

  if (!clusterName) {
    throw new Error(CLUSTER_REQUIRED_MESSAGE);
  }
  if (!Number.isInteger(expires)) {
    throw new Error(EXPIRES_INVALID_MESSAGE);
  }

  const credentials = { secretAccessKey, accessKeyId };
  const EKS = new AWS.EKS({ credentials, region });
  EKSToken.config = {
    ...credentials,
    region,
  };
  const reqTime = dayjs();
  const dateFormat = "YYYY-MM-DDTHH:mm:ss[Z]";

  const token = await EKSToken.renew(
    clusterName,
    expires,
    reqTime.utc().format(dateFormat),
  );
  const { cluster } = await EKS.describeCluster({ name: clusterName }).promise();
  const expirationTime = reqTime.add(expires, "s").utc().format(dateFormat);
  return {
    expirationTimestamp: expirationTime,
    token,
    clusterHost: cluster.endpoint,
    clusterCA: cluster.certificateAuthority.data,
  };
}

module.exports = {
  getToken,
  ...autocomplete,
};
