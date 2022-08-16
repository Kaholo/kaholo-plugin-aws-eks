const kaholo = require("@kaholo/aws-plugin-library");
const aws = require("aws-sdk");
const { MISSING_OR_INCORRECT_CREDENTIALS_ERROR_MESSAGE } = require("./consts");

const {
  roleFilter,
  CREDENTIAL_LABELS,
} = require("./helpers");

async function listRoles(query, parsedParams, client, region, { pluginSettings, actionParams }) {
  const [params, settings] = [actionParams, pluginSettings]
    .map(kaholo.autocomplete.mapAutocompleteFuncParamsToObject);
  const credentials = kaholo.helpers.readCredentials(params, settings, CREDENTIAL_LABELS);
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
