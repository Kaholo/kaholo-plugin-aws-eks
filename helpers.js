const { EKS_SERVICE_URL } = require("./consts");

// const CREDENTIAL_LABELS = {
//   ACCESS_KEY: "accessKeyId",
//   SECRET_KEY: "secretAccessKey",
//   REGION: "region",
// };

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
  console.error(`getTokenConfigparams: ${JSON.stringify(parameters)}`)
  if (!parameters.config?.accessKeyId || !parameters.config?.secretAccessKey) {
    throw new Error("Access Key ID and Secret Access Key are required parameters. Please specify them in the plugin account.");
  }

  return {
    accessKeyId: parameters.config.accessKeyId,
    secretAccessKey: parameters.config.secretAccessKey,
    // sessionToken: 'SESSION [Optional]',
    region: parameters.config.region || "us-east-1",
  };
}

module.exports = {
  isObjectEmpty,
  roleFilter,
  getTokenConfig,
};
