const { EKS_SERVICE_URL } = require("./consts");

const CREDENTIAL_LABELS = {
  ACCESS_KEY: "accessKeyId",
  SECRET_KEY: "secretAccessKey",
  REGION: "region",
};

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

module.exports = {
  isObjectEmpty,
  roleFilter,
  CREDENTIAL_LABELS,
};
