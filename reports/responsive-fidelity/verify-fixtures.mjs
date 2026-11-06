import {stripTypeScriptTypes} from 'node:module'
import vm from 'node:vm'
import {readFileSync,writeFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
const evaluate=source=>vm.runInNewContext('(()=>{'+stripTypeScriptTypes(source).replace(/^import.*$/gm,'').replace(/\bexport /g,'')+';return {createNftFixtures};})()')
const base=evaluate(execFileSync('git',['show','1945001:src/mocks/fixtures.ts'],{encoding:'utf8'})).createNftFixtures()
const current=evaluate(readFileSync('src/mocks/fixtures.ts','utf8')).createNftFixtures()
const before=JSON.stringify(base),after=JSON.stringify(current)
const result={base:'19450010cec6a9b09e7bbc9963d36bb1a7aae780',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),nfts:current.length,allFixtureFieldsUnchanged:before===after,beforeSha256:createHash('sha256').update(before).digest('hex'),afterSha256:createHash('sha256').update(after).digest('hex'),note:'Comparação integral das fixtures geradas, antes do enriquecimento de apresentação na API; sem reescrever IDs, preços, estoques, edições ou demais campos.'}
writeFileSync('reports/responsive-fidelity/fixture-preservation.json',JSON.stringify(result,null,2)+'\n');console.log(result)
