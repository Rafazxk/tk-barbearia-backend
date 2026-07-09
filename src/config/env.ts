function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente "${name}" não encontrada.`);
  }

  return value;
}

export const env = {
  evolution: {
    apiUrl: getEnv("EVOLUTION_API_URL"),
    apiKey: getEnv("EVOLUTION_API_KEY"),
    instance: getEnv("EVOLUTION_INSTANCE"),
  },
};