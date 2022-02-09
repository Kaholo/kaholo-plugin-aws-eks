const aws = require("aws-sdk");

function getEc2(params, settings) {
    return new aws.EC2({
        region: parseAutocomplete(params.region) || settings.region,
        accessKeyId: params.accessKeyId || settings.accessKeyId,
        secretAccessKey: params.secretAccessKey || settings.secretAccessKey,
    });
}

function getLightsail(params, settings) {
    return new aws.Lightsail({
        region: parseAutocomplete(params.region) || settings.region,
        accessKeyId: params.accessKeyId || settings.accessKeyId,
        secretAccessKey: params.secretAccessKey || settings.secretAccessKey,
    });
}

function parseAutocomplete(value) {
    if (!value) return undefined;
    if (value.id) return value.id;
    return value;
}

module.exports = {
    getEc2,
    getLightsail
}
