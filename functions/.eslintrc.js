module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true
  },
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:security/recommended",
    "google"
  ],
  plugins: [
    "import",
    "security"
  ],
  rules: {
    "quotes": ["error", "double", { "avoidEscape": true }],
    "indent": ["error", 2, { "SwitchCase": 1 }],
    "object-curly-spacing": ["error", "always"],
    "max-len": ["error", { 
      "code": 120,
      "ignoreComments": true,
      "ignoreUrls": true,
      "ignoreStrings": true,
      "ignoreTemplateLiterals": true
    }],
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "import/order": ["error", {
      "groups": [
        "builtin",
        "external",
        "internal",
        "parent",
        "sibling",
        "index"
      ],
      "newlines-between": "always"
    }],
    "security/detect-object-injection": "off",
    "no-console": "off",
    "camelcase": ["error", { 
      "allow": ["^unstable_"],
      "properties": "never"
    }]
  },
  parserOptions: {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  settings: {
    "import/resolver": {
      "node": {
        "extensions": [".js"],
        "moduleDirectory": ["node_modules", "src/"]
      }
    }
  }
};
