const dayjs = require("dayjs");
const EKSToken = require("aws-eks-token");

const kaholo = require("kaholo-aws-library");
const aws = require("aws-sdk");
const autocomplete = require("./autocomplete");

const { CREDENTIAL_LABELS } = require("./helpers");

const {
  createPayloadForCreateCluster,
} = require("./payload-functions");

async function getToken(client, { expires, clusterName }, region, originalParams) {
  EKSToken.config = kaholo.helpers.readCredentials(
    originalParams.action.params,
    originalParams.settings,
    CREDENTIAL_LABELS,
  );
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
    CREDENTIAL_LABELS,
  ),
};
