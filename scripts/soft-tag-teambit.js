const { execSync } = require('child_process');
const { SemVer } = require('semver');

const currentBitBinVersionInNpm = execSync('npm view bit-bin@dev version').toString();
console.log('currentBitBinVersionInNpm', currentBitBinVersionInNpm);

// const currentTeambitVersion = execSync('npm show @teambit/bit version').toString();
const currentTeambitVersion = '0.0.81'; // TEMP ONLY
console.log('currentTeambitVersion', currentTeambitVersion);
const teambitSemVer = new SemVer(currentTeambitVersion);
const nextTeambitSevVer = teambitSemVer.inc('patch');
const nextTeambitVersion = nextTeambitSevVer.version;
console.log('nextTeambitSemVer', nextTeambitVersion);

const currentBitBinVersionInNpmAgain = execSync('npm view bit-bin@dev version').toString();
console.log('currentBitBinVersionInNpmAgain', currentBitBinVersionInNpmAgain);

try {
  const output = execSync(`bit tag -a -s ${nextTeambitVersion}`);
  console.log(output.toString());
} catch (err) {
  console.log(err);
  process.exit(1);
}
