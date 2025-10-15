const { generateSubsystemName } = require('../utils/deployment-utils');

function createOtelEnvironmentVariables(namespace, deploymentName) {
  const subsystemName = generateSubsystemName(namespace, deploymentName);

  return [
    {
      name: "OTEL_SERVICE_NAME",
      value: namespace
    },
    {
      name: "OTEL_RESOURCE_ATTRIBUTES",
      value: `cx.application.name=${namespace},cx.subsystem.name=${subsystemName}`
    },
    {
      name: "OTEL_IP",
      valueFrom: {
        fieldRef: {
          fieldPath: "status.hostIP"
        }
      }
    },
    {
      name: "OTEL_EXPORTER_OTLP_ENDPOINT",
      value: "http://$(OTEL_IP):4317"
    },
    {
      name: "OTEL_PYTHON_DJANGO_INSTRUMENT",
      value: "true"
    },
    {
      name: "OTEL_PYTHON_REQUESTS_INSTRUMENT",
      value: "true"
    },
    {
      name: "OTEL_PYTHON_PSYCOPG2_INSTRUMENT",
      value: "true"
    },
    {
      name: "OTEL_PYTHON_KAFKA_PYTHON_INSTRUMENT",
      value: "true"
    },
    {
      name: "OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED",
      value: "true"
    }
  ];
}

function getOtelVariableNames() {
  return [
    "OTEL_SERVICE_NAME",
    "OTEL_RESOURCE_ATTRIBUTES",
    "OTEL_IP",
    "OTEL_EXPORTER_OTLP_ENDPOINT",
    "OTEL_PYTHON_DJANGO_INSTRUMENT",
    "OTEL_PYTHON_REQUESTS_INSTRUMENT",
    "OTEL_PYTHON_PSYCOPG2_INSTRUMENT",
    "OTEL_PYTHON_KAFKA_PYTHON_INSTRUMENT",
    "OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED"
  ];
}

function validateOtelConfiguration(envVars, namespace, deploymentName) {
  const requiredVars = getOtelVariableNames();
  const existingVarNames = envVars.map(env => env.name);
  const missingVars = requiredVars.filter(varName => !existingVarNames.includes(varName));

  const validation = {
    isComplete: missingVars.length === 0,
    missingVars,
    existingVars: existingVarNames.filter(name => name.startsWith('OTEL_')),
    isCorrectServiceName: false,
    isCorrectResourceAttributes: false
  };

  const serviceNameVar = envVars.find(env => env.name === 'OTEL_SERVICE_NAME');
  if (serviceNameVar) {
    validation.isCorrectServiceName = serviceNameVar.value === namespace;
  }

  const resourceAttributesVar = envVars.find(env => env.name === 'OTEL_RESOURCE_ATTRIBUTES');
  if (resourceAttributesVar) {
    const expectedValue = `cx.application.name=${namespace},cx.subsystem.name=${generateSubsystemName(namespace, deploymentName)}`;
    validation.isCorrectResourceAttributes = resourceAttributesVar.value === expectedValue;
  }

  return validation;
}

module.exports = {
  createOtelEnvironmentVariables,
  getOtelVariableNames,
  validateOtelConfiguration
};