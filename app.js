const dayjs = require("dayjs");
const EKSToken = require("aws-eks-token");
const autocomplete = require("./autocomplete");
const { getEKS, mapAwsConfig } = require("./helpers");
const {
  createPayloadForGetToken,
  createPayloadForCreateCluster,
} = require("./payload-functions");

async function getToken({ params }, settings) {
  const { expires, clusterName } = createPayloadForGetToken(params);

  const awsConfig = mapAwsConfig(params, settings);
  const eks = getEKS(awsConfig);
  EKSToken.config = awsConfig;
  const reqTime = dayjs();
  const dateFormat = "YYYY-MM-DDTHH:mm:ss[Z]";

  const token = await EKSToken.renew(
    clusterName,
    expires,
    reqTime.utc().format(dateFormat),
  );
  const { cluster } = await eks.describeCluster({ name: clusterName }).promise();
  const expirationTimestamp = reqTime.add(expires, "s").utc().format(dateFormat);
  return {
    expirationTimestamp,
    token,
    clusterHost: cluster.endpoint,
    clusterCA: cluster.certificateAuthority.data,
  };
}

async function createCluster({ params }, settings) {
  const clusterPayload = createPayloadForCreateCluster(params);

  const awsConfig = mapAwsConfig(params, settings);
  const eks = getEKS(awsConfig);
  const { cluster } = await eks.createCluster(clusterPayload).promise();
  return cluster;
}

module.exports = {
  getToken,
  createCluster,
  ...autocomplete,
};
