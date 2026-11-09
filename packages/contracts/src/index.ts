export type ErrorEnvelope = {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    request_id: string;
  };
};

export type HealthResponse = {
  status: "ok";
  environment: string;
};

