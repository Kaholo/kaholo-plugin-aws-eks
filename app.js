const dayjs = require("dayjs");
const EKSToken = require("aws-eks-token");
const { listRegions } = require("./autocomplete");

async function getToken(action, settings) {
  if (!action.params.clusterName) {
    throw new Error("not given cluster name");
  }
  const expires = action.params.expires || "60";
  if (!Number.isInteger(parseFloat(expires))) {
    throw new Error("expires must be an integer");
  }

  EKSToken.config = {
    accessKeyId: action.params.accessKeyId || settings.accessKeyId,
    secretAccessKey: action.params.secretAccessKey || settings.secretAccessKey,
    region: action.params.region,
  };

  const reqTime = dayjs();
  const token = await EKSToken.renew(
    action.params.clusterName,
    expires,
    reqTime.utc().format("YYYYMMDDTHHmmss[Z]"),
  );
  const expirationTime = reqTime.add(parseInt(expires, 10), "s").utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
  return {
    expirationTimestamp: expirationTime,
    token,
  };
}

module.exports = {
  getToken,
  // autocomplete
  listRegions,
};
