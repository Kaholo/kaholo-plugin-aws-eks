const decodeJwt = require("jwt-decode");

function extractUserFromJWT(token) {
  const decodedData = decodeJwt(token);

  const user = decodedData?.sub;
  if (!user) {
    throw new Error(
      "Failed to extract kube-user from kube-token. "
      + "The token doesn't contain kube-user.",
    );
  }

  return user;
}

module.exports = {
    extractUserFromJWT,
  };