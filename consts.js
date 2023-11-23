const EKS_SERVICE_URL = "eks.amazonaws.com";
const CREDENTIAL_KEYS = {
  ACCESS_KEY: "accessKeyId",
  SECRET_KEY: "secretAccessKey",
  REGION: "region",
};

// this image is 77MB in size
const KUBECTL_DOCKER_IMAGE = "bitnami/kubectl:1.28.3";
const HELM_DOCKER_IMAGE = "alpine/helm:3.13.2";

module.exports = {
  EKS_SERVICE_URL,
  CREDENTIAL_KEYS,
  KUBECTL_DOCKER_IMAGE,
};
