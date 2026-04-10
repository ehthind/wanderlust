export const hostedServiceNames = Object.freeze({
  web: "wanderlust-web",
  temporalWorker: "wanderlust-temporal-worker",
});

export const getVercelTargetEntries = () => [
  ["APP_NAME", "Wanderlust", false],
  ["SERVICE_NAME", hostedServiceNames.web, false],
  ["WANDERLUST_SECRETS_MODE", "env", false],
];

export const getRailwayBaseEntries = () => [["SERVICE_NAME", hostedServiceNames.temporalWorker]];
