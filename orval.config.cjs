const { defineConfig } = require("orval");

module.exports = defineConfig({
  r4: {
    input: {
      target: "http://127.0.0.1:8000/openapi.json",
    },
    output: {
      target: "src/services/api/generated/index.ts",
      schemas: "src/services/api/generated/schemas",
      client: "vue-query",
      httpClient: "fetch",
      mode: "tags-split",
      mock: false,
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: "src/services/api/custom-fetch.ts",
          name: "customFetch",
        },
      },
    },
  },
});
