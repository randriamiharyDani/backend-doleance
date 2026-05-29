const bcrypt = require('bcryptjs');

const password = 'admincuasysteme';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('Mot de passe:', password);
console.log('Hash généré:', hash);
console.log('\nCopiez ce hash dans la base de données:');
console.log(hash);