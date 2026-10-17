const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({structuredClone});vm.runInContext(fs.readFileSync(__dirname+'/../variation-core.js','utf8'),ctx);
ctx.categories=[{id:'g',name:'Gerät',scope:'global',options:[{id:'a',name:'Stange'},{id:'b',name:'Weste',extra:{unit:'kg'}}]},{id:'e',name:'Griff',scope:'exercise',exerciseId:'pull',options:[{id:'x',name:'Obergriff'}]},{id:'legacy',name:'Alt',options:[]}];
const run=s=>vm.runInContext(s,ctx);
assert.equal(run("KraftlogModel.filterCategories(categories,'all').length"),3);assert.equal(run("KraftlogModel.filterCategories(categories,'global').length"),2);assert.equal(run("KraftlogModel.filterCategories(categories,'exercise')[0].id"),'e');
ctx.copy=run('KraftlogModel.copyCategory(categories[0])');assert.equal(ctx.copy.id,undefined);assert.equal(ctx.copy.options[0].id,undefined);assert.equal(ctx.copy.name,'Gerät (Kopie)');ctx.copy.options[1].extra.unit='Sek.';ctx.copy.options.pop();assert.equal(ctx.categories[0].options[1].extra.unit,'kg');assert.equal(ctx.categories[0].options.length,2);
ctx.categories[1].scope='global';assert.equal(run("KraftlogModel.filterCategories(categories,'global').length"),3);assert.equal(run("KraftlogModel.filterCategories(categories,'exercise').length"),0);
console.log('PASS: scope filters, legacy globals, independent category copies and scope switching.');
