module.exports = ({ config }) => {
  const session = process.env.ASANAVI_FIRST_RUN_SESSION;
  if (!session) return config;

  return {
    ...config,
    name: `${config.name}（初回テスト）`,
    slug: `${config.slug}-first-run-${session}`,
  };
};
