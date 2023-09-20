const kaholo = require("@kaholo/aws-plugin-library");
const aws = require("aws-sdk");
const { MISSING_OR_INCORRECT_CREDENTIALS_ERROR_MESSAGE } = require("./consts");

const {
  roleFilter,
} = require("./helpers");

const CREDENTIAL_LABELS = {
  ACCESS_KEY: "accessKeyId",
  SECRET_KEY: "secretAccessKey",
  REGION: "region",
};

async function listRoles(query, params) {
  const credentials = kaholo.helpers.readCredentials(params, CREDENTIAL_LABELS);
  const iam = new aws.IAM(credentials);
  let roles;
  try {
    roles = await iam.listRoles().promise();
  } catch (err) {
    console.error(err);
    throw new Error(MISSING_OR_INCORRECT_CREDENTIALS_ERROR_MESSAGE);
  }

  return roles.Roles
    .filter(roleFilter)
    .filter(({ RoleName }) => RoleName.includes(query))
    .map(({ Arn, RoleName }) => ({ id: Arn, value: RoleName }));
}

module.exports = {
  listRegions: kaholo.autocomplete.listRegions,
  listRoles,
};
