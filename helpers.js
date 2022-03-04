const aws = require("aws-sdk");
const { EKS_SERVICE_URL } = require("./consts");
const parsers = require("./parsers");

function mapAwsConfig(params, settings) {
  const region = parsers.autocomplete(params.region);
  const accessKeyId = parsers.string(params.accessKeyId) || settings.accessKeyId;
  const secretAccessKey = parsers.string(params.secretAccessKey) || settings.secretAccessKey;
  return {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
}

function getServiceCreator(serviceName) {
  return (config) => new aws[serviceName](config);
}

function isObjectEmpty(ob) {
  return Object.values(ob).filter(Boolean).length === 0;
}

function roleFilter({ RoleName, AssumeRolePolicyDocument }) {
  let policy;
  try {
    policy = JSON.parse(decodeURIComponent(AssumeRolePolicyDocument));
  } catch {
    throw new Error(`Failed to parse role policy for role "${RoleName}".`);
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
  mapAwsConfig,
  roleFilter,
};
