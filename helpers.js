const aws = require("aws-sdk");
const { CORRUPTED_ROLE_POLICY_TEXT, EKS_SERVICE_URL } = require("./consts");
const parsers = require("./parsers");

function mapAWSConfig(params, settings) {
  const region = parsers.autocomplete(params.region);
  const accessKeyId = parsers.string(params.accessKeyId) || settings.accessKeyId;
  const secretAccessKey = parsers.string(params.secretAccessKey) || settings.secretAccessKey;
  return { region, accessKeyId, secretAccessKey };
}

function getServiceCreator(serviceName) {
  return (params, settings = {}) => {
    const config = mapAWSConfig(params, settings);
    return new aws[serviceName]({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      region: config.region,
    });
  };
}

function isObjectEmpty(ob) {
  return Object.values(ob).filter(Boolean).length === 0;
}

function roleFilter({ RoleName, AssumeRolePolicyDocument }) {
  let policy;
  try {
    policy = JSON.parse(decodeURIComponent(AssumeRolePolicyDocument));
  } catch {
    throw new Error(CORRUPTED_ROLE_POLICY_TEXT(RoleName));
  }
  const roleIntendedForEks = policy.Statement.some(
    (item) => item.Principal.Service.includes(EKS_SERVICE_URL),
  );
  return roleIntendedForEks;
}

module.exports = {
  getEc2: getServiceCreator("EC2"),
  getLightsail: getServiceCreator("Lightsail"),
  getEKS: getServiceCreator("EKS"),
  getIAM: getServiceCreator("IAM"),
  isObjectEmpty,
  mapAWSConfig,
  roleFilter,
};
