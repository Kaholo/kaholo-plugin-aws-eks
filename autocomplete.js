const kaholo = require("@kaholo/aws-plugin-library");
const {
  IAMClient,
  ListRolesCommand,
} = require("@aws-sdk/client-iam");

const {
  roleFilter,
} = require("./helpers");
const { CREDENTIAL_KEYS } = require("./consts");

async function listRoles(query, params) {
  const { credentials, region } = kaholo.helpers.readCredentials(params, CREDENTIAL_KEYS);
  const iamClient = new IAMClient({
    credentials,
    region,
  });

  let roles;
  try {
    roles = await iamClient.send(new ListRolesCommand({}));
  } catch (err) {
    console.error(err);
    throw new Error("Missing or incorrect credentials - please select valid access and secret keys first");
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
