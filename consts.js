const EKS_SERVICE_URL = "eks.amazonaws.com";
const CREDENTIAL_KEYS = {
  ACCESS_KEY: "accessKeyId",
  SECRET_KEY: "secretAccessKey",
  REGION: "region",
};

// this image is 77MB in size
const KUBECTL_DOCKER_IMAGE = "bitnami/kubectl:1.28.3";
// this image is 82MB in size
const HELM_DOCKER_IMAGE = "alpine/helm:3.13.2";

const TOKEN_REGEXP = /(HELM_KUBETOKEN=")([\w\d-.]+)?(")/;

module.exports = {
  EKS_SERVICE_URL,
  CREDENTIAL_KEYS,
  KUBECTL_DOCKER_IMAGE,
  HELM_DOCKER_IMAGE,
  TOKEN_REGEXP,
};
