const { EKS_SERVICE_URL } = require("./consts");

function isObjectEmpty(ob) {
  return !!ob && Object.values(ob).filter(Boolean).length === 0;
}

function roleFilter({ RoleName, AssumeRolePolicyDocument }) {
  let policy;
  try {
    policy = JSON.parse(decodeURIComponent(AssumeRolePolicyDocument));
  } catch {
    throw new Error(`Failed to parse role policy for role "${RoleName}".`);
  }

  return policy.Statement.some(
    (item) => item.Principal.Service.includes(EKS_SERVICE_URL),
  );
}

function getTokenConfig(parameters) {
  if (!parameters.accessKeyId || !parameters.secretAccessKey) {
    throw new Error("Access Key ID and Secret Access Key are required parameters. Please specify them in the plugin account.");
  }

  return {
    accessKeyId: parameters.accessKeyId,
    secretAccessKey: parameters.secretAccessKey,
    // sessionToken: 'SESSION [Optional]',
    region: parameters.region || "us-east-1",
  };
}

module.exports = {
  isObjectEmpty,
  roleFilter,
  getTokenConfig,
};
