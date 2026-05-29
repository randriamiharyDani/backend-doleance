module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'votre_secret_key_ici_au_moins_32_caracteres',
    JWT_EXPIRE: '24h',
    BCRYPT_ROUNDS: 10
};