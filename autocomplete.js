const { MISSING_OR_INCORRECT_CREDENTIALS_ERROR } = require("./consts");
const {
  getEc2, getLightsail, getIAM, roleFilter, mapAwsConfig,
} = require("./helpers");

function paramsMapper(pluginSettings, actionParams) {
  const settings = {};
  const params = {};

  if (pluginSettings && pluginSettings.length > 0) {
    pluginSettings.forEach((setting) => {
      settings[setting.name] = setting.value;
    });
  }

  if (actionParams && actionParams.length > 0) {
    actionParams.forEach((param) => {
      params[param.name] = param.value;
    });
  }

  return { settings, params };
}

async function listRegions(query, pluginSettings, actionParams) {
  const mapped = paramsMapper(pluginSettings, actionParams);
  const { settings } = mapped;
  let { params } = mapped;
  params = { ...params, region: params.region || "eu-west-2" };
  const awsConfig = mapAwsConfig(params, settings);
  const ec2 = getEc2(awsConfig);
  const lightsail = getLightsail(awsConfig);

  const ec2RegionsPromise = ec2.describeRegions().promise();
  const lightsailRegionsPromise = lightsail.getRegions().promise();

  return Promise.all([ec2RegionsPromise, lightsailRegionsPromise]).then(
    ([ec2Regions, lightsailRegions]) => ec2Regions.Regions.map((ec2Region) => {
      const lsRegion = lightsailRegions.regions.find((x) => x.name === ec2Region.RegionName);
      return lsRegion
        ? { id: ec2Region.RegionName, value: `${ec2Region.RegionName} (${lsRegion.displayName})` }
        : { id: ec2Region.RegionName, value: ec2Region.RegionName };
    }).sort((a, b) => {
      if (a.value > b.value) { return 1; }
      if (a.value < b.value) { return -1; }
      return 0;
    }),
  ).catch((err) => {
    console.error(err);
    throw new Error(MISSING_OR_INCORRECT_CREDENTIALS_ERROR);
  });
}

async function listRoles(query, pluginSettings, actionParams) {
  const { settings, params } = paramsMapper(pluginSettings, actionParams);
  const awsConfig = mapAwsConfig(params, settings);
  const iam = getIAM(awsConfig);
  const roles = await iam.listRoles().promise().catch((err) => {
    console.error(err);
    throw new Error(MISSING_OR_INCORRECT_CREDENTIALS_ERROR);
  });

  return roles.Roles
    .filter(roleFilter) // filtering roles intended for EKS
    .filter(({ RoleName }) => RoleName.includes(query)) // filtering roles by query
    .map(({ Arn, RoleName }) => ({ id: Arn, value: RoleName }));
}

module.exports = {
  listRegions,
  listRoles,
};
