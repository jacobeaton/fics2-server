module.exports = {
  rules: {
    semi: ["error", "never"],
    "no-underscore-dangle": ["error", { allow: ["_id", "_rev"] }]
  },
  extends: ["airbnb-base", "prettier"]
}
