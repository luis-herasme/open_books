export type Bindings = {
  API_KEY: string;
  R2_PUBLIC_URL: string;
  DB: D1Database;
  BUCKET: R2Bucket;
};

export type AppEnv = {
  Bindings: Bindings;
};
